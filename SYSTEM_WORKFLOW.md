# KRA Feedback Management System - Complete Workflow Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Complete Workflows](#complete-workflows)
4. [Technical Architecture](#technical-architecture)
5. [Data Flow](#data-flow)
6. [Feature Breakdown](#feature-breakdown)

---

## 🎯 System Overview

The KRA Feedback Management System is a **communication platform** that bridges the gap between:
- **Business Team**: Users who need dashboard modifications
- **Data Science Teams**: Teams responsible for creating/maintaining dashboards
- **Admin**: System administrators who manage everything

### Core Purpose
Replace manual communication (emails, WhatsApp, calls) with a structured, trackable system for dashboard feedback and issue resolution.

---

## 👥 User Roles & Permissions

### 1. Business Users
**What they can do:**
- ✅ View all dashboards
- ✅ Create new threads (feedback/issues)
- ✅ Second existing threads (if they have the same issue)
- ✅ Reply to their own threads
- ✅ Delete their threads (only if pending or complete, NOT in progress)
- ✅ View notifications
- ✅ Search and filter dashboards

**What they CANNOT do:**
- ❌ Reply to threads they didn't create
- ❌ Delete threads in "in_progress" status
- ❌ See threads from other business users (except when seconding)

### 2. Data Science Team Members
**What they can do:**
- ✅ View issues assigned to their team
- ✅ Reply to threads assigned to their team
- ✅ Update thread status (Pending → In Progress → Complete)
- ✅ Mark threads as complete (only if they've replied)
- ✅ View team statistics
- ✅ See leaderboard rankings

**What they CANNOT do:**
- ❌ Reply to threads not assigned to their team
- ❌ Mark threads as complete without replying
- ❌ See issues from other teams

### 3. Admin
**What they can do:**
- ✅ Everything (full system access)
- ✅ Create/manage dashboards
- ✅ Create/manage charts
- ✅ Create/manage teams
- ✅ Assign team leads
- ✅ Add/remove team members
- ✅ Assign issues to teams/users
- ✅ Override any status
- ✅ View system statistics
- ✅ Manage all users

---

## 🔄 Complete Workflows

### Workflow 1: Business User Submits Feedback

```
1. Business User logs in
   ↓
2. Goes to Home page → Sees list of dashboards
   ↓
3. Clicks on a dashboard OR clicks "+" button
   ↓
4. Views existing threads for that dashboard
   ↓
5. Either:
   a) Seconds an existing thread (if same issue)
   b) Creates new thread (if new issue)
   ↓
6. Fills out thread form:
   - Subject (optional)
   - Chart (optional dropdown)
   - Description (required)
   ↓
7. Submits thread → Status: "Pending"
   ↓
8. Thread appears on:
   - Home page (all business users can see it)
   - Their "My Threads" page
   ↓
9. Waits for Data Science team response
   ↓
10. Receives notification when Data Science replies
   ↓
11. Can reply back to their own thread
   ↓
12. Thread status updates: Pending → In Progress → Complete
```

### Workflow 2: Data Science Team Responds

```
1. Data Science member logs in
   ↓
2. Goes to Home page → Sees:
   - Summary stats (Pending, In Progress, Critical, Total Dashboards)
   - List of issues assigned to their team
   ↓
3. Clicks on an issue/thread
   ↓
4. Views:
   - Thread details
   - All previous replies
   - Current status
   ↓
5. Replies to the thread
   ↓
6. Status automatically changes: "Pending" → "In Progress"
   ↓
7. Business user gets notification
   ↓
8. Continues working on the issue
   ↓
9. When issue is resolved:
   - Adds final reply if needed
   - Marks thread as "Complete"
   ↓
10. Thread is locked (no more replies)
    Business user gets notification
```

### Workflow 3: Thread Seconding (Priority System)

```
1. Business User A creates a thread about Dashboard X
   ↓
2. Thread has priority = 1 (just the creator)
   ↓
3. Business User B sees the thread
   ↓
4. User B has the SAME issue
   ↓
5. User B clicks "Second this thread"
   ↓
6. Priority increases: 1 → 2
   ↓
7. Thread is now marked as "Critical" (2+ seconds)
   ↓
8. Data Science team sees "Critical" badge
   ↓
9. Thread appears higher in priority lists
   ↓
10. More seconds = Higher priority
```

### Workflow 4: Admin Management

```
1. Admin logs in
   ↓
2. Goes to Admin Dashboard
   ↓
3. Can manage:
   
   a) DASHBOARDS:
      - Create new dashboard
      - Edit dashboard details
      - Assign dashboard to a team
      - Delete dashboard
   
   b) TEAMS:
      - Create new team
      - Edit team name
      - Assign team lead
      - Revoke team lead
      - Add members to team
      - Remove members from team
      - Delete team
   
   c) USERS:
      - View all users
      - Assign users to teams
      - Remove users from teams
   
   d) ISSUES:
      - View all issues
      - Assign issues to teams
      - Assign issues to specific users
      - Override issue status
   
   e) STATISTICS:
      - View system overview
      - See user counts
      - See issue counts
```

### Workflow 5: Password Reset Flow

```
1. User clicks "Forgot Password" on login page
   ↓
2. Enters email address
   ↓
3. System generates reset token (expires in 1 hour)
   ↓
4. Token stored in database
   ↓
5. User receives reset link (via email in production)
   ↓
6. User clicks reset link
   ↓
7. Enters new password (must meet strength requirements)
   ↓
8. System validates token and updates password
   ↓
9. Token marked as used
   ↓
10. User can now login with new password
```

---

## 🏗️ Technical Architecture

### Backend Architecture

```
┌─────────────────────────────────────────┐
│         Express.js Server                │
│  (Port 5000)                            │
├─────────────────────────────────────────┤
│  Routes:                                │
│  ├── /api/auth          (Login/Register)│
│  ├── /api/dashboards    (Dashboard CRUD)│
│  ├── /api/charts        (Chart CRUD)     │
│  ├── /api/issues        (Threads)       │
│  ├── /api/comments      (Replies)       │
│  ├── /api/teams         (Team Management)│
│  ├── /api/admin         (Admin Functions)│
│  ├── /api/notifications (Notifications) │
│  └── /api/leaderboard   (Analytics)     │
├─────────────────────────────────────────┤
│  Middleware:                            │
│  ├── Authentication (JWT)               │
│  ├── Authorization (Role-based)         │
│  └── Validation                         │
├─────────────────────────────────────────┤
│  Real-time: Socket.io                   │
│  (Notifications, Status Updates)        │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│      PostgreSQL Database                 │
│  ├── users                              │
│  ├── teams                              │
│  ├── dashboards                         │
│  ├── charts                             │
│  ├── issues                             │
│  ├── comments                           │
│  ├── thread_seconds                     │
│  ├── notifications                     │
│  ├── leaderboard_activity              │
│  └── password_reset_tokens              │
└─────────────────────────────────────────┘
```

### Frontend Architecture

```
┌─────────────────────────────────────────┐
│         React Application               │
│  (Port 3000)                            │
├─────────────────────────────────────────┤
│  Pages:                                 │
│  ├── Login/Register                    │
│  ├── Forgot/Reset Password              │
│  ├── Business:                         │
│  │   ├── Home                          │
│  │   ├── Dashboard Detail              │
│  │   └── My Threads                   │
│  ├── Data Science:                     │
│  │   ├── Home                          │
│  │   ├── Threads                       │
│  │   └── Thread Detail                 │
│  └── Admin:                            │
│      ├── Overview                      │
│      ├── Dashboards                    │
│      ├── Teams                         │
│      ├── Users                         │
│      └── Issues                        │
├─────────────────────────────────────────┤
│  Components:                            │
│  ├── Layout (Navigation)                │
│  ├── Notifications (Floating Panel)    │
│  ├── PasswordInput (with eye icon)      │
│  └── PasswordStrengthIndicator          │
├─────────────────────────────────────────┤
│  Context:                               │
│  └── AuthContext (User state)          │
└─────────────────────────────────────────┘
           │
           ▼
    Axios HTTP Client
    Socket.io Client
```

---

## 🔀 Data Flow

### Creating a Thread

```
Frontend (Business User)
  ↓
  Fills form → Clicks "Post Thread"
  ↓
  POST /api/issues
  ↓
Backend
  ↓
  Validates user role (must be business)
  ↓
  Creates issue record:
    - dashboard_id
    - submitted_by_user_id
    - status = "pending"
    - priority = 1
  ↓
  Checks if dashboard has assigned_team_id
  ↓
  If yes → Creates notifications for team members
  ↓
  Emits Socket.io event to team members
  ↓
Database
  ↓
  INSERT INTO issues
  INSERT INTO notifications (if team assigned)
  ↓
Response to Frontend
  ↓
  Thread appears in UI
  Real-time notification sent
```

### Replying to a Thread

```
Frontend (Data Science User)
  ↓
  Types reply → Clicks "Reply"
  ↓
  POST /api/comments
  ↓
Backend
  ↓
  Validates:
    - User is in assigned team
    - Thread exists
  ↓
  Creates comment record
  ↓
  If status was "pending" → Updates to "in_progress"
  ↓
  Creates notification for thread creator
  ↓
  Records leaderboard activity
  ↓
  Emits Socket.io event
  ↓
Database
  ↓
  INSERT INTO comments
  UPDATE issues (status)
  INSERT INTO notifications
  INSERT INTO leaderboard_activity
  ↓
Response to Frontend
  ↓
  Reply appears in thread
  Business user gets notification
```

### Status Update Flow

```
Frontend (Data Science User)
  ↓
  Clicks "Mark as Complete"
  ↓
  PATCH /api/issues/:id/status
  ↓
Backend
  ↓
  Validates:
    - User is in assigned team
    - Thread has at least one reply from data science
  ↓
  Updates status to "complete"
  ↓
  Records leaderboard activity (resolved)
  ↓
  Creates notification for thread creator
  ↓
  Emits Socket.io event
  ↓
Database
  ↓
  UPDATE issues (status = 'complete')
  INSERT INTO leaderboard_activity
  INSERT INTO notifications
  ↓
Response to Frontend
  ↓
  Status badge updates
  Thread locked (no more replies)
  Business user notified
```

---

## 🎨 Feature Breakdown

### 1. Authentication System
- **JWT-based**: Secure token authentication
- **Password Hashing**: bcrypt with salt rounds
- **Password Strength**: 
  - 8+ characters
  - Uppercase, lowercase, number, special char
  - Real-time strength indicator
- **Password Visibility**: Eye icon toggle
- **Password Reset**: Token-based with expiration

### 2. Thread Management
- **Create**: Business users create threads
- **Second**: Other users can second (increase priority)
- **Reply**: Thread creator and assigned team can reply
- **Status**: Three states (Pending, In Progress, Complete)
- **Delete**: Only creator, only if not in progress
- **Priority**: Based on number of seconds

### 3. Real-time Notifications
- **Socket.io**: WebSocket connection
- **Types**:
  - New reply
  - Status change
  - Issue assignment
- **Persistence**: Stored in database
- **UI**: Floating panel with bell icon

### 4. Search & Filtering
- **Business Users**:
  - Search dashboards by name/description
  - Filter by team
  - Sort by name, date modified, date created
- **Data Science**:
  - Filter by status
  - Filter by priority (critical)
  - Sort by activity, status, created time
  - Group by dashboard

### 5. Admin Features
- **Dashboard Management**: Full CRUD
- **Team Management**: Create, edit, assign leads, manage members
- **User Management**: View, assign to teams
- **Issue Management**: Assign, override status
- **Statistics**: System-wide metrics

### 6. Leaderboard
- **Team Rankings**: Issues resolved, response time
- **Individual Rankings**: Contributions, resolutions
- **Metrics**: Response time, quality ratings

---

## 🔐 Security Features

1. **Authentication**:
   - JWT tokens with expiration
   - Password hashing (bcrypt)
   - Secure password requirements

2. **Authorization**:
   - Role-based access control (RBAC)
   - Route protection middleware
   - Permission checks on all operations

3. **Data Protection**:
   - SQL injection prevention (parameterized queries)
   - Input validation (express-validator)
   - CORS configuration

4. **Password Security**:
   - Strong password requirements
   - Reset token expiration (1 hour)
   - Token single-use

---

## 📊 Database Relationships

```
users
  ├── team_id → teams.id
  └── (one-to-many) → issues (submitted_by_user_id)

teams
  ├── team_lead_user_id → users.id
  └── (one-to-many) → dashboards (assigned_team_id)

dashboards
  ├── created_by_admin_id → users.id
  ├── assigned_team_id → teams.id
  └── (one-to-many) → charts

charts
  └── dashboard_id → dashboards.id

issues
  ├── dashboard_id → dashboards.id
  ├── chart_id → charts.id
  ├── submitted_by_user_id → users.id
  ├── assigned_team_id → teams.id
  └── (one-to-many) → comments

comments
  ├── issue_id → issues.id
  └── user_id → users.id

thread_seconds
  ├── issue_id → issues.id
  └── user_id → users.id
```

---

## 🚀 System Startup Flow

```
1. Server starts (index.js)
   ↓
2. Loads environment variables (.env)
   ↓
3. Connects to PostgreSQL database
   ↓
4. Tests database connection
   ↓
5. Sets up Express middleware
   ↓
6. Registers all routes
   ↓
7. Initializes Socket.io
   ↓
8. Server ready on port 5000
   ↓
9. Client starts (React)
   ↓
10. Checks for stored auth token
   ↓
11. If token exists → Validates with backend
   ↓
12. Loads user data
   ↓
13. Renders appropriate dashboard based on role
```

---

## 📱 User Interface Flow

### Business User Journey
```
Login → Home (Dashboard List) → Dashboard Detail → Create Thread → My Threads → View Replies
```

### Data Science User Journey
```
Login → Home (Team Issues) → Thread Detail → Reply → Update Status → Complete
```

### Admin Journey
```
Login → Admin Dashboard → (Dashboards/Teams/Users/Issues) → Manage → Save
```

---

## 🔄 Status Lifecycle

```
[Pending]
   │
   │ (Data Science replies)
   ▼
[In Progress]
   │
   │ (Data Science marks complete)
   ▼
[Complete] ← Locked (no more replies)
```

**Rules:**
- Can only mark complete if there's a reply
- Cannot delete if in progress
- Cannot reply if complete

---

## 📈 Priority System

```
Thread Created → Priority: 1
   │
   │ (User seconds)
   ▼
Priority: 2 → Marked as "Critical"
   │
   │ (More seconds)
   ▼
Priority: 3, 4, 5... → Higher priority
```

**Impact:**
- Critical threads highlighted
- Appear higher in lists
- Data Science team prioritizes them

---

This workflow documentation covers the complete system. Every feature, user action, and data flow is designed to facilitate smooth communication between Business and Data Science teams while maintaining proper access control and tracking.

