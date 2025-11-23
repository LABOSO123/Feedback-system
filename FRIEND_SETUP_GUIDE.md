# Quick Setup Guide for Testing

This guide will help you set up the Feedback System on your local machine for testing.

## Step 1: Clone the Repository

```bash
git clone https://github.com/LABOSO123/Feedback-system.git
cd Feedback-system
```

## Step 2: Install Dependencies

```bash
npm run install-all
```

This installs dependencies for:
- Root project
- Server (backend)
- Client (frontend)

## Step 3: Set Up Your Database

### Install PostgreSQL (if not already installed)

- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **Mac**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql`

### Create Database

```bash
# Using command line
createdb feedback_system

# Or using psql
psql -U postgres
CREATE DATABASE feedback_system;
\q
```

### Run Database Schema

```bash
psql -U postgres -d feedback_system -f server/database/schema.sql
```

## Step 4: Configure Environment Variables

Create a file `server/.env` with your database credentials:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=feedback_system
DB_USER=postgres
DB_PASSWORD=your_postgres_password
CLIENT_URL=http://localhost:3000
```

**Important**: Replace `your_postgres_password` with your actual PostgreSQL password.

## Step 5: Create Your Admin Account

**You need to create your own admin account** - you cannot use the original admin account because each person has their own separate database.

```bash
cd server
node scripts/create-admin.js "Your Name" your-email@example.com YourPassword123!
```

**Password Requirements:**
- At least 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&* etc.)

**Example:**
```bash
node scripts/create-admin.js "Admin User" admin@test.com Admin123!
```

## Step 6: Start the Application

```bash
# From the root directory
npm run dev
```

This starts both:
- Backend server: http://localhost:5000
- Frontend client: http://localhost:3000

## Step 7: Log In

1. Open your browser: http://localhost:3000
2. Click "Login"
3. Use the email and password you created in Step 5

## Troubleshooting

### Database Connection Error

- Make sure PostgreSQL is running
- Check your `.env` file has correct credentials
- Test connection: `cd server && npm run test-db`

### Port Already in Use

- Backend (5000): Change `PORT` in `server/.env`
- Frontend (3000): The app will ask to use a different port automatically

### Admin Account Already Exists

If you get an error that the email already exists:
- Use a different email address
- Or check existing admins: `node scripts/list-admins.js`

## Need Help?

- Check the main [README.md](./README.md) for more details
- See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for database setup help
- See [QUICK_START.md](./QUICK_START.md) for quick setup

---

**Remember**: Each person has their own database and admin account. You cannot share admin credentials because databases are separate!

