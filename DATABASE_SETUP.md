# Database Setup Guide

This guide will help you set up your PostgreSQL database for the KRA Feedback Management System.

## Quick Setup

### 1. Create Your Database

Connect to your PostgreSQL server and create a new database:

```sql
CREATE DATABASE feedback_system;
```

Or using command line:
```bash
createdb feedback_system
```

### 2. Configure Environment Variables

Create a `.env` file in the `server/` directory:

**For Local PostgreSQL:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=feedback_system
DB_USER=postgres
DB_PASSWORD=your_password
```

**For Cloud PostgreSQL (AWS RDS, Heroku, etc.):**
```env
# Option 1: Use connection string
DATABASE_URL=postgresql://username:password@host:port/database
DB_SSL=true

# Option 2: Use individual settings
DB_HOST=your-db-host.rds.amazonaws.com
DB_PORT=5432
DB_NAME=feedback_system
DB_USER=your_username
DB_PASSWORD=your_password
DB_SSL=true
```

### 3. Run the Schema

Execute the SQL schema file:

**Using psql command line:**
```bash
psql -U postgres -d feedback_system -f server/database/schema.sql
```

**Using psql interactive:**
```bash
psql -U postgres -d feedback_system
\i server/database/schema.sql
\q
```

**Using pgAdmin or other GUI:**
1. Open pgAdmin
2. Connect to your database server
3. Right-click on `feedback_system` database
4. Select "Query Tool"
5. Open and execute `server/database/schema.sql`

## Database Configuration Options

### Local PostgreSQL Setup

If you're running PostgreSQL locally:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=feedback_system
DB_USER=postgres
DB_PASSWORD=your_local_password
DB_SSL=false
```

### Cloud Database Setup (AWS RDS, Azure, etc.)

For cloud databases, you'll typically need SSL:

```env
DB_HOST=your-db-instance.xxxxx.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=feedback_system
DB_USER=admin
DB_PASSWORD=your_secure_password
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

### Heroku Postgres

If using Heroku Postgres, use the connection string:

```env
DATABASE_URL=postgres://user:password@host:port/database
DB_SSL=true
```

Heroku automatically provides `DATABASE_URL` environment variable.

### Connection String Format

The connection string format is:
```
postgresql://[user[:password]@][host][:port][/database][?param1=value1&...]
```

Example:
```
postgresql://postgres:mypassword@localhost:5432/feedback_system
```

## Testing Your Connection

After setting up your `.env` file, test the connection:

```bash
cd server
node -e "require('./database/db.js'); setTimeout(() => process.exit(0), 2000);"
```

You should see:
```
✅ Connected to PostgreSQL database
   Database: feedback_system
   Host: localhost:5432
✅ Database connection test successful
   Server time: 2024-...
```

## Common Issues & Solutions

### Issue: "Connection refused"
**Solution:** 
- Check if PostgreSQL is running: `pg_isready` or `sudo systemctl status postgresql`
- Verify DB_HOST and DB_PORT in `.env`
- Check firewall settings

### Issue: "Authentication failed"
**Solution:**
- Verify DB_USER and DB_PASSWORD in `.env`
- Check PostgreSQL `pg_hba.conf` for authentication method
- Ensure user has access to the database

### Issue: "Database does not exist"
**Solution:**
- Create the database: `CREATE DATABASE feedback_system;`
- Verify DB_NAME in `.env` matches the created database

### Issue: "SSL connection required"
**Solution:**
- Set `DB_SSL=true` in `.env`
- For self-signed certificates, set `DB_SSL_REJECT_UNAUTHORIZED=false` (development only)

### Issue: "Relation does not exist"
**Solution:**
- Run the schema: `psql -U postgres -d feedback_system -f server/database/schema.sql`
- Verify you're connected to the correct database

### Issue: "Connection timeout"
**Solution:**
- Check network connectivity
- Verify firewall allows connections on DB_PORT
- For cloud databases, check security groups/network ACLs

## Database Schema Overview

The system creates the following tables:

1. **users** - User accounts (business, data_science, admin)
2. **teams** - Data science teams
3. **dashboards** - Dashboard metadata
4. **charts** - Chart metadata
5. **issues** - Threads/feedback
6. **comments** - Replies to threads
7. **thread_seconds** - Track who seconded threads
8. **notifications** - User notifications
9. **leaderboard_activity** - Performance tracking
10. **password_reset_tokens** - Password reset tokens

## PostgreSQL Version Compatibility

The schema is compatible with:
- PostgreSQL 12+
- PostgreSQL 13+
- PostgreSQL 14+
- PostgreSQL 15+
- PostgreSQL 16+

## Production Recommendations

1. **Use connection pooling** - Already configured (max 20 connections)
2. **Enable SSL** - Set `DB_SSL=true` for production
3. **Use strong passwords** - Generate secure passwords
4. **Regular backups** - Set up automated backups
5. **Monitor connections** - Watch for connection pool exhaustion
6. **Use read replicas** - For high-traffic scenarios (requires code changes)

## Next Steps

After database setup:

1. ✅ Test database connection
2. ✅ Run schema SQL
3. ✅ Verify tables were created
4. ✅ Start the application: `npm run dev`
5. ✅ Create your first admin user via registration page

## Verification Queries

After running the schema, verify tables exist:

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should return 10 tables:
-- users, teams, dashboards, charts, issues, comments, 
-- thread_seconds, notifications, leaderboard_activity, password_reset_tokens

-- Check users table structure
\d users

-- Count tables
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Should return 10
```

## Need Help?

If you encounter issues:
1. Check the error message in the console
2. Verify your `.env` configuration
3. Test connection using `psql` command line
4. Review PostgreSQL logs: `/var/log/postgresql/` (Linux) or check your cloud provider's logs

