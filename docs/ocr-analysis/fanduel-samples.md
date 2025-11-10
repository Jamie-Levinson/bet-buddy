# FanDuel OCR Analysis

## Sample 1: FanDuel_sgp.jpg (Same Game Parlay)

### OCR Output:
```
SGP Same Game Parlay™
Miles Bridges To Record 10+ Assists, Miles Bridges To Record
10+ Rebounds
58.35
Charlotte Hornets
Miami Heat
33 36 19 20 108
Finished
53 19 22 32 126
Box Score > Play-by-play >
HORNETS
HORNETS
Miles Bridges
TO RECORD 10+ ASSISTS
Miles Bridges
TO RECORD 10+ REBOUNDS
$5.00
TOTAL WAGER
BET ID: 0/0176229/0002891
$0.00
RETURNED
PLACED: 11/7/2025 6:28PM ET
```

### Key Findings:
- **Bet Type**: "SGP Same Game Parlay™" at top
- **Odds**: "58.35" shown prominently (decimal format)
- **Leg Format**: "Player Name To Record Threshold+ Stat Type"
- **Multiple Legs**: Shown both in summary line and detailed sections
- **Teams**: "Charlotte Hornets" vs "Miami Heat"
- **Wager**: "$5.00 TOTAL WAGER"
- **Return**: "$0.00 RETURNED" (bet lost)
- **Bet ID**: "BET ID: 0/0176229/0002891"
- **Date**: "PLACED: 11/7/2025 6:28PM ET"
- **Result**: "Finished" status
- **Scores**: Quarter scores shown (33 36 19 20 108)

### FanDuel Layout Patterns:
1. **Header**: "SGP Same Game Parlay™" with odds
2. **Summary Line**: All legs in one line separated by commas
3. **Detailed Legs**: Each leg shown separately with "TO RECORD/TO SCORE"
4. **Teams**: Full team names (not abbreviations)
5. **Wager/Return**: "TOTAL WAGER" and "RETURNED" labels
6. **Bet ID**: Always present for tracking
7. **Date Format**: "PLACED: MM/DD/YYYY HH:MM AM/PM ET"

## Sample 2: FanDuel_sgp2.jpg (Same Game Parlay - Active)

### OCR Output:
```
SGP Same Game Parlay™
22.06
James Harden To Score 30+ Points, Jalen Green To Score 20+
Points, Devin Booker To Record 8+ Assists
Phoenix Suns @ Los Angeles Clippers
James Harden
TO SCORE 30+ POINTS
Jalen Green
TO SCORE 20+ POINTS
Devin Booker
TO RECORD 8+ ASSISTS
10:40PM ET
Follow bet on Lock Screen
$25.00
TOTAL WAGER
Cash out $25.00
$551.45
TOTAL PAYOUT
```

### Key Findings:
- **Active Bet**: No "Finished" status, shows "Follow bet on Lock Screen"
- **Odds**: "22.06" (decimal)
- **Leg Format**: Same as sample 1
- **Teams**: "Phoenix Suns @ Los Angeles Clippers" (uses @ instead of vs)
- **Game Time**: "10:40PM ET" shown
- **Cash Out**: "Cash out $25.00" option available
- **Payout**: "$551.45 TOTAL PAYOUT" (potential payout, not returned)
- **Multiple Players**: 3 different players

### Differences from Sample 1:
- Active bet (no result status)
- Shows "TOTAL PAYOUT" instead of "RETURNED"
- Has "Cash out" option
- Game time shown instead of placed date

## Sample 3: FanDuel_sgp+_boost.jpg (Same Game Parlay+ with Boost)

### OCR Output:
```
SGP +3 leg Same Game Parlay+
39.08 54.31
PROFIT BOOST 40%
Includes: 1 Same Game Parlay™ + 1 selection
SGP Same Game Parlay™
7.11
Toronto Raptors
43 20 34 23 120
Finished
Philadelphia 76ers
33 35 33 29 130
Immanuel Quickley
TO SCORE 20+ POINTS
Tyrese Maxey
22
20
20
76
TO RECORD 8+ ASSISTS
7
8
Lonzo Ball
TO RECORD 8+ ASSISTS
4
8
6.14
Chicago Bulls
Cleveland Cavaliers
32 24 40 29 125
29 43 26 24 122
LIVE
4th - 0:12
$20.00
TOTAL WAGER
$0.00
RETURNED
```

### Key Findings:
- **Complex Bet**: "SGP +3 leg Same Game Parlay+" - contains multiple SGPs + additional selections
- **Boost**: "PROFIT BOOST 40%" clearly shown
- **Multiple Odds**: "39.08 54.31" (showing odds for different parts)
- **Includes Breakdown**: "Includes: 1 Same Game Parlay™ + 1 selection"
- **Multiple Games**: Two different games shown
- **Live Bet**: One game shows "LIVE 4th - 0:12" (in progress)
- **Finished Game**: One game shows "Finished" with scores
- **Player Stats**: Shows actual stats achieved (22, 20, 20, 76, etc.)

### Boost Detection:
- Pattern: "PROFIT BOOST X%" or "X% PROFIT BOOST"
- Regex: `(PROFIT\s+BOOST|BOOST)\s+(\d+)%` or `(\d+)%\s+(PROFIT\s+)?BOOST`
- This should map to `boostPercentage: 40`

### Complex Bet Structure:
- "SGP +3 leg" indicates Same Game Parlay plus 3 additional legs
- Need to parse multiple SGP sections
- Each SGP has its own odds (7.11, 6.14)
- Overall odds shown at top (39.08, 54.31)

## FanDuel Pattern Summary

### Consistent Patterns:
1. **Header**: "SGP Same Game Parlay™" with odds
2. **Summary Line**: All legs comma-separated in one line
3. **Leg Format**: "Player Name To [Score/Record] Threshold+ Stat Type"
4. **Detailed Sections**: Each leg shown separately
5. **Teams**: Full names with "@" separator
6. **Wager**: "$X.XX TOTAL WAGER"
7. **Payout/Return**: "$X.XX TOTAL PAYOUT" (active) or "$X.XX RETURNED" (finished)
8. **Bet ID**: Always present
9. **Date/Time**: "PLACED: MM/DD/YYYY HH:MM AM/PM ET" or game time

### Parsing Strategy:
1. Detect "SGP" or "FanDuel" for sportsbook
2. Extract odds from header (decimal format)
3. Parse summary line to get all legs
4. Extract player names, thresholds, stat types
5. Parse teams from full names
6. Extract wager from "TOTAL WAGER"
7. Extract payout from "TOTAL PAYOUT" or "RETURNED"
8. Look for boost indicators
9. Parse date/time format

### Market Type Mapping:
- "To Score X+ Points" → `PLAYER_POINTS` with `OVER` and threshold `X`
- "To Record X+ Assists" → `PLAYER_ASSISTS` with `OVER` and threshold `X`
- "To Record X+ Rebounds" → `PLAYER_REBOUNDS` with `OVER` and threshold `X`

