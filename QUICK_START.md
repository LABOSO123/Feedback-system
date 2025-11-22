# Quick Start Guide

## Step 1: Install Dependencies

```bash
npm run install-all
```

## Step 2: Set Up Your Database

### Create the Database

```sql
CREATE DATABASE feedback_system;
```

### Configure Connection

Create `server/.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=feedback_system
DB_USER=your_username
DB_PASSWORD=your_password

# For cloud databases, you might need:
# DB_SSL=true
# DATABASE_URL=postgresql://user:pass@host:port/db
```

### Run the Schema

```bash
psql -U your_username -d feedback_system -f server/database/schema.sql
```

### Test Connection

```bash
cd server
npm run test-db
```

## Step 3: Start the Application

```bash
npm run dev
```

## Step 4: Access the Application

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Step 5: Create Your First Admin User

1. Go to http://localhost:3000/register
2. Register with role "Admin"
3. Use a strong password (8+ chars, uppercase, lowercase, number, special char)

---

**Need more details?** See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for comprehensive database setup instructions.

