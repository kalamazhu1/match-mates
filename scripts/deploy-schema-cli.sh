#!/bin/bash

# Database Schema Deployment Script for Supabase (CLI-based)
# This script uses the Supabase CLI for reliable schema deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SCHEMA_FILE="$PROJECT_DIR/database/schema.sql"

echo -e "${BLUE}🚀 Supabase Schema Deployment Script${NC}"
echo "======================================"

# Check if schema file exists
if [[ ! -f "$SCHEMA_FILE" ]]; then
    echo -e "${RED}❌ Schema file not found: $SCHEMA_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Schema file found: $SCHEMA_FILE${NC}"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed.${NC}"
    echo "Please install it with: npm install -g supabase"
    echo "Or visit: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI is installed${NC}"

# Check if we're in a Supabase project
if [[ ! -f "$PROJECT_DIR/supabase/config.toml" ]]; then
    echo -e "${YELLOW}⚠️  Supabase project not initialized${NC}"
    echo "Initializing Supabase project..."
    
    cd "$PROJECT_DIR"
    supabase init
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ Supabase project initialized${NC}"
    else
        echo -e "${RED}❌ Failed to initialize Supabase project${NC}"
        exit 1
    fi
fi

# Function to deploy schema
deploy_schema() {
    echo -e "\n${BLUE}📋 Deploying schema to Supabase...${NC}"
    
    cd "$PROJECT_DIR"
    
    # Check if we have a database connection
    if [[ -z "$SUPABASE_DB_URL" && -z "$DB_URL" ]]; then
        echo -e "${YELLOW}⚠️  No database connection string found${NC}"
        echo "Please set SUPABASE_DB_URL or DB_URL environment variable"
        echo "Example: export SUPABASE_DB_URL='postgresql://postgres:[password]@[host]:5432/postgres'"
        echo ""
        echo "Or link to a remote Supabase project:"
        echo "supabase link --project-ref [your-project-ref]"
        return 1
    fi
    
    # Use psql to execute the schema
    if command -v psql &> /dev/null; then
        echo -e "${BLUE}Using psql to deploy schema...${NC}"
        
        DB_CONNECTION="${SUPABASE_DB_URL:-$DB_URL}"
        
        if psql "$DB_CONNECTION" -f "$SCHEMA_FILE"; then
            echo -e "${GREEN}✅ Schema deployed successfully using psql${NC}"
            return 0
        else
            echo -e "${RED}❌ Schema deployment failed${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ psql is not available for schema deployment${NC}"
        return 1
    fi
}

# Function to verify schema deployment
verify_schema() {
    echo -e "\n${BLUE}🔍 Verifying schema deployment...${NC}"
    
    cd "$PROJECT_DIR"
    
    # Create a verification SQL script
    VERIFY_SQL="/tmp/verify_schema.sql"
    
    cat > "$VERIFY_SQL" << 'EOF'
-- Verification queries
\echo '=== UUID Extension ==='
SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') as uuid_extension_exists;

\echo '=== Tables ==='
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'events', 'registrations', 'payments')
ORDER BY table_name;

\echo '=== Row Level Security ==='
SELECT 
    tablename,
    row_security as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'events', 'registrations', 'payments')
ORDER BY tablename;

\echo '=== Policies ==='
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as command
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

\echo '=== Triggers ==='
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

\echo '=== Indexes ==='
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

\echo '=== Functions ==='
SELECT 
    proname as function_name,
    pronargs as arg_count
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;
EOF

    if [[ -n "$SUPABASE_DB_URL" || -n "$DB_URL" ]]; then
        DB_CONNECTION="${SUPABASE_DB_URL:-$DB_URL}"
        
        if psql "$DB_CONNECTION" -f "$VERIFY_SQL"; then
            echo -e "${GREEN}✅ Schema verification completed${NC}"
            rm -f "$VERIFY_SQL"
            return 0
        else
            echo -e "${RED}❌ Schema verification failed${NC}"
            rm -f "$VERIFY_SQL"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  Cannot verify schema without database connection${NC}"
        rm -f "$VERIFY_SQL"
        return 1
    fi
}

# Function to show manual deployment instructions
show_manual_instructions() {
    echo -e "\n${BLUE}📋 Manual Deployment Instructions${NC}"
    echo "=================================="
    echo ""
    echo "If automated deployment fails, you can manually deploy the schema:"
    echo ""
    echo "1. Connect to your Supabase project in the dashboard"
    echo "2. Go to the SQL Editor"
    echo "3. Copy and paste the contents of: $SCHEMA_FILE"
    echo "4. Execute the SQL statements"
    echo ""
    echo "Or use psql directly:"
    echo "  psql 'your-supabase-connection-string' -f '$SCHEMA_FILE'"
    echo ""
    echo "Connection string format:"
    echo "  postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
}

# Main execution
case "${1:-deploy}" in
    "deploy")
        if deploy_schema; then
            echo -e "\n${GREEN}🎉 Schema deployment completed successfully!${NC}"
        else
            echo -e "\n${RED}💥 Schema deployment failed!${NC}"
            show_manual_instructions
            exit 1
        fi
        ;;
    "verify")
        verify_schema
        ;;
    "deploy-and-verify")
        if deploy_schema; then
            verify_schema
        else
            echo -e "\n${RED}💥 Deployment failed, skipping verification${NC}"
            show_manual_instructions
            exit 1
        fi
        ;;
    "manual")
        show_manual_instructions
        ;;
    *)
        echo "Usage: $0 [deploy|verify|deploy-and-verify|manual]"
        echo ""
        echo "Commands:"
        echo "  deploy              - Deploy the schema to Supabase"
        echo "  verify              - Verify the schema deployment"
        echo "  deploy-and-verify   - Deploy and then verify"
        echo "  manual              - Show manual deployment instructions"
        exit 1
        ;;
esac