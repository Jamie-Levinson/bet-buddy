# BetBuddy

A mobile-friendly PWA for tracking your sports bets and analyzing your betting history.

## Features

- **Manual Bet Entry**: Track straight bets, same game parlays, and parlays
- **Bet Management**: Create, edit, and delete bets with full leg tracking
- **Analytics Dashboard**: View profit/loss, win rate, ROI, and betting trends
- **Mobile-Friendly**: Responsive design optimized for mobile devices
- **PWA Support**: Install as a mobile app for easy access

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Authentication**: Supabase Auth
- **Charts**: Recharts
- **Form Management**: React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account

### Setup Instructions

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase**:
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your project URL and anon key
   - Go to Settings > Database to get your connection string

3. **Configure environment variables**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
   ```

4. **Set up the database**:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
betbuddy/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── bets/              # Bet management pages
│   ├── dashboard/         # Analytics dashboard
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── Analytics.tsx      # Analytics dashboard
│   ├── BetForm.tsx        # Bet entry form
│   └── BetList.tsx        # Bets list view
├── actions/               # Server Actions
│   ├── auth-actions.ts    # Authentication actions
│   └── bet-actions.ts     # Bet CRUD actions
├── lib/                   # Utility functions
│   ├── auth.ts            # Auth helpers
│   ├── prisma.ts          # Prisma client
│   ├── supabase.ts        # Supabase client
│   └── validations/        # Zod schemas
└── prisma/
    └── schema.prisma      # Database schema
```

## Database Schema

- **bets**: Main bet records with wager, payout, odds, result, and modifiers
- **legs**: Individual bet legs with description, event name, and odds
- **users**: Handled by Supabase Auth

## Features in Detail

### Bet Types
- **Straight**: Single leg from a single event
- **Same Game Parlay**: Multiple legs from the same event
- **Parlay**: Multiple legs from different events

### Modifiers
- **Bonus Bet**: Bet placed with credits (no real money)
- **Boost**: Percentage boost to original odds (25%, 30%, 50%, etc.)
- **No Sweat**: Refund as bonus bets if the bet loses

### Analytics
- Total wagered amount
- Total profit/loss
- Win rate percentage
- ROI (Return on Investment)
- Bet count by type
- Profit trend over time (last 30 days)

## Future Enhancements

- Screenshot upload and OCR parsing
- Share link parsing from sportsbooks
- Advanced analytics (unit sizing, EV calculations)
- Multiple sportsbook integrations
- Social features

## License

MIT
