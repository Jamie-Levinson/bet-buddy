# ESPN API Sync Scripts Guide

This guide documents the patterns, gotchas, and best practices for syncing data from ESPN's unofficial API.

## Table of Contents

1. [ESPN API Overview](#espn-api-overview)
2. [Rate Limiting](#rate-limiting)
3. [Roster Structure Differences](#roster-structure-differences)
4. [Common Patterns](#common-patterns)
5. [Troubleshooting](#troubleshooting)

## ESPN API Overview

### Base URL
```
https://site.api.espn.com/apis/site/v2/sports
```

### Endpoints

**Teams:**
```
GET /{sport}/{league}/teams
```
- Returns all teams for a league
- Response structure: `{ sports: [{ leagues: [{ teams: [{ team: {...} }] }] }] }`
- Team IDs are strings (e.g., "1", "19", "22")

**Scoreboard:**
```
GET /{sport}/{league}/scoreboard?dates={YYYYMMDD}
```
- Returns games for specified date(s)
- Date format: `YYYYMMDD` (e.g., "20251107")
- **Important:** ESPN API does NOT support comma-separated dates. Fetch each date individually.
- Response includes: `leagues` (with season info), `events` (games)

**Roster:**
```
GET /{sport}/{league}/teams/{teamId}/roster
```
- Returns roster for a specific team
- Team ID is ESPN team ID (string format)
- Response structure varies by league (see Roster Structure Differences)

**Box Score:**
```
GET /{sport}/{league}/scoreboard/{eventId}
```
- Returns detailed stats for a completed game
- Event ID is ESPN event/game ID (string format)

### Sport/League Mappings

```typescript
const SPORT_MAPPING = {
  nba: "basketball",
  nfl: "football",
  mlb: "baseball",
  nhl: "hockey",
};

const LEAGUE_MAPPING = {
  nba: { sport: "basketball", league: "nba", leagueEnum: "NBA" },
  nfl: { sport: "football", league: "nfl", leagueEnum: "NFL" },
  mlb: { sport: "baseball", league: "mlb", leagueEnum: "MLB" },
  nhl: { sport: "hockey", league: "nhl", leagueEnum: "NHL" },
};
```

## Rate Limiting

**Critical:** ESPN API requires rate limiting to avoid being blocked.

**Implementation:**
- 1 second delay between requests minimum
- Use a shared `lastRequestTime` variable
- Calculate delay: `MIN_REQUEST_INTERVAL - (now - lastRequestTime)`

**Example:**
```typescript
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
  return fetch(url);
}
```

## Roster Structure Differences

### NBA Roster Structure

NBA rosters have a **flat structure** - athletes array contains player objects directly:

```typescript
{
  athletes: [
    {
      id: "4432573",
      fullName: "LeBron James",
      position: { abbreviation: "F" },
      // ... other fields
    },
    // ... more players
  ]
}
```

**Extraction:**
```typescript
const athletes = rosterData.athletes || [];
```

### NFL/MLB/NHL Roster Structure

NFL, MLB, and NHL rosters have a **nested structure** - athletes array contains position groups with nested items:

```typescript
{
  athletes: [
    {
      position: "offense", // or "Pitchers", etc.
      items: [
        {
          id: "3917376",
          fullName: "Tom Brady",
          position: { abbreviation: "QB" },
          // ... other fields
        },
        // ... more players in this position group
      ]
    },
    // ... more position groups
  ]
}
```

**Extraction:**
```typescript
// Check if first athlete has items (grouped structure)
if (rosterData.athletes[0]?.items && Array.isArray(rosterData.athletes[0].items)) {
  // Flatten grouped structure (NFL/MLB/NHL)
  athletes = rosterData.athletes.flatMap((group: any) => group.items || []);
} else {
  // Direct structure (NBA)
  athletes = rosterData.athletes;
}
```

### Position Field Differences

**NBA/NHL:**
- `position.abbreviation` (e.g., "F", "G", "C")

**NFL/MLB:**
- `position` can be a string (e.g., "offense", "Pitchers")
- Or `position.abbreviation` within items

**Handling:**
```typescript
let position: string | null = null;
if (espnPlayer.position) {
  if (typeof espnPlayer.position === "string") {
    position = espnPlayer.position;
  } else if (espnPlayer.position.abbreviation) {
    position = espnPlayer.position.abbreviation;
  } else if ((espnPlayer.position as any).name) {
    position = (espnPlayer.position as any).name;
  }
}
```

## Common Patterns

### Finding Last Final Game

Query the Game table for the most recent completed game:

```typescript
async function findLastFinalGame(league: LeagueEnum): Promise<Date | null> {
  const game = await prisma.game.findFirst({
    where: { league, status: "final" },
    orderBy: { startTime: "desc" },
  });
  return game ? game.startTime : null;
}
```

### Finding First Scheduled Game After Date

Find the next scheduled game, or use date + 1 day as fallback:

```typescript
async function findFirstScheduledAfter(league: LeagueEnum, date: Date): Promise<Date> {
  const game = await prisma.game.findFirst({
    where: { league, status: "scheduled", startTime: { gt: date } },
    orderBy: { startTime: "asc" },
  });
  return game ? game.startTime : new Date(date.getTime() + 24 * 60 * 60 * 1000);
}
```

### Getting Teams Playing on Specific Date

Query games for a date range and extract unique teams:

```typescript
async function getTeamsPlayingTomorrow(league: LeagueEnum): Promise<Team[]> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  
  const games = await prisma.game.findMany({
    where: {
      league,
      status: "scheduled",
      startTime: { gte: tomorrow, lt: dayAfter },
    },
    include: { homeTeam: true, awayTeam: true },
  });
  
  const teamIds = new Set<string>();
  games.forEach(game => {
    teamIds.add(game.homeTeamId);
    teamIds.add(game.awayTeamId);
  });
  
  return prisma.team.findMany({
    where: { id: { in: Array.from(teamIds) } },
  });
}
```

### Syncing Games for Date Range

**Important:** ESPN API does NOT support comma-separated dates. Fetch each date individually:

```typescript
const currentDate = new Date(startDate);
while (currentDate <= endDate) {
  const dateString = formatDateForESPN(currentDate); // YYYYMMDD format
  const response = await getScoreboard(league, dateString);
  // Process response.events
  currentDate.setDate(currentDate.getDate() + 1);
}
```

### Syncing Team Roster

1. Fetch roster from ESPN API
2. Extract athletes (handle nested structure)
3. For each player:
   - Find existing player by ESPN ID
   - Update teamId if changed (trade detected)
   - Create new player if doesn't exist
4. Check for removed players (set teamId to null)

```typescript
async function syncTeamRoster(league: ESPNLeague, teamEspnId: string) {
  // 1. Fetch roster
  const rosterData = await getTeamRoster(league, teamEspnId);
  
  // 2. Extract athletes (handle structure differences)
  let athletes: any[] = [];
  if (rosterData?.athletes) {
    if (rosterData.athletes[0]?.items && Array.isArray(rosterData.athletes[0].items)) {
      athletes = rosterData.athletes.flatMap((group: any) => group.items || []);
    } else {
      athletes = rosterData.athletes;
    }
  }
  
  // 3. Process each player
  for (const espnPlayer of athletes) {
    const existingPlayer = await prisma.player.findUnique({
      where: { espnId: espnPlayer.id },
    });
    
    if (existingPlayer) {
      // Update if team changed
      if (existingPlayer.teamId !== teamId) {
        await prisma.player.update({
          where: { id: existingPlayer.id },
          data: { teamId },
        });
      }
    } else {
      // Create new player
      await prisma.player.create({
        data: {
          league: mapping.leagueEnum,
          espnId: espnPlayer.id,
          fullName: espnPlayer.fullName,
          position: extractPosition(espnPlayer),
          teamId,
        },
      });
    }
  }
  
  // 4. Check for removed players
  const currentPlayerEspnIds = new Set(athletes.map(a => a.id));
  await prisma.player.updateMany({
    where: { teamId, espnId: { notIn: Array.from(currentPlayerEspnIds) } },
    data: { teamId: null },
  });
}
```

### Date Formatting

ESPN API requires dates in `YYYYMMDD` format:

```typescript
export function formatDateForESPN(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}
```

### Game Status Mapping

Map ESPN status to our database status:

```typescript
function getGameStatus(status: ESPNStatus): string {
  const statusName = status.type.name;
  const state = status.type.state;
  const completed = status.type.completed;
  
  if (completed || state === "post") {
    return "final";
  }
  
  if (state === "in") {
    return "in_progress";
  }
  
  if (statusName.includes("SCHEDULED") || state === "pre") {
    return "scheduled";
  }
  
  return "unknown";
}
```

### Extracting Period Scores

Period scores are in `competitor.linescores` array:

```typescript
const homeLinescores = homeCompetitor.linescores || [];
const awayLinescores = awayCompetitor.linescores || [];

// Determine regulation periods
const regulationPeriods = league === "nhl" ? 3 : 4; // NHL has 3 periods, NBA/NFL have 4 quarters

// Check for overtime
const wentToOvertime = homeLinescores.length > regulationPeriods || 
                       awayLinescores.length > regulationPeriods;

// Extract scores
const homePeriodScores = homeLinescores.map(ls => ls.value || parseInt(ls.displayValue, 10) || 0);
const awayPeriodScores = awayLinescores.map(ls => ls.value || parseInt(ls.displayValue, 10) || 0);
```

## Troubleshooting

### Issue: 400 Bad Request when fetching scoreboard

**Cause:** ESPN API does not support comma-separated dates.

**Solution:** Fetch each date individually in a loop.

### Issue: Players not syncing for NFL/MLB/NHL

**Cause:** Roster structure is nested (athletes grouped by position).

**Solution:** Check if first athlete has `items` array and flatten:
```typescript
if (rosterData.athletes[0]?.items) {
  athletes = rosterData.athletes.flatMap(group => group.items || []);
}
```

### Issue: Team overwrites (e.g., "NBA: Toronto Blue Jays")

**Cause:** ESPN IDs overlap across leagues, but unique constraint was only on `espnId`.

**Solution:** Use composite unique constraint: `@@unique([espnId, league])`

### Issue: Rate limiting errors

**Cause:** Too many requests too quickly.

**Solution:** Ensure 1 second delay between all API requests. Use shared `lastRequestTime` variable.

### Issue: Position field is null

**Cause:** Position format varies by league (string vs object).

**Solution:** Check both formats:
```typescript
if (typeof position === "string") {
  // Use directly
} else if (position.abbreviation) {
  // Use abbreviation
}
```

### Issue: Games syncing but scores not updating

**Cause:** Only syncing scheduled games, not completed ones.

**Solution:** Filter by `competition.status.type.completed === true` when syncing past dates.

## Best Practices

1. **Always rate limit:** 1 second minimum between requests
2. **Handle structure differences:** Check for nested roster structures
3. **Use composite unique constraints:** For entities that exist across leagues (teams)
4. **Filter completed games:** Only sync games with `status.type.completed === true` for past dates
5. **Error handling:** Continue with next item if one fails, don't stop entire sync
6. **Progress logging:** Log progress every 10 items or so for long-running syncs
7. **Date handling:** Always use `formatDateForESPN` for API calls
8. **Team lookups:** Build ESPN ID → DB ID map before syncing games/players

## Example: Creating a New Sync Script

```typescript
import { PrismaClient } from "@prisma/client";
import { getScoreboard, formatDateForESPN } from "./lib/sports-api/espn-client";
import { LEAGUE_MAPPING } from "./lib/sports-api/types";

const prisma = new PrismaClient();

async function syncNewData(league: "nba" | "nfl" | "nhl") {
  const mapping = LEAGUE_MAPPING[league];
  
  // 1. Get teams for league
  const teams = await prisma.team.findMany({
    where: { league: mapping.leagueEnum },
  });
  
  // 2. Build ESPN ID → DB ID map
  const teamsByEspnId = new Map<string, string>();
  teams.forEach(team => {
    if (team.espnId) {
      teamsByEspnId.set(team.espnId, team.id);
    }
  });
  
  // 3. Fetch data from ESPN API (with rate limiting)
  const today = new Date();
  const dateString = formatDateForESPN(today);
  const response = await getScoreboard(league, dateString);
  
  // 4. Process data
  for (const event of response.events) {
    // Process each event
  }
  
  // 5. Cleanup
  await prisma.$disconnect();
}
```

