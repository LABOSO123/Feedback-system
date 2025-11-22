const express = require('express');
const pool = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all admin requests (for Data Science users - their own, for Admin - all)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, request_type } = req.query;
    
    let query = `
      SELECT ar.*, 
        u.name as submitted_by_name,
        u.email as submitted_by_email,
        d.dashboard_name,
        t.name as team_name,
        admin.name as resolved_by_name
      FROM admin_requests ar
      LEFT JOIN users u ON ar.submitted_by_user_id = u.id
      LEFT JOIN dashboards d ON ar.dashboard_id = d.id
      LEFT JOIN teams t ON ar.team_id = t.id
      LEFT JOIN users admin ON ar.resolved_by_admin_id = admin.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Data Science users can only see their own requests
    if (req.user.role === 'data_science') {
      query += ` AND ar.submitted_by_user_id = $${paramCount++}`;
      params.push(req.user.id);
    }
    // Admin can see all requests

    if (status) {
      query += ` AND ar.status = $${paramCount++}`;
      params.push(status);
    }

    if (request_type) {
      query += ` AND ar.request_type = $${paramCount++}`;
      params.push(request_type);
    }

    query += ` ORDER BY ar.created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ requests: result.rows });
  } catch (error) {
    console.error('Get admin requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get request by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ar.*, 
        u.name as submitted_by_name,
        u.email as submitted_by_email,
        d.dashboard_name,
        t.name as team_name,
        admin.name as resolved_by_name
      FROM admin_requests ar
      LEFT JOIN users u ON ar.submitted_by_user_id = u.id
      LEFT JOIN dashboards d ON ar.dashboard_id = d.id
      LEFT JOIN teams t ON ar.team_id = t.id
      LEFT JOIN users admin ON ar.resolved_by_admin_id = admin.id
      WHERE ar.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = result.rows[0];

    // Check permissions
    if (req.user.role === 'data_science' && request.submitted_by_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ request });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create admin request (Data Science users only)
router.post('/', authenticate, authorize('data_science'), async (req, res) => {
  try {
    const { request_type, dashboard_id, team_id, subject, description } = req.body;

    if (!request_type || !subject || !description) {
      return res.status(400).json({ error: 'Request type, subject, and description are required' });
    }

    const validTypes = ['new_dashboard', 'add_chart', 'add_team_member', 'modify_dashboard', 'other'];
    if (!validTypes.includes(request_type)) {
      return res.status(400).json({ error: 'Invalid request type' });
    }

    const result = await pool.query(
      'INSERT INTO admin_requests (submitted_by_user_id, request_type, dashboard_id, team_id, subject, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, request_type, dashboard_id || null, team_id || req.user.team_id || null, subject, description]
    );

    // Create notification for all admins
    const admins = await pool.query('SELECT id FROM users WHERE role = $1', ['admin']);
    const io = req.app.get('io');
    admins.rows.forEach(admin => {
      io.to(`user-${admin.id}`).emit('new-admin-request', {
        request_id: result.rows[0].id,
        subject: subject
      });
    });

    // Create database notifications
    for (const admin of admins.rows) {
      await pool.query(
        'INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3)',
        [admin.id, 'admin_request', `New admin request: ${subject} from ${req.user.name}`]
      );
    }

    res.status(201).json({ request: result.rows[0] });
  } catch (error) {
    console.error('Create admin request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update request status (Admin only)
router.patch('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, admin_response } = req.body;

    if (!['pending', 'in_progress', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE admin_requests SET status = $1, admin_response = COALESCE($2, admin_response), resolved_by_admin_id = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [status, admin_response, req.user.id, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Create notification for requester
    const request = result.rows[0];
    const io = req.app.get('io');
    io.to(`user-${request.submitted_by_user_id}`).emit('admin-request-update', {
      request_id: request.id,
      status: status
    });

    await pool.query(
      'INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3)',
      [request.submitted_by_user_id, 'admin_request', `Your admin request status has been updated to ${status}`]
    );

    res.json({ request: result.rows[0] });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete request (Data Science users can delete their own pending requests)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const requestResult = await pool.query('SELECT * FROM admin_requests WHERE id = $1', [req.params.id]);

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestResult.rows[0];

    // Check permissions
    if (req.user.role === 'data_science' && request.submitted_by_user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own requests' });
    }

    if (req.user.role === 'data_science' && request.status !== 'pending') {
      return res.status(400).json({ error: 'You can only delete pending requests' });
    }

    await pool.query('DELETE FROM admin_requests WHERE id = $1', [req.params.id]);

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;



