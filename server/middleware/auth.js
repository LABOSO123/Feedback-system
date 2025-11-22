const jwt = require('jsonwebtoken');
const pool = require('../database/db');

/**
 * Authentication Middleware
 * 
 * Verifies JWT token from Authorization header and attaches user to request object.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header provided. Please log in again.' });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return res.status(401).json({ error: 'No token provided. Please log in again.' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired. Please log in again.' });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token. Please log in again.' });
      } else {
        return res.status(401).json({ error: 'Token verification failed. Please log in again.' });
      }
    }
    
    // Get user from database
    const result = await pool.query(
      'SELECT id, name, email, role, team_id FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found. Please log in again.' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed. Please log in again.' });
  }
};

/**
 * Authorization Middleware Factory
 * 
 * Creates middleware that checks if the authenticated user has one of the required roles.
 * 
 * @param {...string} roles - Allowed user roles (e.g., 'admin', 'business', 'data_science')
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Only allow admin users
 * router.get('/admin-only', authenticate, authorize('admin'), handler);
 * 
 * @example
 * // Allow both admin and business users
 * router.get('/shared', authenticate, authorize('admin', 'business'), handler);
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = { authenticate, authorize };


