# Database Migration Guide

## What's Missing from Your Current Database

Based on your current database schema, here's what needs to be added or updated:

### Missing Tables (3)
1. **notifications** - For user notifications (replies, status changes, assignments)
2. **password_reset_tokens** - For password reset functionality
3. **admin_requests** - For Data Science team to contact admin

### Missing Columns

#### `users` table:
- ❌ `updated_at` - Timestamp for when user record was last updated

#### `teams` table:
- ❌ `updated_at` - Timestamp for when team record was last updated

#### `dashboards` table:
- ❌ `assigned_team_id` - Foreign key to teams table
- ❌ `updated_at` - Timestamp for when dashboard was last updated

#### `charts` table:
- ❌ `created_at` - Timestamp for when chart was created
- ❌ `updated_at` - Timestamp for when chart was last updated

#### `issues` table:
- ❌ `subject` - Subject/title of the issue
- ❌ `attachment_url` - URL for file attachments

#### `comments` table:
- ❌ `attachment_url` - URL for file attachments
- ❌ `updated_at` - Timestamp for when comment was last updated

### Table Name Issue
- ⚠️ `issue_seconds` should be renamed to `thread_seconds` (to match the codebase)

### Missing Constraints & Indexes
- Foreign key constraints on all relationships
- Indexes for performance optimization
- UNIQUE constraint on `thread_seconds(issue_id, user_id)` to prevent duplicate seconds

### Missing Triggers
- Auto-update triggers for `updated_at` columns

---

## How to Connect and Migrate Your Database

### Step 1: Set Up Environment Variables

Create a `.env` file in the `server/` directory:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=feedback_system
DB_USER=your_username
DB_PASSWORD=your_password
```

**For cloud databases (AWS RDS, Heroku, etc.):**
```env
DATABASE_URL=postgresql://username:password@host:port/database
DB_SSL=true
```

### Step 2: Run the Migration

You have **two options** to migrate your database:

#### Option A: Using the Migration Script (Recommended)

```bash
cd server
node scripts/migrate-database.js
```

This script will:
- ✅ Add all missing columns
- ✅ Rename `issue_seconds` to `thread_seconds` (if needed)
- ✅ Create missing tables
- ✅ Add foreign key constraints
- ✅ Add indexes
- ✅ Set up triggers
- ✅ Verify everything was created correctly

#### Option B: Using psql Command Line

```bash
psql -U your_username -d your_database_name -f server/database/migrate_existing_db.sql
```

#### Option C: Using pgAdmin or DBeaver

1. Open your database management tool
2. Connect to your database
3. Open the SQL editor
4. Copy and paste the contents of `server/database/migrate_existing_db.sql`
5. Execute the script

### Step 3: Verify the Migration

After running the migration, verify everything is correct:

```sql
-- List all tables (should show 11 tables)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Expected tables:
-- admin_requests
-- charts
-- comments
-- dashboards
-- issues
-- leaderboard_activity
-- notifications
-- password_reset_tokens
-- teams
-- thread_seconds (not issue_seconds)
-- users
```

### Step 4: Test Database Connection

```bash
cd server
node scripts/test-db-connection.js
```

Or test manually:
```bash
cd server
node -e "require('./database/db.js'); setTimeout(() => process.exit(0), 2000);"
```

You should see:
```
 Connected to PostgreSQL database
   Database: your_database_name
   Host: localhost:5432
 Database connection test successful
```

---

## Complete Table Structure After Migration

### 1. users
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR)
- `email` (VARCHAR, UNIQUE)
- `password_hash` (TEXT)
- `role` (VARCHAR, CHECK: 'business', 'data_science', 'admin')
- `team_id` (INTEGER, FK → teams.id)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP) ⬅**ADDED**

### 2. teams
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR)
- `team_lead_user_id` (INTEGER, FK → users.id)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP) ⬅️ **ADDED**

### 3. dashboards
- `id` (SERIAL PRIMARY KEY)
- `dashboard_name` (VARCHAR)
- `description` (TEXT)
- `created_by_admin_id` (INTEGER, FK → users.id)
- `assigned_team_id` (INTEGER, FK → teams.id) ⬅️ **ADDED**
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP) ⬅️ **ADDED**

### 4. charts
- `id` (SERIAL PRIMARY KEY)
- `dashboard_id` (INTEGER, FK → dashboards.id)
- `chart_name` (VARCHAR)
- `description` (TEXT)
- `created_at` (TIMESTAMP) ⬅️ **ADDED**
- `updated_at` (TIMESTAMP) ⬅️ **ADDED**

### 5. issues
- `id` (SERIAL PRIMARY KEY)
- `dashboard_id` (INTEGER, FK → dashboards.id)
- `chart_id` (INTEGER, FK → charts.id)
- `submitted_by_user_id` (INTEGER, FK → users.id)
- `assigned_team_id` (INTEGER, FK → teams.id)
- `assigned_user_id` (INTEGER, FK → users.id)
- `status` (VARCHAR, CHECK: 'pending', 'in_progress', 'complete')
- `priority` (INTEGER)
- `subject` (VARCHAR) ⬅️ **ADDED**
- `description` (TEXT)
- `attachment_url` (VARCHAR) ⬅️ **ADDED**
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 6. comments
- `id` (SERIAL PRIMARY KEY)
- `issue_id` (INTEGER, FK → issues.id)
- `user_id` (INTEGER, FK → users.id)
- `comment_text` (TEXT)
- `attachment_url` (VARCHAR) ⬅️ **ADDED**
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP) ⬅️ **ADDED**

### 7. thread_seconds
- `id` (SERIAL PRIMARY KEY)
- `issue_id` (INTEGER, FK → issues.id)
- `user_id` (INTEGER, FK → users.id)
- `created_at` (TIMESTAMP)
- UNIQUE(issue_id, user_id) ⬅️ **ADDED**

### 8. notifications ⬅️ **NEW TABLE**
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER, FK → users.id)
- `issue_id` (INTEGER, FK → issues.id)
- `type` (VARCHAR)
- `message` (TEXT)
- `is_read` (BOOLEAN)
- `created_at` (TIMESTAMP)

### 9. leaderboard_activity
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER, FK → users.id)
- `issue_id` (INTEGER, FK → issues.id)
- `action` (VARCHAR)
- `timestamp` (TIMESTAMP)

### 10. password_reset_tokens ⬅️ **NEW TABLE**
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER, FK → users.id)
- `token` (VARCHAR, UNIQUE)
- `expires_at` (TIMESTAMP)
- `used` (BOOLEAN)
- `created_at` (TIMESTAMP)

### 11. admin_requests ⬅️ **NEW TABLE**
- `id` (SERIAL PRIMARY KEY)
- `submitted_by_user_id` (INTEGER, FK → users.id)
- `request_type` (VARCHAR)
- `dashboard_id` (INTEGER, FK → dashboards.id)
- `team_id` (INTEGER, FK → teams.id)
- `subject` (VARCHAR)
- `description` (TEXT)
- `status` (VARCHAR, CHECK: 'pending', 'in_progress', 'resolved', 'rejected')
- `admin_response` (TEXT)
- `resolved_by_admin_id` (INTEGER, FK → users.id)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

## Troubleshooting

### Error: "relation already exists"
This is normal - the migration script uses `IF NOT EXISTS` checks, so it's safe to run multiple times.

### Error: "constraint already exists"
This means the constraint was already added. The script handles this gracefully.

### Error: "column already exists"
The column was already added. This is safe to ignore.

### Error: "cannot rename table because it does not exist"
If you don't have `issue_seconds`, the script will skip the rename. This is fine if you're starting fresh.

### Error: "permission denied"
Make sure your database user has CREATE, ALTER, and INDEX permissions.

---

## Next Steps

After successful migration:

1. ✅ Test your application: `npm run dev`
2. ✅ Verify all features work correctly
3. ✅ Check that notifications are working
4. ✅ Test password reset functionality
5. ✅ Test admin request functionality

---

## Summary

**What you had:** 8 tables with some missing columns
**What you need:** 11 tables with all required columns, constraints, and indexes

**Missing:**
- 3 tables (notifications, password_reset_tokens, admin_requests)
- Multiple columns across existing tables
- Foreign key constraints
- Indexes for performance
- Triggers for auto-updating timestamps

**Solution:** Run the migration script provided in `server/database/migrate_existing_db.sql`


