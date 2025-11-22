# 🚀 KRA Feedback Management System

[![Status](https://img.shields.io/badge/status-active%20development-success)](https://github.com/LABOSO123/Feedback-system)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12%2B-blue)](https://www.postgresql.org/)

A comprehensive **feedback management platform** designed to streamline communication between Business Teams and Data Science Teams regarding dashboard modifications and improvements. This system replaces manual communication channels (emails, WhatsApp, calls) with a structured, trackable, and efficient feedback workflow.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [User Roles & Workflows](#-user-roles--workflows)
- [Recent Updates](#-recent-updates)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🏢 Business Team
- ✅ **Dashboard Browsing**: View all dashboards with thread counts and search/filter capabilities
- ✅ **Flexible Feedback Creation**: Create feedback for entire dashboards OR specific charts/visuals
- ✅ **Thread Management**: Create, second, reply to, and delete threads (with restrictions)
- ✅ **Priority System**: Second existing threads to increase priority (critical threads highlighted)
- ✅ **Real-time Notifications**: Get notified when data science teams respond or update status
- ✅ **My Threads View**: Track all threads you've created or seconded

### 👨‍💻 Data Science Teams
- ✅ **Team Dashboard**: View all issues with team statistics (pending, in progress, critical)
- ✅ **Thread Management**: Reply to threads, update status, mark as complete
- ✅ **Status Workflow**: Automatic status transitions (Pending → In Progress → Complete)
- ✅ **Team Assignment**: View issues assigned to your team or contribute to others
- ✅ **Admin Requests**: Submit requests to admin for dashboard changes, team management, etc.
- ✅ **Real-time Updates**: Receive notifications for new threads and assignments

### 👑 Admin
- ✅ **Dashboard Management**: Create dashboards and add charts/visuals to each dashboard
- ✅ **Team Management**: Create teams (unlimited), assign team leads, manage members
- ✅ **User Management**: Add users, assign to teams, make team leads, delete users
- ✅ **Issue Assignment**: Assign threads to teams/users (automatically changes status to "in_progress")
- ✅ **Progress Tracking**: View dashboard progress, completion rates, and system statistics
- ✅ **Full Visibility**: Monitor all threads, statuses, and team activities across the system

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io
- **Validation**: express-validator
- **Security**: bcryptjs for password hashing

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS (with custom KRA color scheme)
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client
- **Date Formatting**: date-fns

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/LABOSO123/Feedback-system.git
cd Feedback-system
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Set up the database**
```bash
# Create PostgreSQL database
createdb feedback_system

# Or using psql
psql -U postgres
CREATE DATABASE feedback_system;
```

4. **Configure environment variables**
```bash
# Create server/.env file
cd server
cp .env.example .env  # If you have an example file
# Or create .env manually with:
```

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=feedback_system
DB_USER=postgres
DB_PASSWORD=your_password
CLIENT_URL=http://localhost:3000
```

5. **Run database schema**
```bash
psql -U postgres -d feedback_system -f server/database/schema.sql
```

6. **Create admin user**
```bash
cd server
node scripts/create-admin.js "Admin Name" admin@example.com Admin123!
```

7. **Start the application**
```bash
# From root directory
npm run dev
```

8. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📁 Project Structure

```
Feedback-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React Context (Auth)
│   │   ├── pages/          # Page components
│   │   │   ├── admin/      # Admin pages
│   │   │   ├── business/   # Business user pages
│   │   │   └── datascience/# Data science pages
│   │   └── App.js          # Main app component
│   └── package.json
├── server/                 # Express backend
│   ├── database/           # Database files
│   │   ├── schema.sql      # Database schema
│   │   └── db.js           # Database connection
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── scripts/            # Utility scripts
│   └── index.js            # Server entry point
└── README.md
```

## 👥 User Roles & Workflows

### Business User Workflow
1. **Register/Login** → Select "Business" role (no team assignment needed)
2. **Browse Dashboards** → View all available dashboards
3. **Create Feedback** → Select dashboard (and optionally a chart/visual) → Submit feedback
4. **Track Threads** → View "My Threads" to see all your threads and seconded threads
5. **Get Notified** → Receive real-time notifications when data science teams respond

### Data Science User Workflow
1. **Register/Login** → Select "Data Science" role (admin assigns team later)
2. **View Team Issues** → See all threads assigned to your team
3. **Respond to Threads** → Reply to business user feedback
4. **Update Status** → Mark threads as complete when done
5. **Submit Requests** → Contact admin for dashboard changes or team management

### Admin Workflow
1. **Create Admin Account** → Use the create-admin script
2. **Set Up Teams** → Create teams (Team 1-5 or more)
3. **Add Dashboards** → Create dashboards and add charts/visuals to them
4. **Manage Users** → Add users, assign to teams, make team leads
5. **Assign Issues** → Assign threads to teams (status auto-changes to "in_progress")
6. **Monitor Progress** → View dashboard progress and system statistics

## 🔄 Status Workflow

The system uses an **automatic status workflow**:

```
[Pending] → Created by business user
    ↓
[In Progress] → Automatically set when admin assigns to team
    ↓
[Complete] → Manually set by assigned team when work is done
```

**Key Rules:**
- ✅ `pending` → Set automatically when thread is created
- ✅ `in_progress` → Set automatically when admin assigns to team/user
- ✅ `complete` → Only assigned team can mark as complete (admin cannot)
- ✅ Admin has full visibility but cannot mark threads as complete

## 📊 Recent Updates

### Latest Features (Active Development)
- ✨ **Enhanced Admin Dashboard**: Dashboard progress tracking with completion rates
- ✨ **Chart/Visual Management**: Admin can add charts/visuals to dashboards via UI
- ✨ **Flexible Feedback Creation**: Business users can select dashboard only OR dashboard + specific visual
- ✨ **Automatic Status Workflow**: Status changes automatically on assignment
- ✨ **Improved User Management**: Admin can create users, assign teams, make team leads, delete users
- ✨ **Better Authentication**: Enhanced token handling with axios interceptors
- ✨ **Registration Improvements**: Data science users don't select teams during registration (admin assigns)
- ✨ **Admin Restrictions**: Admin cannot register through public registration (security)
- ✨ **Enhanced Filtering**: Admin can filter issues by dashboard, status, and team
- ✨ **Better Error Handling**: More descriptive error messages for authentication issues

### Workflow Improvements
- 🔄 Automatic status transition: `pending` → `in_progress` (on assignment)
- 🔄 Only assigned team can mark threads as `complete`
- 🔄 Admin has full visibility but respects team completion authority
- 🔄 Real-time notifications for all status changes

## 📡 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user (business/data_science only)
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Dashboards
- `GET /api/dashboards` - List all dashboards
- `GET /api/dashboards/:id` - Get dashboard details
- `GET /api/dashboards/with-threads/count` - Dashboards with thread counts
- `POST /api/dashboards` - Create dashboard (Admin)
- `PUT /api/dashboards/:id` - Update dashboard (Admin)
- `DELETE /api/dashboards/:id` - Delete dashboard (Admin)

### Charts/Visuals
- `GET /api/charts/dashboard/:dashboardId` - Get charts for a dashboard
- `POST /api/charts` - Create chart (Admin)
- `PUT /api/charts/:id` - Update chart (Admin)
- `DELETE /api/charts/:id` - Delete chart (Admin)

### Issues/Threads
- `GET /api/issues` - List issues (role-filtered)
- `GET /api/issues/my-threads` - User's threads (Business)
- `GET /api/issues/team/dashboard` - Team issues (Data Science)
- `GET /api/issues/:id` - Get issue details
- `POST /api/issues` - Create thread (Business)
- `POST /api/issues/:id/second` - Second a thread (Business)
- `PATCH /api/issues/:id/status` - Update status (Data Science/Admin)
- `DELETE /api/issues/:id` - Delete thread (Business)

### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user (Admin)
- `DELETE /api/admin/users/:id` - Delete user (Admin)
- `GET /api/admin/stats` - System statistics
- `POST /api/admin/issues/:id/assign-team` - Assign issue to team
- `POST /api/admin/issues/:id/assign-user` - Assign issue to user

See [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) for complete API documentation.

## 🤝 Contributing

We welcome contributions! This is an active project with ongoing development.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Commit your changes**
   ```bash
   git commit -m "Add: Description of your feature"
   ```
5. **Push to your branch**
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request**

### Contribution Guidelines
- Follow existing code style
- Add comments for complex logic
- Update documentation for new features
- Test your changes thoroughly
- Ensure all tests pass

### Areas for Contribution
- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- ⚡ Performance optimizations
- 🔒 Security improvements
- 🧪 Test coverage

## 📚 Documentation

- **[SYSTEM_WORKFLOW.md](./SYSTEM_WORKFLOW.md)** - Complete system workflow documentation
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Detailed database setup guide
- **[QUICK_START.md](./QUICK_START.md)** - Quick start guide
- **[SETUP.md](./SETUP.md)** - Full setup instructions
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Comprehensive feature summary
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Database migration guide

## 🔒 Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT tokens with 7-day expiration
- ✅ Role-based access control (RBAC)
- ✅ SQL injection prevention (parameterized queries)
- ✅ Input validation with express-validator
- ✅ CORS configuration
- ✅ Secure password requirements (8+ chars, uppercase, lowercase, number, special char)
- ✅ Password reset tokens with expiration

## 🚧 Roadmap

### Planned Features
- [ ] Email notifications
- [ ] File attachments for threads
- [ ] Advanced analytics dashboard
- [ ] Export reports (CSV/PDF)
- [ ] Mobile responsive improvements
- [ ] Dark mode support
- [ ] Advanced search (full-text)
- [ ] Superset API integration

## 📝 License

This project is open source and available for use and modification.

## 👤 Author

**LABOSO123**
- GitHub: [@LABOSO123](https://github.com/LABOSO123)
- Repository: [Feedback-system](https://github.com/LABOSO123/Feedback-system)

## 🙏 Acknowledgments

- Built for KRA (Kenya Revenue Authority) internal dashboard feedback management
- Designed to streamline communication between Business and Data Science teams

---

**⭐ Star this repository if you find it useful!**

**🔄 Active Development** - This project is actively maintained and updated. Contributions are welcome!
