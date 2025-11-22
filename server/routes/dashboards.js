const express = require('express');
const pool = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all dashboards (with filters for business users)
router.get('/', authenticate, async (req, res) => {
  try {
    const { team_id, search, sort_by = 'dashboard_name' } = req.query;
    let query = 'SELECT d.*, t.name as team_name FROM dashboards d LEFT JOIN teams t ON d.assigned_team_id = t.id WHERE 1=1';
    const params = [];
    let paramCount = 1;

    // Filter by team
    if (team_id) {
      query += ` AND d.assigned_team_id = $${paramCount++}`;
      params.push(team_id);
    }

    // Search
    if (search) {
      query += ` AND (d.dashboard_name ILIKE $${paramCount++} OR d.description ILIKE $${paramCount++})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Sort
    const validSorts = ['dashboard_name', 'created_at', 'updated_at'];
    const sortColumn = validSorts.includes(sort_by) ? sort_by : 'dashboard_name';
    query += ` ORDER BY ${sortColumn} ASC`;

    const result = await pool.query(query, params);
    res.json({ dashboards: result.rows });
  } catch (error) {
    console.error('Get dashboards error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get dashboard by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, t.name as team_name, u.name as created_by_name 
       FROM dashboards d 
       LEFT JOIN teams t ON d.assigned_team_id = t.id 
       LEFT JOIN users u ON d.created_by_admin_id = u.id 
       WHERE d.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    res.json({ dashboard: result.rows[0] });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create dashboard (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { dashboard_name, description, assigned_team_id } = req.body;

    if (!dashboard_name) {
      return res.status(400).json({ error: 'Dashboard name is required' });
    }

    const result = await pool.query(
      'INSERT INTO dashboards (dashboard_name, description, created_by_admin_id, assigned_team_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [dashboard_name, description || null, req.user.id, assigned_team_id || null]
    );

    res.status(201).json({ dashboard: result.rows[0] });
  } catch (error) {
    console.error('Create dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update dashboard (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { dashboard_name, description, assigned_team_id } = req.body;

    const result = await pool.query(
      'UPDATE dashboards SET dashboard_name = COALESCE($1, dashboard_name), description = COALESCE($2, description), assigned_team_id = COALESCE($3, assigned_team_id) WHERE id = $4 RETURNING *',
      [dashboard_name, description, assigned_team_id, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    res.json({ dashboard: result.rows[0] });
  } catch (error) {
    console.error('Update dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete dashboard (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM dashboards WHERE id = $1 RETURNING *', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    res.json({ message: 'Dashboard deleted successfully' });
  } catch (error) {
    console.error('Delete dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get dashboards with thread counts (for business home page)
router.get('/with-threads/count', authenticate, async (req, res) => {
  try {
    const { team_id, search, sort_by = 'dashboard_name' } = req.query;
    
    let query = `
      SELECT d.*, t.name as team_name, COUNT(DISTINCT i.id) as thread_count
      FROM dashboards d
      LEFT JOIN teams t ON d.assigned_team_id = t.id
      LEFT JOIN issues i ON d.id = i.dashboard_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (team_id) {
      query += ` AND d.assigned_team_id = $${paramCount++}`;
      params.push(team_id);
    }

    if (search) {
      query += ` AND (d.dashboard_name ILIKE $${paramCount++} OR d.description ILIKE $${paramCount++})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY d.id, t.name ORDER BY ${sort_by === 'dashboard_name' ? 'd.dashboard_name' : 'd.updated_at'} ASC`;

    const result = await pool.query(query, params);
    res.json({ dashboards: result.rows });
  } catch (error) {
    console.error('Get dashboards with threads error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


