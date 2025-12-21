const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// All user routes require authentication
router.use(authenticateToken);

// Get user profile
router.get('/profile', async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await global.dbPool.query(
      'SELECT id, username, email, created_at, last_login, theme_preference FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    global.logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update theme preference
router.patch('/theme', async (req, res) => {
  const userId = req.user.id;
  const { theme } = req.body;

  if (!theme || !['light', 'dark'].includes(theme)) {
    return res.status(400).json({ error: 'Invalid theme. Must be "light" or "dark"' });
  }

  try {
    await global.dbPool.query(
      'UPDATE users SET theme_preference = $1 WHERE id = $2',
      [theme, userId]
    );

    // Log audit
    await global.dbPool.query(
      'INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)',
      [userId, 'THEME_CHANGED', JSON.stringify({ theme })]
    );

    res.json({ message: 'Theme updated successfully', theme });
  } catch (error) {
    global.logger.error('Update theme error:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
});

// Get user statistics
router.get('/statistics', async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await global.dbPool.query(
      'SELECT * FROM user_statistics WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        total_executions: 0,
        successful_executions: 0,
        failed_executions: 0,
        last_execution: null
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    global.logger.error('Get statistics error:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
});

module.exports = router;
