const express = require('express');
const pool = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all issues (with filters)
router.get('/', authenticate, async (req, res) => {
  try {
    const { dashboard_id, status, sort_by = 'updated_at', assigned_team_id, submitted_by } = req.query;
    
    let query = `
      SELECT i.*, 
        d.dashboard_name, 
        c.chart_name,
        u.name as submitted_by_name,
        t.name as assigned_team_name,
        COUNT(DISTINCT ts.user_id) as second_count
      FROM issues i
      LEFT JOIN dashboards d ON i.dashboard_id = d.id
      LEFT JOIN charts c ON i.chart_id = c.id
      LEFT JOIN users u ON i.submitted_by_user_id = u.id
      LEFT JOIN teams t ON i.assigned_team_id = t.id
      LEFT JOIN thread_seconds ts ON i.id = ts.issue_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Role-based filtering
    if (req.user.role === 'business') {
      query += ` AND i.submitted_by_user_id = $${paramCount++}`;
      params.push(req.user.id);
    }
    // Data science users can see all issues (no team restriction)
    // They can filter by assigned_team_id if needed using the assigned_team_id query param

    if (dashboard_id) {
      query += ` AND i.dashboard_id = $${paramCount++}`;
      params.push(dashboard_id);
    }

    if (status) {
      query += ` AND i.status = $${paramCount++}`;
      params.push(status);
    }

    if (assigned_team_id) {
      if (assigned_team_id === 'null' || assigned_team_id === 'unassigned') {
        query += ` AND i.assigned_team_id IS NULL`;
      } else {
        query += ` AND i.assigned_team_id = $${paramCount++}`;
        params.push(assigned_team_id);
      }
    }

    if (submitted_by) {
      query += ` AND i.submitted_by_user_id = $${paramCount++}`;
      params.push(submitted_by);
    }

    query += ` GROUP BY i.id, d.dashboard_name, c.chart_name, u.name, t.name`;

    // Sort
    const validSorts = ['created_at', 'updated_at', 'status', 'priority'];
    const sortColumn = validSorts.includes(sort_by) ? sort_by : 'updated_at';
    const sortOrder = sort_by === 'priority' ? 'DESC' : 'DESC';
    query += ` ORDER BY i.${sortColumn} ${sortOrder}`;

    const result = await pool.query(query, params);
    res.json({ issues: result.rows });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get issues for business user's threads page (created or seconded)
router.get('/my-threads', authenticate, authorize('business'), async (req, res) => {
  try {
    const { status, sort_by = 'updated_at' } = req.query;

    let query = `
      SELECT DISTINCT i.*, 
        d.dashboard_name, 
        c.chart_name,
        u.name as submitted_by_name,
        t.name as assigned_team_name,
        COUNT(DISTINCT ts.user_id) as second_count,
        CASE WHEN ts2.user_id IS NOT NULL THEN true ELSE false END as is_seconded
      FROM issues i
      LEFT JOIN dashboards d ON i.dashboard_id = d.id
      LEFT JOIN charts c ON i.chart_id = c.id
      LEFT JOIN users u ON i.submitted_by_user_id = u.id
      LEFT JOIN teams t ON i.assigned_team_id = t.id
      LEFT JOIN thread_seconds ts ON i.id = ts.issue_id
      LEFT JOIN thread_seconds ts2 ON i.id = ts2.issue_id AND ts2.user_id = $1
      WHERE (i.submitted_by_user_id = $1 OR EXISTS (SELECT 1 FROM thread_seconds WHERE issue_id = i.id AND user_id = $1))
    `;
    const params = [req.user.id];
    let paramCount = 2;

    if (status) {
      query += ` AND i.status = $${paramCount++}`;
      params.push(status);
    }

    query += ` GROUP BY i.id, d.dashboard_name, c.chart_name, u.name, t.name, ts2.user_id`;

    const validSorts = ['created_at', 'updated_at', 'status'];
    const sortColumn = validSorts.includes(sort_by) ? sort_by : 'updated_at';
    query += ` ORDER BY i.${sortColumn} DESC`;

    const result = await pool.query(query, params);
    res.json({ issues: result.rows });
  } catch (error) {
    console.error('Get my threads error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get issues for data science team home page
router.get('/team/dashboard', authenticate, authorize('data_science'), async (req, res) => {
  try {
    const { status, sort_by = 'updated_at', priority, team_filter = 'all' } = req.query;

    let query = `
      SELECT i.*, 
        d.dashboard_name, 
        c.chart_name,
        u.name as submitted_by_name,
        t.name as assigned_team_name,
        t.id as assigned_team_id,
        COUNT(DISTINCT ts.user_id) as second_count,
        CASE WHEN i.assigned_team_id = $1 THEN true ELSE false END as is_my_team
      FROM issues i
      LEFT JOIN dashboards d ON i.dashboard_id = d.id
      LEFT JOIN charts c ON i.chart_id = c.id
      LEFT JOIN users u ON i.submitted_by_user_id = u.id
      LEFT JOIN teams t ON i.assigned_team_id = t.id
      LEFT JOIN thread_seconds ts ON i.id = ts.issue_id
      WHERE 1=1
    `;
    const params = [req.user.team_id || null];
    let paramCount = 2;

    // Filter by team if specified
    if (team_filter === 'my_team' && req.user.team_id) {
      query += ` AND i.assigned_team_id = $${paramCount++}`;
      params.push(req.user.team_id);
    } else if (team_filter === 'other_teams' && req.user.team_id) {
      query += ` AND (i.assigned_team_id IS NULL OR i.assigned_team_id != $${paramCount++})`;
      params.push(req.user.team_id);
    }

    if (status) {
      query += ` AND i.status = $${paramCount++}`;
      params.push(status);
    }

    if (priority === 'critical') {
      query += ` HAVING COUNT(DISTINCT ts.user_id) > 1`;
    }

    query += ` GROUP BY i.id, d.dashboard_name, c.chart_name, u.name, t.name, t.id`;

    const validSorts = ['created_at', 'updated_at', 'status'];
    const sortColumn = validSorts.includes(sort_by) ? sort_by : 'updated_at';
    query += ` ORDER BY i.${sortColumn} DESC`;

    const result = await pool.query(query, params);

    // Get summary statistics for user's team
    let summaryQuery = `SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(DISTINCT dashboard_id) as total_dashboards
      FROM issues 
      WHERE 1=1`;
    const summaryParams = [];
    let summaryParamCount = 1;

    if (team_filter === 'my_team' && req.user.team_id) {
      summaryQuery += ` AND assigned_team_id = $${summaryParamCount++}`;
      summaryParams.push(req.user.team_id);
    } else if (team_filter === 'other_teams' && req.user.team_id) {
      summaryQuery += ` AND (assigned_team_id IS NULL OR assigned_team_id != $${summaryParamCount++})`;
      summaryParams.push(req.user.team_id);
    }

    const summaryResult = await pool.query(summaryQuery, summaryParams);

    // Get critical issues count
    let criticalQuery = `SELECT COUNT(DISTINCT i.id) as critical
       FROM issues i
       JOIN thread_seconds ts ON i.id = ts.issue_id
       WHERE 1=1`;
    const criticalParams = [];
    let criticalParamCount = 1;

    if (team_filter === 'my_team' && req.user.team_id) {
      criticalQuery += ` AND i.assigned_team_id = $${criticalParamCount++}`;
      criticalParams.push(req.user.team_id);
    } else if (team_filter === 'other_teams' && req.user.team_id) {
      criticalQuery += ` AND (i.assigned_team_id IS NULL OR i.assigned_team_id != $${criticalParamCount++})`;
      criticalParams.push(req.user.team_id);
    }

    criticalQuery += ` GROUP BY i.id HAVING COUNT(DISTINCT ts.user_id) > 1`;
    const criticalResult = await pool.query(criticalQuery, criticalParams);

    res.json({
      issues: result.rows,
      summary: {
        pending: parseInt(summaryResult.rows[0]?.pending || 0),
        in_progress: parseInt(summaryResult.rows[0]?.in_progress || 0),
        critical: criticalResult.rows.length,
        total_dashboards: parseInt(summaryResult.rows[0]?.total_dashboards || 0)
      }
    });
  } catch (error) {
    console.error('Get team issues error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get issue by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, 
        d.dashboard_name, 
        c.chart_name,
        u.name as submitted_by_name,
        t.name as assigned_team_name,
        COUNT(DISTINCT ts.user_id) as second_count
      FROM issues i
      LEFT JOIN dashboards d ON i.dashboard_id = d.id
      LEFT JOIN charts c ON i.chart_id = c.id
      LEFT JOIN users u ON i.submitted_by_user_id = u.id
      LEFT JOIN teams t ON i.assigned_team_id = t.id
      LEFT JOIN thread_seconds ts ON i.id = ts.issue_id
      WHERE i.id = $1
      GROUP BY i.id, d.dashboard_name, c.chart_name, u.name, t.name`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json({ issue: result.rows[0] });
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create issue (Business users only)
router.post('/', authenticate, authorize('business'), async (req, res) => {
  try {
    const { dashboard_id, chart_id, subject, description, attachment_url } = req.body;

    if (!dashboard_id || !description) {
      return res.status(400).json({ error: 'Dashboard ID and description are required' });
    }

    const result = await pool.query(
      'INSERT INTO issues (dashboard_id, chart_id, submitted_by_user_id, subject, description, attachment_url, status, priority) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [dashboard_id, chart_id || null, req.user.id, subject || null, description, attachment_url || null, 'pending', 1]
    );

    const issue = result.rows[0];

    // Create notification for assigned team if exists
    if (issue.assigned_team_id) {
      const io = req.app.get('io');
      const teamMembers = await pool.query('SELECT id FROM users WHERE team_id = $1', [issue.assigned_team_id]);
      teamMembers.rows.forEach(member => {
        io.to(`user-${member.id}`).emit('new-issue', { issue });
      });
    }

    res.status(201).json({ issue });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Second a thread (Business users only)
router.post('/:id/second', authenticate, authorize('business'), async (req, res) => {
  try {
    // Check if already seconded
    const existing = await pool.query(
      'SELECT id FROM thread_seconds WHERE issue_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You have already seconded this thread' });
    }

    // Check if user created the thread
    const issue = await pool.query('SELECT submitted_by_user_id FROM issues WHERE id = $1', [req.params.id]);
    if (issue.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    if (issue.rows[0].submitted_by_user_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot second your own thread' });
    }

    // Add second
    await pool.query('INSERT INTO thread_seconds (issue_id, user_id) VALUES ($1, $2)', [req.params.id, req.user.id]);

    // Update priority
    const secondCount = await pool.query('SELECT COUNT(*) as count FROM thread_seconds WHERE issue_id = $1', [req.params.id]);
    await pool.query('UPDATE issues SET priority = $1 WHERE id = $2', [parseInt(secondCount.rows[0].count), req.params.id]);

    res.json({ message: 'Thread seconded successfully' });
  } catch (error) {
    console.error('Second thread error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update issue status (Data Science or Admin)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'in_progress', 'complete'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if issue exists and user has permission
    const issueResult = await pool.query('SELECT * FROM issues WHERE id = $1', [req.params.id]);
    if (issueResult.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const issue = issueResult.rows[0];

    // Check permissions
    if (status === 'complete') {
      // Only the assigned team can mark threads as complete (not admin)
      if (req.user.role === 'admin') {
        return res.status(403).json({ error: 'Only the assigned team can mark threads as complete. Admin cannot mark threads as complete.' });
      }
      
      if (req.user.role === 'data_science') {
        if (!issue.assigned_team_id) {
          return res.status(403).json({ error: 'Thread must be assigned to a team before it can be marked complete' });
        }
        
        if (issue.assigned_team_id !== req.user.team_id) {
          return res.status(403).json({ error: 'You can only mark complete threads assigned to your team' });
        }
      } else {
        return res.status(403).json({ error: 'Only data science team members can mark threads as complete' });
      }
    }
    
    if (req.user.role === 'data_science') {
      // Data science users cannot change status back to pending or manually set in_progress
      // (in_progress is set automatically on assignment)
      if (status === 'pending' || (status === 'in_progress' && issue.status !== 'pending')) {
        return res.status(403).json({ error: 'You cannot change status to this value. Status changes are automatic on assignment.' });
      }
    }
    
    // Admin can update status to pending or in_progress, but NOT complete
    // Business users cannot update status (handled by authorize middleware if needed)

    const result = await pool.query(
      'UPDATE issues SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    // Record leaderboard activity if completed
    if (status === 'complete' && req.user.role === 'data_science') {
      await pool.query(
        'INSERT INTO leaderboard_activity (user_id, issue_id, action) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [req.user.id, req.params.id, 'resolved']
      );
    }

    // Create notification
    const io = req.app.get('io');
    io.to(`user-${issue.submitted_by_user_id}`).emit('status-update', {
      issue_id: issue.id,
      status: status
    });

    // Also create database notification
    await pool.query(
      'INSERT INTO notifications (user_id, issue_id, type, message) VALUES ($1, $2, $3, $4)',
      [issue.submitted_by_user_id, issue.id, 'status_change', `Your thread status has been updated to ${status}`]
    );

    res.json({ issue: result.rows[0] });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete issue (Business user who created it, only if pending or complete)
router.delete('/:id', authenticate, authorize('business'), async (req, res) => {
  try {
    const issueResult = await pool.query('SELECT * FROM issues WHERE id = $1', [req.params.id]);

    if (issueResult.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const issue = issueResult.rows[0];

    if (issue.submitted_by_user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own threads' });
    }

    if (issue.status === 'in_progress') {
      return res.status(400).json({ error: 'Cannot delete thread that is in progress' });
    }

    await pool.query('DELETE FROM issues WHERE id = $1', [req.params.id]);

    res.json({ message: 'Thread deleted successfully' });
  } catch (error) {
    console.error('Delete issue error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

