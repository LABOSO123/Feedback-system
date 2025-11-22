# API Documentation

Base URL: `http://localhost:5000/api`

All endpoints require authentication unless specified otherwise. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

---

## 🔐 Authentication Endpoints

### Register User
- **POST** `/auth/register`
- **Public**: Yes
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "role": "business" | "data_science"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "token": "jwt_token_here",
    "user": { "id": 1, "name": "John Doe", "email": "john@example.com", "role": "business" }
  }
  ```
- **Note**: Admin accounts cannot be created through registration

### Login
- **POST** `/auth/login`
- **Public**: Yes
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "SecurePass123!"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "token": "jwt_token_here",
    "user": { "id": 1, "name": "John Doe", "email": "john@example.com", "role": "business" }
  }
  ```

### Forgot Password
- **POST** `/auth/forgot-password`
- **Public**: Yes
- **Body**:
  ```json
  {
    "email": "john@example.com"
  }
  ```

### Reset Password
- **POST** `/auth/reset-password`
- **Public**: Yes
- **Body**:
  ```json
  {
    "token": "reset_token",
    "password": "NewSecurePass123!"
  }
  ```

---

## 📊 Dashboard Endpoints

### Get All Dashboards
- **GET** `/dashboards`
- **Roles**: All authenticated users
- **Query Params**: `?search=term&team_id=1`
- **Response**: `200 OK`
  ```json
  {
    "dashboards": [
      {
        "id": 1,
        "name": "Sales Dashboard",
        "description": "Monthly sales metrics",
        "assigned_team_id": 1,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

### Get Dashboard by ID
- **GET** `/dashboards/:id`
- **Response**: `200 OK`
  ```json
  {
    "dashboard": {
      "id": 1,
      "name": "Sales Dashboard",
      "charts": [...],
      "threads": [...]
    }
  }
  ```

### Create Dashboard (Admin Only)
- **POST** `/dashboards`
- **Roles**: `admin`
- **Body**:
  ```json
  {
    "name": "New Dashboard",
    "description": "Dashboard description",
    "assigned_team_id": 1
  }
  ```

### Update Dashboard (Admin Only)
- **PUT** `/dashboards/:id`
- **Roles**: `admin`

### Delete Dashboard (Admin Only)
- **DELETE** `/dashboards/:id`
- **Roles**: `admin`

---

## 📈 Chart/Visual Endpoints

### Get Charts for Dashboard
- **GET** `/charts/dashboard/:dashboard_id`
- **Response**: `200 OK`
  ```json
  {
    "charts": [
      {
        "id": 1,
        "name": "Revenue Chart",
        "dashboard_id": 1,
        "chart_type": "line"
      }
    ]
  }
  ```

### Create Chart (Admin Only)
- **POST** `/charts`
- **Roles**: `admin`
- **Body**:
  ```json
  {
    "name": "New Chart",
    "dashboard_id": 1,
    "chart_type": "bar"
  }
  ```

### Update Chart (Admin Only)
- **PUT** `/charts/:id`
- **Roles**: `admin`

### Delete Chart (Admin Only)
- **DELETE** `/charts/:id`
- **Roles**: `admin`

---

## 💬 Issue/Thread Endpoints

### Get All Issues
- **GET** `/issues`
- **Query Params**: 
  - `status=pending|in_progress|complete`
  - `priority=1|2|3`
  - `dashboard_id=1`
  - `assigned_team_id=1|unassigned`
  - `sort=created_at|priority`
  - `order=asc|desc`
- **Response**: `200 OK`
  ```json
  {
    "issues": [
      {
        "id": 1,
        "dashboard_id": 1,
        "chart_id": null,
        "subject": "Issue title",
        "description": "Issue description",
        "status": "pending",
        "priority": 1,
        "submitted_by_user_id": 1,
        "assigned_team_id": null,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

### Get Issue by ID
- **GET** `/issues/:id`
- **Response**: `200 OK`
  ```json
  {
    "issue": {
      "id": 1,
      "dashboard": {...},
      "chart": {...},
      "comments": [...],
      "submitted_by": {...}
    }
  }
  ```

### Create Issue (Business Users Only)
- **POST** `/issues`
- **Roles**: `business`
- **Body**:
  ```json
  {
    "dashboard_id": 1,
    "chart_id": 2,  // Optional
    "subject": "Issue title",
    "description": "Issue description",
    "attachment_url": null  // Optional
  }
  ```
- **Note**: Status automatically set to `pending`

### Update Issue Status
- **PATCH** `/issues/:id/status`
- **Body**:
  ```json
  {
    "status": "in_progress" | "complete"
  }
  ```
- **Rules**:
  - Business users: Can only set to `in_progress` (if assigned)
  - Data Science: Can set to `complete` (only for their team's assigned issues)
  - Admin: Cannot set to `complete`

### Delete Issue
- **DELETE** `/issues/:id`
- **Roles**: `business` (only their own, if status is `pending` or `complete`)

### Second an Issue
- **POST** `/issues/:id/second`
- **Roles**: `business`
- **Note**: Increases priority if multiple users second the same issue

---

## 💭 Comment Endpoints

### Get Comments for Issue
- **GET** `/comments/issue/:issue_id`
- **Response**: `200 OK`
  ```json
  {
    "comments": [
      {
        "id": 1,
        "issue_id": 1,
        "user_id": 1,
        "content": "Comment text",
        "created_at": "2024-01-01T00:00:00.000Z",
        "user": { "name": "John Doe", "role": "business" }
      }
    ]
  }
  ```

### Create Comment
- **POST** `/comments`
- **Body**:
  ```json
  {
    "issue_id": 1,
    "content": "Comment text"
  }
  ```

### Update Comment
- **PUT** `/comments/:id`
- **Roles**: Owner only

### Delete Comment
- **DELETE** `/comments/:id`
- **Roles**: Owner only

---

## 👥 Team Endpoints

### Get All Teams
- **GET** `/teams`
- **Response**: `200 OK`
  ```json
  {
    "teams": [
      {
        "id": 1,
        "name": "Team 1",
        "lead_user_id": 1,
        "member_count": 5
      }
    ]
  }
  ```

### Create Team (Admin Only)
- **POST** `/teams`
- **Roles**: `admin`
- **Body**:
  ```json
  {
    "name": "Team 6"
  }
  ```

### Update Team (Admin Only)
- **PUT** `/teams/:id`
- **Roles**: `admin`

### Delete Team (Admin Only)
- **DELETE** `/teams/:id`
- **Roles**: `admin`

---

## 👑 Admin Endpoints

### Get System Statistics
- **GET** `/admin/stats`
- **Roles**: `admin`
- **Response**: `200 OK`
  ```json
  {
    "total_users": 50,
    "total_teams": 5,
    "total_dashboards": 10,
    "total_issues": 100,
    "pending_issues": 20,
    "in_progress_issues": 30,
    "complete_issues": 50
  }
  ```

### Assign Issue to Team
- **POST** `/admin/issues/:id/assign-team`
- **Roles**: `admin`
- **Body**:
  ```json
  {
    "team_id": 1
  }
  ```
- **Note**: Automatically sets status to `in_progress`

### Assign Issue to User
- **POST** `/admin/issues/:id/assign-user`
- **Roles**: `admin`
- **Body**:
  ```json
  {
    "user_id": 1
  }
  ```
- **Note**: Assigns to user's team and sets status to `in_progress`

### Create User
- **POST** `/admin/users`
- **Roles**: `admin`
- **Body**:
  ```json
  {
    "name": "New User",
    "email": "user@example.com",
    "password": "SecurePass123!",
    "role": "data_science",
    "team_id": 1
  }
  ```

### Delete User
- **DELETE** `/admin/users/:id`
- **Roles**: `admin`

### Make Team Lead
- **POST** `/admin/users/:id/make-lead`
- **Roles**: `admin`
- **Body**:
  ```json
  {
    "team_id": 1
  }
  ```

### Revoke Team Lead
- **POST** `/admin/users/:id/revoke-lead`
- **Roles**: `admin`

---

## 📨 Admin Request Endpoints

### Get Admin Requests
- **GET** `/admin-requests`
- **Roles**: `admin` (all requests), `data_science` (own requests)
- **Response**: `200 OK`
  ```json
  {
    "requests": [
      {
        "id": 1,
        "request_type": "new_dashboard",
        "subject": "Request title",
        "description": "Request description",
        "status": "pending",
        "submitted_by_user_id": 1
      }
    ]
  }
  ```

### Create Admin Request (Data Science Only)
- **POST** `/admin-requests`
- **Roles**: `data_science`
- **Body**:
  ```json
  {
    "request_type": "new_dashboard" | "add_chart" | "add_team_member" | "modify_dashboard" | "other",
    "dashboard_id": 1,  // Optional
    "subject": "Request title",
    "description": "Request description"
  }
  ```

### Update Request Status (Admin Only)
- **PATCH** `/admin-requests/:id/status`
- **Roles**: `admin`
- **Body**:
  ```json
  {
    "status": "approved" | "rejected" | "pending"
  }
  ```

---

## 🔔 Notification Endpoints

### Get Notifications
- **GET** `/notifications`
- **Query Params**: `?unread_only=true`
- **Response**: `200 OK`
  ```json
  {
    "notifications": [
      {
        "id": 1,
        "type": "new_issue",
        "message": "New issue created",
        "read": false,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

### Mark Notification as Read
- **PATCH** `/notifications/:id/read`
- **Response**: `200 OK`

### Mark All as Read
- **PATCH** `/notifications/read-all`
- **Response**: `200 OK`

---

## 📊 Leaderboard Endpoints

### Get Leaderboard
- **GET** `/leaderboard`
- **Query Params**: `?period=week|month|all`
- **Response**: `200 OK`
  ```json
  {
    "leaderboard": [
      {
        "team_id": 1,
        "team_name": "Team 1",
        "completed_issues": 10,
        "response_time_avg": 2.5
      }
    ]
  }
  ```

---

## ⚠️ Error Responses

All endpoints may return the following error responses:

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

Error response format:
```json
{
  "error": "Error message here"
}
```

---

## 🔄 Status Workflow

1. **Pending**: Automatically set when issue is created
2. **In Progress**: Automatically set when admin assigns issue to team/user
3. **Complete**: Set by data science team members (only for their assigned issues)

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- JWT tokens expire after 7 days
- Password must be at least 8 characters with uppercase, lowercase, number, and special character
- Admin accounts cannot be created through public registration
- Data science users cannot choose teams during registration (admin assigns)

