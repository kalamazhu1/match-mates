# Database Schema Deployment Guide

This guide provides instructions for deploying the Match Mates database schema to your Supabase instance.

## 📋 Overview

The Match Mates application uses a PostgreSQL database hosted on Supabase with the following components:

- **4 Main Tables**: users, events, registrations, payments
- **Row Level Security (RLS)**: Comprehensive security policies
- **Triggers**: Automatic timestamp updates
- **Indexes**: Performance optimization
- **Constraints**: Data integrity enforcement
- **Extensions**: UUID generation support

## 🚀 Quick Start

### Prerequisites

1. **Supabase Account**: Create a project at [supabase.com](https://supabase.com)
2. **Environment Variables**: Configure your connection details
3. **Database Access**: Ensure you have the service role key

### Environment Setup

```bash
# Required environment variables
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Optional: Direct database connection
export SUPABASE_DB_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres"
```

## 🛠️ Deployment Methods

### Method 1: Automated Script (Recommended)

Use the automated deployment script for the easiest experience:

```bash
# Make sure you're in the project root
cd /Users/kalamazhu/match-mates

# Deploy the schema
./scripts/deploy-schema-cli.sh deploy

# Verify deployment
./scripts/deploy-schema-cli.sh verify

# Or do both at once
./scripts/deploy-schema-cli.sh deploy-and-verify
```

### Method 2: Node.js Script

For programmatic deployment:

```bash
# Deploy using Node.js script
node scripts/deploy-schema.js deploy

# Verify deployment
node scripts/validate-schema.js
```

### Method 3: Manual Deployment

If automated methods fail, deploy manually:

1. **Copy the schema content**:
   ```bash
   cat database/schema.sql
   ```

2. **Open Supabase Dashboard**:
   - Go to your project dashboard
   - Navigate to "SQL Editor"

3. **Execute the schema**:
   - Paste the entire schema.sql content
   - Click "Run" to execute

4. **Verify deployment**:
   ```bash
   node scripts/validate-schema.js
   ```

### Method 4: Using psql directly

If you have PostgreSQL client tools:

```bash
# Using connection string
psql "$SUPABASE_DB_URL" -f database/schema.sql

# Or with individual parameters
psql -h db.your-project.supabase.co -p 5432 -U postgres -d postgres -f database/schema.sql
```

## 🔍 Verification

After deployment, verify your schema using our validation script:

```bash
node scripts/validate-schema.js
```

The validation checks:
- ✅ Database connection
- ✅ Table existence and structure
- ✅ Row Level Security policies
- ✅ Data integrity constraints

## 📊 Schema Components

### Tables Created

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User profiles | Links to Supabase auth, NTRP levels |
| `events` | Tennis events | Tournaments, leagues, social events |
| `registrations` | Event signups | User-event relationships |
| `payments` | Payment tracking | Stripe integration support |

### Security Features

- **Row Level Security (RLS)**: Enabled on all tables
- **Authentication-based Access**: Users can only see their own data
- **Organizer Permissions**: Event organizers can manage their events
- **Public Event Visibility**: Open events are publicly readable

### Performance Optimizations

- **Indexes**: Created on frequently queried columns
- **Foreign Keys**: Proper relationships with cascading deletes
- **Constraints**: Data validation at database level

### Automatic Features

- **UUID Generation**: Uses uuid-ossp extension
- **Timestamp Triggers**: Auto-update modified timestamps
- **Data Validation**: CHECK constraints for enums

## 🐛 Troubleshooting

### Common Issues

1. **Connection Failures**:
   ```
   ❌ Missing required environment variables
   ```
   - **Solution**: Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

2. **Permission Denied**:
   ```
   ❌ permission denied for schema public
   ```
   - **Solution**: Use service role key, not anon key for deployment

3. **Table Already Exists**:
   ```
   ❌ relation "users" already exists
   ```
   - **Solution**: Schema is already deployed, run verification instead

4. **RLS Blocking Queries**:
   ```
   ❌ permission denied for table users
   ```
   - **Solution**: This is expected behavior - RLS is working correctly

### Getting Help

1. **Check Script Output**: Deployment scripts provide detailed error messages
2. **Verify Environment**: Ensure all environment variables are set
3. **Manual Deployment**: Use the Supabase dashboard SQL editor as fallback
4. **Validation Script**: Run validation to identify specific issues

## 📝 Manual Verification Checklist

After deployment, manually verify these components:

### ✅ Extensions
- [ ] UUID extension (`uuid-ossp`) is installed

### ✅ Tables
- [ ] `public.users` table exists
- [ ] `public.events` table exists  
- [ ] `public.registrations` table exists
- [ ] `public.payments` table exists

### ✅ Row Level Security
- [ ] RLS is enabled on all tables
- [ ] Policies are created and active
- [ ] Unauthenticated access is properly restricted

### ✅ Triggers and Functions
- [ ] `update_updated_at_column()` function exists
- [ ] Triggers are attached to tables with `updated_at` columns

### ✅ Indexes
- [ ] Performance indexes are created (`idx_*` pattern)
- [ ] Foreign key relationships are indexed

## 🔄 Schema Updates

For future schema changes:

1. **Create Migration Scripts**: Don't modify the base schema.sql
2. **Test in Development**: Always test changes in a development environment
3. **Backup Production**: Create backups before applying changes
4. **Use Transactions**: Wrap changes in transactions for rollback capability

## 🏗️ Development Workflow

For local development with Supabase:

```bash
# Initialize local Supabase (optional)
supabase init
supabase start

# Apply schema to local instance
supabase db reset

# Deploy to remote when ready
./scripts/deploy-schema-cli.sh deploy
```

## 📞 Support

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://postgresql.org/docs
- **Project Issues**: Check the repository issues for common problems

---

*Last updated: 2025-08-07*
*Schema version: 1.0.0*