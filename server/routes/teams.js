const express = require('express');
const pool = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all teams
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name as team_lead_name, COUNT(DISTINCT u2.id) as member_count
       FROM teams t
       LEFT JOIN users u ON t.team_lead_user_id = u.id
       LEFT JOIN users u2 ON t.id = u2.team_id
       GROUP BY t.id, u.name
       ORDER BY t.name ASC`
    );

    res.json({ teams: result.rows });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get team by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name as team_lead_name
       FROM teams t
       LEFT JOIN users u ON t.team_lead_user_id = u.id
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Get team members
    const membersResult = await pool.query(
      'SELECT id, name, email, role FROM users WHERE team_id = $1 ORDER BY name ASC',
      [req.params.id]
    );

    res.json({
      team: result.rows[0],
      members: membersResult.rows
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create team (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, team_lead_user_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    const result = await pool.query(
      'INSERT INTO teams (name, team_lead_user_id) VALUES ($1, $2) RETURNING *',
      [name, team_lead_user_id || null]
    );

    res.status(201).json({ team: result.rows[0] });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update team (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, team_lead_user_id } = req.body;

    const result = await pool.query(
      'UPDATE teams SET name = COALESCE($1, name), team_lead_user_id = COALESCE($2, team_lead_user_id) WHERE id = $3 RETURNING *',
      [name, team_lead_user_id === '' ? null : team_lead_user_id, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({ team: result.rows[0] });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Revoke team lead (Admin only)
router.patch('/:id/revoke-lead', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE teams SET team_lead_user_id = NULL WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({ team: result.rows[0], message: 'Team lead revoked successfully' });
  } catch (error) {
    console.error('Revoke team lead error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete team (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM teams WHERE id = $1 RETURNING *', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add user to team (Admin only)
router.post('/:id/members', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await pool.query('UPDATE users SET team_id = $1 WHERE id = $2', [req.params.id, user_id]);

    res.json({ message: 'User added to team successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove user from team (Admin only)
router.delete('/:id/members/:userId', authenticate, authorize('admin'), async (req, res) => {
  try {
    await pool.query('UPDATE users SET team_id = NULL WHERE id = $1 AND team_id = $2', [req.params.userId, req.params.id]);

    res.json({ message: 'User removed from team successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

