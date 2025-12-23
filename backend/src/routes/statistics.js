const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// All statistics routes require authentication
router.use(authenticateToken);

/**
 * Get overall platform statistics
 * Returns total users, executions, success rate, etc.
 */
router.get('/overview', async (req, res) => {
  try {
    // Get total users count
    const totalUsersResult = await global.dbPool.query(
      'SELECT COUNT(*) as count FROM users WHERE is_active = true'
    );
    const totalUsers = parseInt(totalUsersResult.rows[0].count);

    // Get total executions
    const totalExecutionsResult = await global.dbPool.query(
      'SELECT COUNT(*) as count FROM playground_executions'
    );
    const totalExecutions = parseInt(totalExecutionsResult.rows[0].count);

    // Get successful executions
    const successfulExecutionsResult = await global.dbPool.query(
      "SELECT COUNT(*) as count FROM playground_executions WHERE status = 'success'"
    );
    const successfulExecutions = parseInt(successfulExecutionsResult.rows[0].count);

    // Get failed executions
    const failedExecutionsResult = await global.dbPool.query(
      "SELECT COUNT(*) as count FROM playground_executions WHERE status = 'failed'"
    );
    const failedExecutions = parseInt(failedExecutionsResult.rows[0].count);

    // Calculate success rate
    const successRate = totalExecutions > 0 
      ? ((successfulExecutions / totalExecutions) * 100).toFixed(2)
      : 0;

    // Get executions by playground type
    const executionsByTypeResult = await global.dbPool.query(
      'SELECT playground_type, COUNT(*) as count FROM playground_executions GROUP BY playground_type ORDER BY count DESC'
    );

    // Get recent activity (last 7 days)
    const recentActivityResult = await global.dbPool.query(
      `SELECT 
        DATE(started_at) as date,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM playground_executions 
      WHERE started_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(started_at)
      ORDER BY date DESC`
    );

    // Get average execution time (for completed executions)
    const avgExecutionTimeResult = await global.dbPool.query(
      `SELECT 
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_seconds
      FROM playground_executions 
      WHERE completed_at IS NOT NULL AND started_at IS NOT NULL`
    );
    const avgExecutionTime = avgExecutionTimeResult.rows[0].avg_seconds 
      ? parseFloat(avgExecutionTimeResult.rows[0].avg_seconds).toFixed(2)
      : 0;

    res.json({
      totalUsers,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate: parseFloat(successRate),
      executionsByType: executionsByTypeResult.rows,
      recentActivity: recentActivityResult.rows,
      avgExecutionTime: parseFloat(avgExecutionTime)
    });
  } catch (error) {
    global.logger.error('Get overview statistics error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

/**
 * Get detailed user statistics
 * Returns user list with their activity metrics
 */
router.get('/users', async (req, res) => {
  try {
    const result = await global.dbPool.query(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.created_at,
        u.last_login,
        COUNT(DISTINCT pe.id) as total_executions,
        COUNT(DISTINCT CASE WHEN pe.status = 'success' THEN pe.id END) as successful_executions,
        COUNT(DISTINCT CASE WHEN pe.status = 'failed' THEN pe.id END) as failed_executions,
        MAX(pe.completed_at) as last_execution
      FROM users u
      LEFT JOIN playground_executions pe ON u.id = pe.user_id
      WHERE u.is_active = true
      GROUP BY u.id, u.username, u.email, u.created_at, u.last_login
      ORDER BY u.created_at DESC`
    );

    res.json({ users: result.rows });
  } catch (error) {
    global.logger.error('Get user statistics error:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
});

/**
 * Get execution statistics
 * Returns detailed breakdown of all executions
 */
router.get('/executions', async (req, res) => {
  try {
    const timeRange = req.query.range || '7d'; // 24h, 7d, 30d, all
    let timeFilter = '';

    switch (timeRange) {
      case '24h':
        timeFilter = "WHERE started_at >= NOW() - INTERVAL '24 hours'";
        break;
      case '7d':
        timeFilter = "WHERE started_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        timeFilter = "WHERE started_at >= NOW() - INTERVAL '30 days'";
        break;
      default:
        timeFilter = '';
    }

    // Get execution statistics by status
    const statusStatsResult = await global.dbPool.query(
      `SELECT 
        status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration
      FROM playground_executions 
      ${timeFilter}
      GROUP BY status`
    );

    // Get execution statistics by playground type
    const typeStatsResult = await global.dbPool.query(
      `SELECT 
        playground_type,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration
      FROM playground_executions 
      ${timeFilter}
      GROUP BY playground_type
      ORDER BY total DESC`
    );

    // Get hourly execution trend (last 24 hours)
    const hourlyTrendResult = await global.dbPool.query(
      `SELECT 
        DATE_TRUNC('hour', started_at) as hour,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM playground_executions 
      WHERE started_at >= NOW() - INTERVAL '24 hours'
      GROUP BY DATE_TRUNC('hour', started_at)
      ORDER BY hour DESC`
    );

    // Get most popular scenarios
    const popularScenariosResult = await global.dbPool.query(
      `SELECT 
        scenario_name,
        playground_type,
        COUNT(*) as execution_count,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
        (COUNT(CASE WHEN status = 'success' THEN 1 END)::float / COUNT(*)::float * 100) as success_rate
      FROM playground_executions 
      ${timeFilter}
      GROUP BY scenario_name, playground_type
      ORDER BY execution_count DESC
      LIMIT 10`
    );

    res.json({
      timeRange,
      statusStats: statusStatsResult.rows,
      typeStats: typeStatsResult.rows,
      hourlyTrend: hourlyTrendResult.rows,
      popularScenarios: popularScenariosResult.rows
    });
  } catch (error) {
    global.logger.error('Get execution statistics error:', error);
    res.status(500).json({ error: 'Failed to get execution statistics' });
  }
});

/**
 * Get current active executions
 * Returns list of currently running executions
 */
router.get('/active', async (req, res) => {
  try {
    const result = await global.dbPool.query(
      `SELECT 
        pe.id,
        pe.user_id,
        u.username,
        pe.playground_type,
        pe.scenario_name,
        pe.status,
        pe.started_at,
        EXTRACT(EPOCH FROM (NOW() - pe.started_at)) as duration_seconds
      FROM playground_executions pe
      JOIN users u ON pe.user_id = u.id
      WHERE pe.status = 'running'
      ORDER BY pe.started_at DESC`
    );

    res.json({ activeExecutions: result.rows });
  } catch (error) {
    global.logger.error('Get active executions error:', error);
    res.status(500).json({ error: 'Failed to get active executions' });
  }
});

/**
 * Get playground usage statistics
 * Returns usage patterns and trends
 */
router.get('/usage', async (req, res) => {
  try {
    // Get daily active users (last 30 days)
    const dailyActiveUsersResult = await global.dbPool.query(
      `SELECT 
        DATE(started_at) as date,
        COUNT(DISTINCT user_id) as active_users
      FROM playground_executions 
      WHERE started_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(started_at)
      ORDER BY date DESC`
    );

    // Get peak usage hours
    const peakHoursResult = await global.dbPool.query(
      `SELECT 
        EXTRACT(HOUR FROM started_at) as hour,
        COUNT(*) as execution_count
      FROM playground_executions 
      WHERE started_at >= NOW() - INTERVAL '30 days'
      GROUP BY EXTRACT(HOUR FROM started_at)
      ORDER BY execution_count DESC
      LIMIT 5`
    );

    // Get average executions per user
    const avgExecutionsResult = await global.dbPool.query(
      `SELECT 
        AVG(execution_count) as avg_executions
      FROM (
        SELECT user_id, COUNT(*) as execution_count
        FROM playground_executions
        GROUP BY user_id
      ) as user_executions`
    );

    // Get retention metrics (users who returned)
    const retentionResult = await global.dbPool.query(
      `SELECT 
        COUNT(DISTINCT user_id) as total_users,
        COUNT(DISTINCT CASE WHEN execution_count > 1 THEN user_id END) as returning_users
      FROM (
        SELECT user_id, COUNT(*) as execution_count
        FROM playground_executions
        GROUP BY user_id
      ) as user_executions`
    );

    const totalUsers = parseInt(retentionResult.rows[0].total_users);
    const returningUsers = parseInt(retentionResult.rows[0].returning_users);
    const retentionRate = totalUsers > 0 
      ? ((returningUsers / totalUsers) * 100).toFixed(2)
      : 0;

    res.json({
      dailyActiveUsers: dailyActiveUsersResult.rows,
      peakHours: peakHoursResult.rows,
      avgExecutionsPerUser: parseFloat(avgExecutionsResult.rows[0].avg_executions || 0).toFixed(2),
      retentionRate: parseFloat(retentionRate),
      totalUsers,
      returningUsers
    });
  } catch (error) {
    global.logger.error('Get usage statistics error:', error);
    res.status(500).json({ error: 'Failed to get usage statistics' });
  }
});

/**
 * Get system health metrics
 * Returns current system status and health indicators
 */
router.get('/health', async (req, res) => {
  try {
    // Get database connection pool stats
    const dbStats = {
      totalConnections: global.dbPool.totalCount,
      idleConnections: global.dbPool.idleCount,
      waitingConnections: global.dbPool.waitingCount
    };

    // Get recent error rate
    const errorRateResult = await global.dbPool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as errors
      FROM playground_executions 
      WHERE started_at >= NOW() - INTERVAL '1 hour'`
    );

    const total = parseInt(errorRateResult.rows[0].total);
    const errors = parseInt(errorRateResult.rows[0].errors);
    const errorRate = total > 0 ? ((errors / total) * 100).toFixed(2) : 0;

    // Get current active executions count
    const activeExecutionsResult = await global.dbPool.query(
      "SELECT COUNT(*) as count FROM playground_executions WHERE status = 'running'"
    );
    const activeExecutions = parseInt(activeExecutionsResult.rows[0].count);

    // System uptime
    const uptime = process.uptime();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime,
      database: dbStats,
      errorRate: parseFloat(errorRate),
      activeExecutions,
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external
      }
    });
  } catch (error) {
    global.logger.error('Get system health error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'Failed to get system health' 
    });
  }
});

module.exports = router;