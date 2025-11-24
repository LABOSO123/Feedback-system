const express = require('express');
const pool = require('../database/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get all comments for an issue
router.get('/issue/:issueId', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name as user_name, u.role as user_role 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.issue_id = $1 
       ORDER BY c.created_at ASC`,
      [req.params.issueId]
    );

    res.json({ comments: result.rows });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create comment
router.post('/', authenticate, async (req, res) => {
  try {
    const { issue_id, comment_text, attachment_url } = req.body;

    if (!issue_id || !comment_text) {
      return res.status(400).json({ error: 'Issue ID and comment text are required' });
    }

    // Check if user can reply
    const issueResult = await pool.query('SELECT * FROM issues WHERE id = $1', [issue_id]);
    if (issueResult.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const issue = issueResult.rows[0];

    // Block comments if thread is complete
    if (issue.status === 'complete') {
      return res.status(403).json({ error: 'Cannot add comments to completed threads' });
    }

    // Business users can now reply to any thread (not just their own)
    // Data science users can reply to any thread

    // Create comment
    const result = await pool.query(
      'INSERT INTO comments (issue_id, user_id, comment_text, attachment_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [issue_id, req.user.id, comment_text, attachment_url || null]
    );

    const comment = result.rows[0];

    // Get user info for the comment
    const userResult = await pool.query('SELECT name, role FROM users WHERE id = $1', [req.user.id]);
    comment.user_name = userResult.rows[0].name;
    comment.user_role = userResult.rows[0].role;

    // Auto-change status to 'in_progress' when team member replies (if still pending)
    if (req.user.role === 'data_science' && issue.assigned_team_id === req.user.team_id && issue.status === 'pending') {
      await pool.query(
        'UPDATE issues SET status = $1 WHERE id = $2',
        ['in_progress', issue_id]
      );
      issue.status = 'in_progress';
    }

    // Create notifications for all relevant users
    try {
      const io = req.app.get('io');
      
      if (req.user.role === 'data_science') {
        // Notify the business user who created the thread
        if (io) {
          io.to(`user-${issue.submitted_by_user_id}`).emit('new-reply', {
            issue_id: issue_id,
            comment: comment
          });
        }
        
        // Create database notification for thread creator
        await pool.query(
          'INSERT INTO notifications (user_id, issue_id, type, message) VALUES ($1, $2, $3, $4)',
          [issue.submitted_by_user_id, issue_id, 'reply', `${req.user.name} replied to your thread`]
        );

        // Notify other team members
        if (issue.assigned_team_id) {
          const teamMembers = await pool.query(
            'SELECT id FROM users WHERE team_id = $1 AND id != $2',
            [issue.assigned_team_id, req.user.id]
          );
          
          for (const member of teamMembers.rows) {
            if (io) {
              io.to(`user-${member.id}`).emit('new-reply', {
                issue_id: issue_id,
                comment: comment
              });
            }
            
            await pool.query(
              'INSERT INTO notifications (user_id, issue_id, type, message) VALUES ($1, $2, $3, $4)',
              [member.id, issue_id, 'reply', `${req.user.name} replied to a thread`]
            );
          }
        }
      } else if (req.user.role === 'business') {
        // Business user replied - notify assigned team
        if (issue.assigned_team_id) {
          const teamMembers = await pool.query('SELECT id FROM users WHERE team_id = $1', [issue.assigned_team_id]);
          
          for (const member of teamMembers.rows) {
            if (io) {
              io.to(`user-${member.id}`).emit('new-reply', {
                issue_id: issue_id,
                comment: comment
              });
            }
            
            await pool.query(
              'INSERT INTO notifications (user_id, issue_id, type, message) VALUES ($1, $2, $3, $4)',
              [member.id, issue_id, 'reply', `${req.user.name} replied to a thread`]
            );
          }
        }
        
        // Also notify the original thread creator if different user
        if (issue.submitted_by_user_id !== req.user.id) {
          if (io) {
            io.to(`user-${issue.submitted_by_user_id}`).emit('new-reply', {
              issue_id: issue_id,
              comment: comment
            });
          }
          
          await pool.query(
            'INSERT INTO notifications (user_id, issue_id, type, message) VALUES ($1, $2, $3, $4)',
            [issue.submitted_by_user_id, issue_id, 'reply', `${req.user.name} replied to a thread you're following`]
          );
        }
      }
    } catch (notifError) {
      console.error('Error creating notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    // Record leaderboard activity for data science users
    if (req.user.role === 'data_science') {
      await pool.query(
        'INSERT INTO leaderboard_activity (user_id, issue_id, action) VALUES ($1, $2, $3)',
        [req.user.id, issue_id, 'responded']
      );
    }

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update comment (only by creator)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { comment_text } = req.body;

    const commentResult = await pool.query('SELECT * FROM comments WHERE id = $1', [req.params.id]);
    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (commentResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    const result = await pool.query(
      'UPDATE comments SET comment_text = $1 WHERE id = $2 RETURNING *',
      [comment_text, req.params.id]
    );

    res.json({ comment: result.rows[0] });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete comment (only by creator)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const commentResult = await pool.query('SELECT * FROM comments WHERE id = $1', [req.params.id]);
    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (commentResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [req.params.id]);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

