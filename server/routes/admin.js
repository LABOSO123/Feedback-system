const express = require('express');
const pool = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require admin role
router.use(authenticate);
router.use(authorize('admin'));

// Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.team_id, u.created_at, t.name as team_name
       FROM users u
       LEFT JOIN teams t ON u.team_id = t.id
       ORDER BY u.created_at DESC`
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create user (Admin only)
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role, team_id } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Validate password strength
    const bcrypt = require('bcryptjs');
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length < minLength || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return res.status(400).json({ error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, team_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, team_id, created_at',
      [name, email, passwordHash, role, team_id || null]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (Admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    // Prevent deleting yourself
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Assign issue to team (DEPRECATED - Assignment is now automatic based on dashboard team)
// Kept for admin visibility/override if needed
router.post('/issues/:id/assign-team', async (req, res) => {
  try {
    const { team_id } = req.body;

    if (!team_id) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    // Get current issue to check status
    const currentIssue = await pool.query('SELECT * FROM issues WHERE id = $1', [req.params.id]);
    if (currentIssue.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Note: Assignment is now automatic when issue is created (based on dashboard team)
    // This endpoint is kept for manual override if needed
    // Automatically change status to 'in_progress' when assigned (if it was pending)
    const newStatus = currentIssue.rows[0].status === 'pending' ? 'in_progress' : currentIssue.rows[0].status;

    const result = await pool.query(
      'UPDATE issues SET assigned_team_id = $1, status = $2 WHERE id = $3 RETURNING *',
      [team_id, newStatus, req.params.id]
    );

    // Create notification for team members
    const io = req.app.get('io');
    const teamMembers = await pool.query('SELECT id FROM users WHERE team_id = $1', [team_id]);
    
    // Notify team members
    teamMembers.rows.forEach(member => {
      io.to(`user-${member.id}`).emit('issue-assigned', {
        issue_id: req.params.id,
        team_id: team_id
      });
    });

    // Notify the business user who created the thread
    if (newStatus === 'in_progress') {
      await pool.query(
        'INSERT INTO notifications (user_id, issue_id, type, message) VALUES ($1, $2, $3, $4)',
        [currentIssue.rows[0].submitted_by_user_id, req.params.id, 'assignment', 'Your thread has been assigned to a team and is now in progress']
      );
      io.to(`user-${currentIssue.rows[0].submitted_by_user_id}`).emit('status-update', {
        issue_id: req.params.id,
        status: 'in_progress'
      });
    }

    res.json({ issue: result.rows[0] });
  } catch (error) {
    console.error('Assign team error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Assign issue to user (DEPRECATED - Assignment is now automatic based on dashboard team)
// Kept for admin visibility/override if needed
router.post('/issues/:id/assign-user', async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get current issue to check status and get user's team
    const currentIssue = await pool.query('SELECT * FROM issues WHERE id = $1', [req.params.id]);
    if (currentIssue.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Get user's team_id
    const userResult = await pool.query('SELECT team_id FROM users WHERE id = $1', [user_id]);
    const userTeamId = userResult.rows[0]?.team_id;

    // Note: Assignment is now automatic when issue is created (based on dashboard team)
    // This endpoint is kept for manual override if needed
    // Automatically change status to 'in_progress' when assigned (if it was pending)
    const newStatus = currentIssue.rows[0].status === 'pending' ? 'in_progress' : currentIssue.rows[0].status;
    const assignedTeamId = userTeamId || currentIssue.rows[0].assigned_team_id;

    const result = await pool.query(
      'UPDATE issues SET assigned_user_id = $1, assigned_team_id = COALESCE($2, assigned_team_id), status = $3 WHERE id = $4 RETURNING *',
      [user_id, assignedTeamId, newStatus, req.params.id]
    );

    // Create notification
    const io = req.app.get('io');
    io.to(`user-${user_id}`).emit('issue-assigned', {
      issue_id: req.params.id,
      user_id: user_id
    });

    // Notify the business user who created the thread
    if (newStatus === 'in_progress') {
      await pool.query(
        'INSERT INTO notifications (user_id, issue_id, type, message) VALUES ($1, $2, $3, $4)',
        [currentIssue.rows[0].submitted_by_user_id, req.params.id, 'assignment', 'Your thread has been assigned and is now in progress']
      );
      io.to(`user-${currentIssue.rows[0].submitted_by_user_id}`).emit('status-update', {
        issue_id: req.params.id,
        status: 'in_progress'
      });
    }

    res.json({ issue: result.rows[0] });
  } catch (error) {
    console.error('Assign user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update any issue field (Admin override)
router.put('/issues/:id', async (req, res) => {
  try {
    const { status, assigned_team_id, assigned_user_id, priority } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (assigned_team_id !== undefined) {
      updates.push(`assigned_team_id = $${paramCount++}`);
      values.push(assigned_team_id);
    }
    if (assigned_user_id !== undefined) {
      updates.push(`assigned_user_id = $${paramCount++}`);
      values.push(assigned_user_id);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    const query = `UPDATE issues SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json({ issue: result.rows[0] });
  } catch (error) {
    console.error('Update issue error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'business') as business_users,
        (SELECT COUNT(*) FROM users WHERE role = 'data_science') as data_science_users,
        (SELECT COUNT(*) FROM teams) as total_teams,
        (SELECT COUNT(*) FROM dashboards) as total_dashboards,
        (SELECT COUNT(*) FROM issues WHERE status = 'pending') as pending_issues,
        (SELECT COUNT(*) FROM issues WHERE status = 'in_progress') as in_progress_issues,
        (SELECT COUNT(*) FROM issues WHERE status = 'complete') as completed_issues
    `);

    res.json({ stats: stats.rows[0] });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


