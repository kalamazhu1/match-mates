# Match Mates

A tennis event hosting platform where players can create tournaments, leagues, and social tennis events. Built for 4.0-5.0 NTRP level players in San Francisco.

## Features

- **Event Management**: Create and manage tournaments, leagues, and social tennis events
- **Player Registration**: Request-based registration system with organizer approval
- **Payment Processing**: Integrated Stripe payments for entry fees
- **Group Chat Integration**: Automatic WhatsApp/Telegram group creation
- **Skill-based Matching**: NTRP level filtering and matching
- **Court Locations**: SF Bay Area tennis court integration

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **UI Components**: Lucide React icons

## Prerequisites

Before running this project, make sure you have:

- Node.js 18.17 or later
- npm, yarn, pnpm, or bun
- A Supabase project
- A Stripe account
- (Optional) WhatsApp Business API access
- (Optional) Telegram Bot API access

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd match-mates
npm install
```

### 2. Environment Variables

Copy the environment template and fill in your values:

```bash
cp .env.example .env.local
```

#### Supabase Setup

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project" and create a new project
   - Wait for the project to be fully initialized

2. **Get your Supabase credentials**:
   - Navigate to **Project Settings > API** in your Supabase dashboard
   - Copy the following values:
     - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
     - **Project API keys > anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **Project API keys > service_role**: `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

3. **Update `.env.local`** with your actual values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key
```

#### Test Your Configuration

After setting up your environment variables, test the connection:

**Option 1: Command Line Test**
```bash
npm run test:supabase
```

**Option 2: Browser Test**
1. Start the development server: `npm run dev`
2. Visit: [http://localhost:3000/test-supabase](http://localhost:3000/test-supabase)
3. Click "Test Client Connection" or "Test Server Connection"

**Option 3: API Test**
```bash
curl http://localhost:3000/api/test-supabase
```

### 3. Database Setup

1. Navigate to the **SQL Editor** in your Supabase dashboard
2. Run the SQL schema from `database/schema.sql`
3. Test your connection using one of the methods described above

This will create:
- Users table (extends Supabase auth.users)
- Events table for tournaments, leagues, and social events
- Registrations table for player sign-ups
- Payments table for Stripe integration
- Row Level Security policies
- Database indexes for performance

### 4. Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your publishable and secret keys from the Stripe dashboard
3. Set up webhooks for payment confirmations (optional but recommended)

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

### Users Table
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  ntrp_level TEXT NOT NULL CHECK (ntrp_level IN ('3.0', '3.5', '4.0', '4.5', '5.0', '5.5')),
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Events Table
```sql
CREATE TABLE public.events (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('tournament', 'league', 'social')),
  format TEXT NOT NULL,
  skill_level_min TEXT NOT NULL,
  skill_level_max TEXT NOT NULL,
  location TEXT NOT NULL,
  date_start TIMESTAMP WITH TIME ZONE NOT NULL,
  date_end TIMESTAMP WITH TIME ZONE NOT NULL,
  registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  entry_fee INTEGER NOT NULL DEFAULT 0,
  max_participants INTEGER NOT NULL,
  organizer_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  whatsapp_group TEXT,
  telegram_group TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Registrations Table
```sql
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_intent_id TEXT,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, event_id)
);
```

### Payments Table
```sql
CREATE TABLE public.payments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL,
  registration_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── events/            # Event management
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── events/            # Event-related components
│   ├── payments/          # Payment components
│   └── ui/                # Reusable UI components
├── lib/                   # Utility libraries
│   ├── supabase/          # Supabase clients
│   ├── stripe.ts          # Stripe configuration
│   └── utils.ts           # Helper utilities
├── types/                 # TypeScript type definitions
└── middleware.ts          # Next.js middleware
```

## Next Steps

1. **Authentication Pages**: Create sign-up and sign-in forms
2. **Event Creation**: Build event creation and management interface
3. **Registration System**: Implement player registration and approval workflow
4. **Payment Integration**: Add Stripe payment processing
5. **Chat Integration**: Set up WhatsApp/Telegram group creation
6. **Dashboard**: Create user and organizer dashboards
7. **Testing**: Add unit and integration tests
8. **Deployment**: Deploy to Vercel or similar platform

## Development Workflow

1. Start the development server: `npm run dev`
2. Make changes to components in `src/components/`
3. Add new pages in `src/app/`
4. Update types in `src/types/`
5. Test authentication and database operations
6. Run type checking: `npm run type-check` (when available)
7. Run linting: `npm run lint`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For questions or issues:
- Check the documentation
- Review the database schema
- Test with sample data
- Contact the development team

---

Built with ❤️ for the San Francisco tennis community
