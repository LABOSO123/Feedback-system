# KRA Feedback Management System - Setup Guide

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation Steps

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE feedback_system;
```

2. Update `server/.env` with your database credentials:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=feedback_system
DB_USER=postgres
DB_PASSWORD=your_password
UPLOAD_DIR=./uploads
CLIENT_URL=http://localhost:3000
```

3. Run the database schema:
```bash
psql -U postgres -d feedback_system -f server/database/schema.sql
```

### 3. Create Uploads Directory

```bash
mkdir -p server/uploads
```

### 4. Start the Application

#### Option 1: Run both servers together (recommended)
```bash
npm run dev
```

#### Option 2: Run servers separately

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm start
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Initial Setup

### Create Admin User

You can create an admin user through the registration page, or directly in the database:

```sql
-- Hash a password first (use bcrypt or an online tool)
-- Example password: "admin123" hashed
INSERT INTO users (name, email, password_hash, role) 
VALUES ('Admin User', 'admin@kra.go.ke', '$2a$10$...', 'admin');
```

### Create Teams

1. Log in as admin
2. Go to Admin Dashboard > Teams
3. Create teams (e.g., Team 1, Team 2, Team 3, Team 4, Team 5)

### Create Dashboards

1. Log in as admin
2. Go to Admin Dashboard > Dashboards
3. Create dashboards and assign them to teams

### Create Charts (Optional)

Charts can be created through the API or you can add a chart management interface in the admin panel.

## Features Overview

### Business Users
- View dashboards with threads
- Create new threads
- Second existing threads
- Reply to their own threads
- Delete their threads (pending or complete only)
- View notifications

### Data Science Teams
- View issues assigned to their team
- Reply to threads
- Update thread status (Pending → In Progress → Complete)
- View team statistics
- Leaderboard tracking

### Admin
- Manage dashboards
- Manage teams and assign team leads
- Manage users and assign them to teams
- Assign issues to teams/users
- View system statistics
- Override issue status

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Dashboards
- `GET /api/dashboards` - Get all dashboards
- `GET /api/dashboards/:id` - Get dashboard by ID
- `POST /api/dashboards` - Create dashboard (Admin)
- `PUT /api/dashboards/:id` - Update dashboard (Admin)
- `DELETE /api/dashboards/:id` - Delete dashboard (Admin)

### Issues/Threads
- `GET /api/issues` - Get issues (filtered by role)
- `GET /api/issues/my-threads` - Get user's threads (Business)
- `GET /api/issues/team/dashboard` - Get team issues (Data Science)
- `POST /api/issues` - Create issue (Business)
- `POST /api/issues/:id/second` - Second a thread (Business)
- `PATCH /api/issues/:id/status` - Update status (Data Science/Admin)
- `DELETE /api/issues/:id` - Delete issue (Business)

### Comments
- `GET /api/comments/issue/:issueId` - Get comments for issue
- `POST /api/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Teams
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create team (Admin)
- `PUT /api/teams/:id` - Update team (Admin)
- `DELETE /api/teams/:id` - Delete team (Admin)

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read

### Leaderboard
- `GET /api/leaderboard/teams` - Team leaderboard
- `GET /api/leaderboard/individuals` - Individual leaderboard
- `GET /api/leaderboard/team/:teamId` - Team-specific leaderboard

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

### Port Already in Use
- Change PORT in `server/.env`
- Change REACT_APP_API_URL in `client/.env` if needed

### CORS Issues
- Verify CLIENT_URL in `server/.env` matches your frontend URL

### Authentication Issues
- Check JWT_SECRET is set in `server/.env`
- Verify token is being sent in Authorization header

## Production Deployment

1. Set `NODE_ENV=production` in `server/.env`
2. Build the frontend: `cd client && npm run build`
3. Serve the build folder with a web server (nginx, Apache, etc.)
4. Use a process manager (PM2) for the Node.js server
5. Set up SSL/HTTPS
6. Use environment variables for all secrets

## Support

For issues or questions, please contact the development team.

