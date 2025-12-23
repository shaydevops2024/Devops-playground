const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
  checkPrerequisites, 
  listScenarios, 
  executeScenario 
} = require('../services/playgroundService');

// All playground routes require authentication
router.use(authenticateToken);

// Check prerequisites for a playground type
router.post('/check-prerequisites', async (req, res) => {
  const { playgroundType } = req.body;

  if (!playgroundType) {
    return res.status(400).json({ error: 'Playground type is required' });
  }

  try {
    const result = await checkPrerequisites(playgroundType);
    res.json(result);
  } catch (error) {
    global.logger.error('Prerequisites check error:', error);
    res.status(500).json({ error: 'Failed to check prerequisites' });
  }
});

// List available scenarios for a playground type
router.get('/scenarios/:playgroundType', async (req, res) => {
  const { playgroundType } = req.params;

  try {
    const scenarios = await listScenarios(playgroundType);
    res.json({ scenarios });
  } catch (error) {
    global.logger.error('List scenarios error:', error);
    res.status(500).json({ error: 'Failed to list scenarios' });
  }
});

// Execute a scenario or specific script
router.post('/execute', async (req, res) => {
  const { playgroundType, scenarioName, scriptName } = req.body;
  const userId = req.user.id;

  if (!playgroundType || !scenarioName) {
    return res.status(400).json({ error: 'Playground type and scenario name are required' });
  }

  try {
    // Create execution record - CORRECT table name
    const execution = await global.dbPool.query(
      'INSERT INTO playground_executions (user_id, playground_type, scenario_name, status, started_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING id',
      [userId, playgroundType, `${scenarioName}${scriptName ? ':' + scriptName : ''}`, 'running']
    );

    const executionId = execution.rows[0].id;

    // Track execution start in metrics
    if (typeof global.trackExecutionStart === 'function') {
      global.trackExecutionStart(playgroundType, scenarioName);
    }

    // Start execution (this will stream logs via WebSocket)
    executeScenario(executionId, userId, playgroundType, scenarioName, scriptName);

    res.json({ 
      message: scriptName 
        ? `Script '${scriptName}' execution started` 
        : 'Scenario execution started',
      executionId 
    });
  } catch (error) {
    global.logger.error('Execute scenario error:', error);
    res.status(500).json({ error: 'Failed to execute scenario', details: error.message });
  }
});

// Get execution status
router.get('/execution/:executionId', async (req, res) => {
  const { executionId } = req.params;
  const userId = req.user.id;

  try {
    const result = await global.dbPool.query(
      'SELECT id, playground_type, scenario_name, status, started_at, completed_at, exit_code FROM playground_executions WHERE id = $1 AND user_id = $2',
      [executionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    global.logger.error('Get execution error:', error);
    res.status(500).json({ error: 'Failed to get execution status' });
  }
});

// Get user's execution history
router.get('/history', async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const result = await global.dbPool.query(
      'SELECT id, playground_type, scenario_name, status, started_at, completed_at, exit_code FROM playground_executions WHERE user_id = $1 ORDER BY started_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );

    res.json({ executions: result.rows });
  } catch (error) {
    global.logger.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get execution history' });
  }
});

module.exports = router;
