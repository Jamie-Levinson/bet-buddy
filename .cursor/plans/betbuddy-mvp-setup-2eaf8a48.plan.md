<!-- 2eaf8a48-51bb-40d5-9c67-c8226566fcf8 99613a5e-f731-4025-97e7-f43dabd26b52 -->
# Same Game Parlay Leg Groups Implementation

## Overview

Restructure bets to use leg groups, where legs are grouped together and odds are stored at the group level. This properly models same game parlays (single group) and same game parlay+ (multiple groups parlayed together).

## Database Schema Changes

### 1. Create `LegGroup` model

- Add `LegGroup` table with:
  - `id` (UUID, primary key)
  - `betId` (foreign key to Bet, required)
  - `odds` (Decimal, required) - odds for this group
  - `gameId` (foreign key to Game, nullable) - for SGP detection
  - `order` (Int, optional) - for ordering groups in SGP+
  - `createdAt`, `updatedAt` timestamps
- Add relation: `Bet.legGroups` → `LegGroup[]`
- Add relation: `LegGroup.bet` → `Bet`
- Add relation: `LegGroup.game` → `Game?`
- Add relation: `LegGroup.legs` → `Leg[]`

### 2. Update `Leg` model

- Add `legGroupId` (foreign key to LegGroup, required)
- Remove `odds` field from `Leg` (odds now at group level)
- Add relation: `Leg.legGroup` → `LegGroup`

### 3. Update `BetType` enum

- Add `same_game_parlay_plus` to enum values

### 4. Migration

- Create migration to add `leg_groups` table
- Create migration to add `leg_group_id` to `legs` table
- Create migration to remove `odds` from `legs` table
- Create migration to add `same_game_parlay_plus` to `BetType` enum

## Validation Schema Updates

### 5. Update `lib/validations/bet.ts`

- Create `legGroupSchema`:
  - `gameId` (string, optional for SGP detection)
  - `odds` (number, required, min 1.01)
  - `legs` (array of legSchema, min 1)
- Update `betFormSchema`:
  - Change `legs` to `legGroups` (array of legGroupSchema, min 1)
  - Update transform to:
    - Calculate bet type: single group with multiple legs → `same_game_parlay`, multiple groups → `same_game_parlay_plus`, single group with one leg → `straight`
    - Calculate bet odds: multiply all group odds
    - Calculate bet date: use most future date from all legs

## Business Logic Updates

### 6. Update `lib/bet-helpers.ts`

- Update `calculateBetOdds` to accept groups instead of legs:
  ```typescript
  function calculateBetOdds(groups: { odds: number }[]): number
  ```

- Update `calculateBetResult` to work with groups (check all legs in all groups)
- Update `getBetTypeLabel` to handle `same_game_parlay_plus`

### 7. Update `actions/bet-actions.ts`

- Update `buildLegPayload` to not include odds (odds at group level)
- Update `createBet`:
  - Create bet with calculated odds from groups
  - Create leg groups first
  - Create legs linked to their groups
  - Auto-detect bet type from group structure
- Update `updateBet` similarly
- Update `getBet` to include leg groups with legs nested
- Update `getBets` to include leg groups

## UI Form Updates

### 8. Update `components/BetForm.tsx`

- Add state for managing leg groups:
  - `legGroups: Array<{ id: string, gameId?: string, odds: string, legs: LegFormData[] }>`
- Add UI for:
  - Creating new leg groups
  - Adding legs to groups
  - Moving legs between groups
  - Inputting odds per group (not per leg)
  - Visual grouping indicators
- Update form submission to structure data as groups
- Hide leg-level odds input for grouped legs
- Show group-level odds input
- Update `calculatedBetType` to detect from groups
- Update `calculatedOdds` to multiply group odds

## Display Updates

### 9. Update `components/BetCard.tsx`

- Change to accept `LegGroup` instead of `Bet`
- Display one card per leg group
- Layout:
  - Odds top right
  - Leg descriptions stacked vertically on left
  - Event name at bottom left
- Remove bet-level display (handled by BetList)

### 10. Update `components/BetList.tsx`

- Map over leg groups instead of bets
- For each bet, render one `BetCard` per leg group
- Group cards visually (e.g., "SGP+ Part 1", "SGP+ Part 2")

### 11. Update `components/LegCard.tsx`

- Remove odds display (odds at group level)
- Keep leg description and event info

### 12. Update serialization (`lib/serialize.ts`)

- Update `SerializedBetWithLegs` type to include `legGroups`
- Update `serializeBet` to include groups with nested legs

## Type Updates

### 13. Update TypeScript types

- Update `SerializedBetWithLegs` to include leg groups
- Create `SerializedLegGroup` type
- Update all components using bet types

## Testing Considerations

### 14. Test cases to verify

- Straight bet: single leg in single group
- SGP: multiple legs in single group
- SGP+: multiple groups, each with multiple legs
- Odds calculation: groups multiply correctly
- Bet type detection: correct enum value
- UI: groups display correctly, odds input at group level

## Files to Modify

1. `prisma/schema.prisma` - Add LegGroup model, update Leg and BetType
2. `lib/validations/bet.ts` - Add legGroupSchema, update betFormSchema
3. `lib/bet-helpers.ts` - Update calculateBetOdds, calculateBetResult
4. `actions/bet-actions.ts` - Update all bet CRUD operations
5. `components/BetForm.tsx` - Complete rewrite for group management
6. `components/BetCard.tsx` - Update to display groups
7. `components/BetList.tsx` - Update to map over groups
8. `components/LegCard.tsx` - Remove odds display
9. `lib/serialize.ts` - Update serialization types and functions
10. Create migration files for schema changes

### To-dos

- [ ] Set up Supabase project, install Prisma, and configure database connection
- [ ] Define Prisma schema for bets, legs, and users tables, then run migrations
- [ ] Configure Supabase Auth and create login/signup pages
- [ ] Create bet entry form component with all fields (wager, payout, odds, legs, modifiers)
- [ ] Implement Server Actions for creating, reading, updating, and deleting bets
- [ ] Create bets list page with filtering, sorting, and pagination
- [ ] Create analytics dashboard with profit/loss calculations, win rate, and basic charts
- [ ] Create LegGroup model in schema.prisma with betId, odds, gameId, order fields
- [ ] Update Leg model: add legGroupId (required), remove odds field
- [ ] Add same_game_parlay_plus to BetType enum
- [ ] Create Prisma migration for leg groups, leg updates, and bet type enum
- [ ] Create legGroupSchema in lib/validations/bet.ts with gameId, odds, legs array
- [ ] Update betFormSchema to use legGroups instead of legs, update transform logic
- [ ] Update calculateBetOdds in lib/bet-helpers.ts to accept groups and multiply group odds
- [ ] Update calculateBetResult to work with groups (check all legs in all groups)
- [ ] Update createBet to create leg groups first, then legs linked to groups
- [ ] Update getBet and getBets to include leg groups with nested legs
- [ ] Update updateBet to handle leg groups structure
- [ ] Update SerializedBetWithLegs type to include legGroups in lib/serialize.ts
- [ ] Update serializeBet function to include groups with nested legs
- [ ] Add leg groups state management to BetForm.tsx
- [ ] Add UI for creating/managing leg groups, group-level odds input in BetForm.tsx
- [ ] Update BetCard to accept and display LegGroup (odds top right, legs stacked left)
- [ ] Update BetList to map over leg groups and render one BetCard per group
- [ ] Remove odds display from LegCard (odds at group level now)