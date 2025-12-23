const promClient = require('prom-client');

// Create registry
const register = new promClient.Registry();

// Collect default metrics
promClient.collectDefaultMetrics({ register });

// ============= DevOps Playground Metrics =============

// Users
const usersTotal = new promClient.Gauge({
  name: 'devops_playground_users_total',
  help: 'Total number of registered users',
  registers: [register]
});

const usersActive = new promClient.Gauge({
  name: 'devops_playground_users_active',
  help: 'Number of currently active users',
  registers: [register]
});

// Executions
const executionsTotal = new promClient.Counter({
  name: 'devops_playground_executions_total',
  help: 'Total number of scenario executions',
  labelNames: ['playground', 'scenario', 'status'],
  registers: [register]
});

const executionsSuccessful = new promClient.Counter({
  name: 'devops_playground_executions_successful',
  help: 'Number of successful executions',
  labelNames: ['playground', 'scenario'],
  registers: [register]
});

const executionsFailed = new promClient.Counter({
  name: 'devops_playground_executions_failed',
  help: 'Number of failed executions',
  labelNames: ['playground', 'scenario'],
  registers: [register]
});

const activeExecutions = new promClient.Gauge({
  name: 'devops_playground_active_executions',
  help: 'Number of currently running executions',
  registers: [register]
});

const executionDuration = new promClient.Histogram({
  name: 'devops_playground_execution_duration_seconds',
  help: 'Duration of scenario executions',
  labelNames: ['playground', 'scenario', 'status'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
  registers: [register]
});

// HTTP Metrics
const httpRequestsTotal = new promClient.Counter({
  name: 'devops_playground_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register]
});

const httpRequestDuration = new promClient.Histogram({
  name: 'devops_playground_http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

// WebSocket
const websocketConnections = new promClient.Gauge({
  name: 'devops_playground_websocket_connections',
  help: 'Active WebSocket connections',
  registers: [register]
});

// Database
const dbConnections = new promClient.Gauge({
  name: 'devops_playground_db_connections',
  help: 'Active database connections',
  registers: [register]
});

// Initialize counters from database - CORRECT TABLE NAME
async function initializeCounters(pool) {
  try {
    console.log('🔄 Initializing metrics from database...');
    
    const totalResult = await pool.query(`
      SELECT 
        playground_type,
        scenario_name,
        status,
        COUNT(*) as count
      FROM playground_executions
      GROUP BY playground_type, scenario_name, status
    `);

    totalResult.rows.forEach(row => {
      const count = parseInt(row.count);
      const playground = row.playground_type || 'unknown';
      const scenario = row.scenario_name || 'unknown';
      const status = row.status || 'unknown';

      executionsTotal.labels(playground, scenario, status).inc(count);

      if (status === 'success' || status === 'completed') {
        executionsSuccessful.labels(playground, scenario).inc(count);
      } else if (status === 'failed' || status === 'error') {
        executionsFailed.labels(playground, scenario).inc(count);
      }
    });

    console.log(`✅ Initialized ${totalResult.rows.length} execution metrics`);
  } catch (error) {
    console.error('❌ Error initializing counters:', error.message);
  }
}

// Update user metrics - CORRECT TABLE NAME
async function updateUserMetrics(pool) {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM users');
    usersTotal.set(parseInt(totalResult.rows[0].count));

    const activeResult = await pool.query(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM playground_executions 
      WHERE started_at > NOW() - INTERVAL '24 hours'
    `);
    usersActive.set(parseInt(activeResult.rows[0].count || 0));
  } catch (error) {
    console.error('Error updating user metrics:', error.message);
  }
}

// Update execution metrics - CORRECT TABLE NAME
async function updateExecutionMetrics(pool) {
  try {
    const activeResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM playground_executions 
      WHERE status = 'running'
    `);
    activeExecutions.set(parseInt(activeResult.rows[0].count || 0));
  } catch (error) {
    console.error('Error updating execution metrics:', error.message);
  }
}

// Track execution start
function trackExecutionStart(playground, scenario) {
  activeExecutions.inc();
  console.log(`▶️  Execution started: ${playground}/${scenario}`);
}

// Track execution completion
function trackExecutionComplete(playground, scenario, status, duration) {
  activeExecutions.dec();
  
  const normalizedStatus = status === 'success' || status === 'completed' ? 'success' : 'failed';
  
  executionsTotal.labels(playground, scenario, normalizedStatus).inc();
  
  if (normalizedStatus === 'success') {
    executionsSuccessful.labels(playground, scenario).inc();
  } else {
    executionsFailed.labels(playground, scenario).inc();
  }
  
  if (duration) {
    executionDuration.labels(playground, scenario, normalizedStatus).observe(duration);
  }

  console.log(`✅ Execution completed: ${playground}/${scenario} - ${normalizedStatus}`);
}

// Track HTTP request
function trackHttpRequest(method, path, status, duration) {
  httpRequestsTotal.labels(method, path, status).inc();
  httpRequestDuration.labels(method, path, status).observe(duration);
}

// Track WebSocket connection
function trackWebSocketConnection(delta) {
  if (delta > 0) {
    websocketConnections.inc(delta);
  } else {
    websocketConnections.dec(Math.abs(delta));
  }
}

// Update database connections
function updateDbConnections(count) {
  dbConnections.set(count);
}

// Start metrics collection
function startMetricsCollection(pool) {
  console.log('🚀 Starting metrics collection...');

  setTimeout(() => {
    initializeCounters(pool);
    updateUserMetrics(pool);
    updateExecutionMetrics(pool);
  }, 2000);

  setInterval(async () => {
    await updateUserMetrics(pool);
    await updateExecutionMetrics(pool);
    if (pool && pool.totalCount !== undefined) {
      updateDbConnections(pool.totalCount);
    }
  }, 10000);

  console.log('✅ Metrics collection started (updates every 10s)');
}

module.exports = {
  register,
  metrics: {
    usersTotal,
    usersActive,
    executionsTotal,
    executionsSuccessful,
    executionsFailed,
    activeExecutions,
    executionDuration,
    httpRequestsTotal,
    httpRequestDuration,
    websocketConnections,
    dbConnections
  },
  trackExecutionStart,
  trackExecutionComplete,
  trackHttpRequest,
  trackWebSocketConnection,
  updateDbConnections,
  startMetricsCollection
};
