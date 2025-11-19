# BetBuddy

> **⚠️ Work in Progress** — This project is actively under development. Currently building out a contextual memory engine using vector embeddings for intelligent bet history analysis.

A comprehensive sports betting analytics platform that helps users track bets, analyze performance, and gain insights through data-driven decision support. Built with modern web technologies and designed as a mobile-first PWA.

---

## 🎯 Project Overview

BetBuddy is a full-stack betting tracker and analytics platform that goes beyond simple record-keeping. The application provides:

- **Comprehensive Bet Tracking**: Support for straight bets, same-game parlays, and multi-leg parlays across NBA, NFL, NHL, and MLB
- **Advanced Analytics Dashboard**: Real-time profit/loss tracking, ROI analysis, win rate calculations, and performance breakdowns by sport, bet type, and sportsbook
- **Intelligent Insights**: Rule-based coaching system that identifies betting patterns, strengths, weaknesses, and provides actionable recommendations
- **Contextual Memory Engine** *(In Development)*: Vector embedding-based similarity search to surface relevant historical bets and patterns

---

## 🚀 Current Status

### ✅ Completed Features

- **Authentication & User Management**
  - Secure authentication via Supabase Auth
  - Password reset flow
  - User profile management with timezone and odds format preferences

- **Bet Management**
  - Full CRUD operations for bets
  - Support for multiple bet types (straight, SGP, parlay)
  - Complex leg tracking with event grouping
  - Bet modifiers (bonus bets, odds boosts, no-sweat promotions)
  - Sportsbook tracking (FanDuel, DraftKings, Bet365, Caesars, MGM, etc.)
  - Result tracking (pending, win, loss, void)

- **Analytics Dashboard**
  - **KPI Cards**: Net profit, ROI, win rate, average odds/risk
  - **Interactive Charts**: 
    - Cumulative profit over time (with 7-day default data points)
    - Sport + bet type breakdown (stacked bar charts)
  - **Performance Insights**: Best/worst markets, book performance analysis
  - **Summary Statistics**: Total bets, unsettled, wins, losses, average wager
  - **Filtering**: Date range (7d, 30d, Season, All time), Sport, Sportsbook
  - **Recent Bets Table**: Sortable table with bet details and results

- **UI/UX**
  - Responsive design optimized for mobile devices
  - PWA support for app-like experience
  - Modern glass-morphism design system
  - Accessible form validation with real-time feedback

### 🔨 Currently In Development

**Contextual Memory Engine**
- Implementing vector embeddings using sentence-transformers models from Hugging Face
- Storing bet vectors in Supabase PostgreSQL with pgvector extension
- Building similarity search functionality to:
  - Find similar historical bets based on context (sport, market, player, team, etc.)
  - Identify betting patterns and trends
  - Surface relevant context when making new bets
  - Provide personalized insights based on historical performance

**Goal**: Transform BetBuddy from a tracking tool into a decision hygiene and leak detection system that helps users make more informed betting decisions by leveraging their own historical data.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router) with React Server Components
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 with custom design system
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Charts**: Recharts for data visualization
- **Form Management**: React Hook Form + Zod validation
- **State Management**: React Server Components + Server Actions

### Backend
- **Database**: Supabase (PostgreSQL) with Prisma ORM
- **Authentication**: Supabase Auth
- **Server Actions**: Next.js Server Actions for API endpoints
- **Vector Storage**: PostgreSQL with pgvector extension (planned)

### ML/AI
- **Embeddings**: Sentence-transformers models from Hugging Face
- **Vector Search**: PostgreSQL pgvector for similarity queries

### Development Tools
- **Package Manager**: npm
- **Type Checking**: TypeScript
- **Linting**: ESLint
- **Database Migrations**: Prisma Migrate

---

## 📊 Key Features in Detail

### Bet Types Supported
- **Straight**: Single leg from a single event
- **Same Game Parlay (SGP)**: Multiple legs from the same event
- **Parlay**: Multiple legs from different events

### Market Coverage
- **Universal**: Moneyline, Spread, Totals, Team Totals
- **NBA**: Player props (points, rebounds, assists, PRA, etc.), team totals
- **NFL**: Player props (passing/rushing/receiving yards, TDs), team totals
- **MLB**: Player props (hits, HRs, RBIs), pitcher stats, run lines
- **NHL**: Player props (goals, assists, shots), goalie stats, puck lines

### Analytics Capabilities
- **Real-time Calculations**: Net profit, ROI, win rate, average odds
- **Time-based Analysis**: Profit trends over customizable date ranges
- **Multi-dimensional Breakdowns**: By sport, bet type, market, sportsbook
- **Performance Insights**: Best/worst performing markets and books
- **Pattern Detection**: Identifies streaks, hot/cold markets, betting leaks

---

## 🏗️ Architecture

### Project Structure
```
betbuddy/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Authentication routes
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── bets/                    # Bet management
│   │   ├── new/                 # Create bet
│   │   └── [id]/                # Edit bet
│   ├── dashboard/               # Analytics dashboard
│   └── account/                  # User settings
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── Dashboard*.tsx           # Dashboard components
│   ├── BetForm.tsx              # Bet entry form
│   └── BetCard.tsx              # Bet display card
├── actions/                      # Server Actions
│   ├── auth-actions.ts          # Authentication
│   ├── bet-actions.ts           # Bet CRUD
│   └── analytics-actions.ts     # Analytics aggregation
├── lib/                          # Utilities
│   ├── auth.ts                  # Auth helpers
│   ├── prisma.ts                # Prisma client
│   ├── supabase.ts              # Supabase client
│   ├── types/                   # TypeScript types
│   └── validations/             # Zod schemas
└── prisma/
    └── schema.prisma             # Database schema
```

### Data Flow
1. **Server Components** fetch data via Server Actions
2. **Server Actions** perform database queries using Prisma
3. **Aggregations** computed server-side using PostgreSQL functions
4. **Client Components** receive serialized data and handle interactivity
5. **URL Search Params** control filtering and state management

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Supabase account ([supabase.com](https://supabase.com))
- PostgreSQL database (via Supabase)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd betbuddy
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Supabase**:
   - Create a new Supabase project
   - Navigate to Settings > API to get your project URL and anon key
   - Navigate to Settings > Database to get your connection string

4. **Configure environment variables**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"  # For production, use your domain
   ```

5. **Set up the database**:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

6. **Run the development server**:
   ```bash
   npm run dev
   ```

7. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📈 Database Schema

### Core Models
- **User**: User profiles with preferences (timezone, odds format)
- **Bet**: Main bet records with wager, payout, odds, result, modifiers, sportsbook
- **LegGroup**: Groups legs by event (for same-game parlays)
- **Leg**: Individual bet legs with market, qualifier, threshold, event details
- **Team**: Team data for sports tracking
- **Game**: Game/match data

### Key Relationships
- User → Bets (one-to-many)
- Bet → LegGroups (one-to-many)
- LegGroup → Legs (one-to-many)
- Leg → Team (many-to-one, for team-based bets)

---

## 🎨 Design Philosophy

- **Mobile-First**: Optimized for mobile betting tracking on-the-go
- **Performance**: Server-side rendering and aggregation for fast load times
- **Accessibility**: WCAG-compliant components with keyboard navigation
- **Type Safety**: Full TypeScript coverage with Zod runtime validation
- **Developer Experience**: Clear separation of concerns, reusable components

---

## 🔮 Future Enhancements

- ✅ Contextual Memory Engine (In Progress)
- Advanced analytics (unit sizing, EV calculations, Kelly Criterion)
- OCR-based bet entry from screenshots
- Sportsbook API integrations for automatic bet import
- Social features (bet sharing, leaderboards)
- Mobile app (React Native)
- Real-time odds tracking and alerts

---

## 📝 License

MIT
