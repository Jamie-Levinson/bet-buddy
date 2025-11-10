# bet365 OCR Analysis - Additional Samples

## Sample 2: bet365_sgp+.jpeg (Same Game Parlay +)

### OCR Output:
```
Sat 08 Nov 22:38
bet365
$25.00 Same Game Parlay +
Lost
Share
SAME GAME PARLAY 2.05
Nikola Jokic: 10+ Assists
Assists
Nikola Jokic: 10+ Rebounds
Rebounds
GS Warriors
DEN Nuggets
SAME GAME PARLAY 4.60
Josh Giddey: 10+ Assists
Assists
Josh Giddey: 10+ Rebounds
Rebounds
CHI Bulls
MIL Bucks
104
129
110
126
Wager
Return
$25.00
$0.00
Returned $0.00
```

### Key Findings:
- **Multi-leg parlay**: Contains 2 separate same game parlays
- **Bet Type**: "Same Game Parlay +" (indicates multiple SGPs)
- **Leg Format**: Each leg shows "SAME GAME PARLAY X.XX" (odds) followed by player props
- **Player Props Format**: "Player Name: Threshold+ Stat Type"
- **Teams**: Shown after legs (GS Warriors, DEN Nuggets, etc.)
- **Scores**: Final scores shown (104, 129, 110, 126)
- **Result**: "Lost" status shown
- **Return**: "$0.00" (bet lost)

### Parsing Challenges:
- Multiple same game parlays in one bet slip
- Need to group legs by "SAME GAME PARLAY" sections
- Scores at bottom (not needed for parsing)

## Sample 3: bet365_sgp_boost.jpeg (Same Game Parlay with Boost)

### OCR Output:
```
Sat 08 Nov 22:38
bet365
$25.00 Same Game Parlay
Lost
Share
SAME GAME PARLAY 19.00
Isaiah Collier: 7+ Assists
Assists
Ace Bailey: 10+ Points
Points
Donte DiVincenzo: 4+ Threes Made
Threes Made
UTA Jazz
MIN Timberwolves
30% PROFIT BOOST
97
137
23
Wager
$25.00
Return
$0.00
Returned $0.00
```

### Key Findings:
- **Boost Modifier**: "30% PROFIT BOOST" clearly visible
- **Bet Type**: "Same Game Parlay" (no +)
- **Leg Format**: Same as other bet365 samples
- **Multiple Players**: 3 different players in same game parlay
- **Market Types**: Assists, Points, Threes Made
- **Teams**: UTA Jazz vs MIN Timberwolves

### Boost Detection:
- Pattern: "X% PROFIT BOOST" or "X% BOOST"
- Regex: `(\d+)%\s+(PROFIT\s+)?BOOST`
- This should map to `boostPercentage: 30`

### Market Type Mapping:
- "7+ Assists" → `PLAYER_ASSISTS` with qualifier `OVER` and threshold `7`
- "10+ Points" → `PLAYER_POINTS` with qualifier `OVER` and threshold `10`
- "4+ Threes Made" → `PLAYER_THREES` with qualifier `OVER` and threshold `4`

## bet365 Pattern Summary

### Consistent Patterns:
1. **Header**: Date/time at top, bet365 branding
2. **Bet Type Line**: `$X.XX Same Game Parlay [+/Boost]`
3. **Leg Sections**: Each starts with "SAME GAME PARLAY X.XX" (odds)
4. **Player Props**: `Player Name: Threshold+ Stat Type`
5. **Teams**: Shown after legs or at bottom
6. **Wager/Return**: Bottom section with "Wager $X.XX" and "Return $X.XX"
7. **Boost**: "X% PROFIT BOOST" text when present
8. **Result**: "Lost", "Won", "Pending" status

### Parsing Strategy:
1. Detect "bet365" for sportsbook
2. Extract bet type from "$X.XX Same Game Parlay [+/Boost]"
3. Find "SAME GAME PARLAY" sections to identify leg groups
4. Parse each leg: Player name, threshold, stat type
5. Extract teams from team abbreviations/full names
6. Look for boost percentage in "X% PROFIT BOOST"
7. Extract wager from "Wager $X.XX"
8. Extract return from "Return $X.XX" or "To Return $X.XX"
