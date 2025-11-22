const express = require('express');
const pool = require('../database/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get leaderboard for teams
router.get('/teams', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id,
        t.name,
        COUNT(DISTINCT CASE WHEN i.status = 'complete' THEN i.id END) as issues_resolved,
        COUNT(DISTINCT la.user_id) as contributors,
        AVG(EXTRACT(EPOCH FROM (i.updated_at - i.created_at))/3600) as avg_resolution_hours
      FROM teams t
      LEFT JOIN issues i ON t.id = i.assigned_team_id
      LEFT JOIN leaderboard_activity la ON i.id = la.issue_id AND la.user_id IN (SELECT id FROM users WHERE team_id = t.id)
      GROUP BY t.id, t.name
      ORDER BY issues_resolved DESC, avg_resolution_hours ASC
    `);

    res.json({ teams: result.rows });
  } catch (error) {
    console.error('Get team leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get leaderboard for individuals
router.get('/individuals', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        t.name as team_name,
        COUNT(DISTINCT CASE WHEN la.action = 'resolved' THEN la.issue_id END) as issues_resolved,
        COUNT(DISTINCT la.issue_id) as issues_contributed,
        COUNT(DISTINCT CASE WHEN la.action = 'responded' THEN la.issue_id END) as responses_count
      FROM users u
      LEFT JOIN teams t ON u.team_id = t.id
      LEFT JOIN leaderboard_activity la ON u.id = la.user_id
      WHERE u.role = 'data_science'
      GROUP BY u.id, u.name, u.email, t.name
      ORDER BY issues_resolved DESC, issues_contributed DESC
      LIMIT 50
    `);

    res.json({ individuals: result.rows });
  } catch (error) {
    console.error('Get individual leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get leaderboard for specific team
router.get('/team/:teamId', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(DISTINCT CASE WHEN la.action = 'resolved' THEN la.issue_id END) as issues_resolved,
        COUNT(DISTINCT la.issue_id) as issues_contributed,
        COUNT(DISTINCT CASE WHEN la.action = 'responded' THEN la.issue_id END) as responses_count
      FROM users u
      LEFT JOIN leaderboard_activity la ON u.id = la.user_id
      WHERE u.team_id = $1 AND u.role = 'data_science'
      GROUP BY u.id, u.name, u.email
      ORDER BY issues_resolved DESC, issues_contributed DESC
    `, [req.params.teamId]);

    res.json({ members: result.rows });
  } catch (error) {
    console.error('Get team leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Record issue resolution
router.post('/resolve', authenticate, async (req, res) => {
  try {
    const { issue_id } = req.body;

    if (!issue_id) {
      return res.status(400).json({ error: 'Issue ID is required' });
    }

    // Check if user has permission
    const issueResult = await pool.query('SELECT assigned_team_id FROM issues WHERE id = $1', [issue_id]);
    if (issueResult.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    if (req.user.role === 'data_science' && issueResult.rows[0].assigned_team_id !== req.user.team_id) {
      return res.status(403).json({ error: 'You can only resolve issues assigned to your team' });
    }

    // Record activity
    await pool.query(
      'INSERT INTO leaderboard_activity (user_id, issue_id, action) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [req.user.id, issue_id, 'resolved']
    );

    res.json({ message: 'Resolution recorded' });
  } catch (error) {
    console.error('Record resolution error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


