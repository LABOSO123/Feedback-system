const express = require('express');
const pool = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all charts for a dashboard
router.get('/dashboard/:dashboardId', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
        COUNT(DISTINCT i.id) as thread_count,
        CASE 
          WHEN COUNT(DISTINCT i.id) >= 10 THEN 'high'
          WHEN COUNT(DISTINCT i.id) >= 5 THEN 'medium'
          WHEN COUNT(DISTINCT i.id) >= 1 THEN 'low'
          ELSE 'none'
        END as priority
       FROM charts c
       LEFT JOIN issues i ON c.id = i.chart_id
       WHERE c.dashboard_id = $1
       GROUP BY c.id
       ORDER BY c.chart_name ASC`,
      [req.params.dashboardId]
    );

    res.json({ charts: result.rows });
  } catch (error) {
    console.error('Get charts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get chart by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM charts WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chart not found' });
    }

    res.json({ chart: result.rows[0] });
  } catch (error) {
    console.error('Get chart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create chart (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { dashboard_id, chart_name, description } = req.body;

    if (!dashboard_id || !chart_name) {
      return res.status(400).json({ error: 'Dashboard ID and chart name are required' });
    }

    const result = await pool.query(
      'INSERT INTO charts (dashboard_id, chart_name, description) VALUES ($1, $2, $3) RETURNING *',
      [dashboard_id, chart_name, description || null]
    );

    res.status(201).json({ chart: result.rows[0] });
  } catch (error) {
    console.error('Create chart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update chart (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { chart_name, description } = req.body;

    const result = await pool.query(
      'UPDATE charts SET chart_name = COALESCE($1, chart_name), description = COALESCE($2, description) WHERE id = $3 RETURNING *',
      [chart_name, description, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chart not found' });
    }

    res.json({ chart: result.rows[0] });
  } catch (error) {
    console.error('Update chart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete chart (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM charts WHERE id = $1 RETURNING *', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chart not found' });
    }

    res.json({ message: 'Chart deleted successfully' });
  } catch (error) {
    console.error('Delete chart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


