# KRA Feedback Management System

A platform for communication between the Data Science team (responsible for creating and modifying Dashboards) and the Business team (providing feedback on dashboard requirements).

## Features

### Business Team
- View threads related to specific dashboards
- Create new threads
- Second previously created threads
- Reply to their own threads
- Delete their threads (only if pending or completed)
- Search and filter dashboards
- Real-time notifications

### Data Science Teams
- View issues assigned to their team
- Respond to threads
- Update thread status (Pending → In Progress → Complete)
- Mark threads as complete (only if replied)
- Team-specific dashboard views
- Leaderboard tracking

### Admin
- Create and manage dashboards
- Create and manage charts
- Manage teams and assign team leads
- Assign issues to teams/members
- Full system visibility and control

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL
- **Frontend**: React
- **Authentication**: JWT
- **Real-time**: Socket.io

## Setup Instructions

1. Install dependencies:
```bash
npm run install-all
```

2. Set up database:
- Create a PostgreSQL database
- Update `server/.env` with your database credentials
- Run the SQL schema from `server/database/schema.sql`

3. Start development servers:
```bash
npm run dev
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Environment Variables

Copy `server/.env.example` to `server/.env` and fill in your values.

## Database Schema

See `server/database/schema.sql` for the complete database structure.

## Documentation

- **[SYSTEM_WORKFLOW.md](./SYSTEM_WORKFLOW.md)** - Complete workflow documentation
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Detailed database setup guide
- **[QUICK_START.md](./QUICK_START.md)** - Quick start guide
- **[SETUP.md](./SETUP.md)** - Full setup instructions
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Feature summary

