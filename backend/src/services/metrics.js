const promClient = require('prom-client');

// Create registry
const register = new promClient.Registry();

// Collect default metrics (CPU, memory, etc.)
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

// Executions - Use Counters properly
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

const dbQueryDuration = new promClient.Histogram({
  name: 'devops_playground_db_query_duration_seconds',
  help: 'Database query duration',
  labelNames: ['query_type'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register]
});

// ============= Counter Tracking (for initialization) =============
let lastExecutionCounts = {
  total: 0,
  successful: 0,
  failed: 0
};

// ============= Helper Functions =============

// Initialize counters from database
async function initializeCounters(pool) {
  try {
    // Get total executions from database
    const totalResult = await pool.query(`
      SELECT 
        playground_type,
        scenario_name,
        status,
        COUNT(*) as count
      FROM executions
      GROUP BY playground_type, scenario_name, status
    `);

    // Initialize counters with existing data
    totalResult.rows.forEach(row => {
      const count = parseInt(row.count);
      const playground = row.playground_type || 'unknown';
      const scenario = row.scenario_name || 'unknown';
      const status = row.status || 'unknown';

      // Increment counter to match database
      for (let i = 0; i < count; i++) {
        executionsTotal.labels(playground, scenario, status).inc(0);
      }
      // Set to actual count
      executionsTotal.labels(playground, scenario, status).inc(count);

      // Track successful/failed
      if (status === 'completed' || status === 'success') {
        executionsSuccessful.labels(playground, scenario).inc(count);
      } else if (status === 'failed' || status === 'error') {
        executionsFailed.labels(playground, scenario).inc(count);
      }
    });

    console.log('✅ Counters initialized from database');
  } catch (error) {
    console.error('❌ Error initializing counters:', error);
  }
}

// Update user metrics from database
async function updateUserMetrics(pool) {
  try {
    // Total users
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(totalResult.rows[0].count);
    usersTotal.set(totalUsers);

    // Active users (logged in or executed within last 24 hours)
    const activeResult = await pool.query(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM executions 
      WHERE started_at > NOW() - INTERVAL '24 hours'
    `);
    const activeUsers = parseInt(activeResult.rows[0].count || 0);
    usersActive.set(activeUsers);

    console.log(`📊 Users - Total: ${totalUsers}, Active: ${activeUsers}`);
  } catch (error) {
    console.error('Error updating user metrics:', error);
    // Set to 0 if error
    usersTotal.set(0);
    usersActive.set(0);
  }
}

// Update execution metrics from database
async function updateExecutionMetrics(pool) {
  try {
    // Active executions
    const activeResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM executions 
      WHERE status = 'running'
    `);
    const active = parseInt(activeResult.rows[0].count || 0);
    activeExecutions.set(active);

    console.log(`📊 Active Executions: ${active}`);
  } catch (error) {
    console.error('Error updating execution metrics:', error);
    activeExecutions.set(0);
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
  
  const normalizedStatus = status === 'completed' || status === 'success' ? 'success' : 'failed';
  
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

// Update database connection count
function updateDbConnections(count) {
  dbConnections.set(count);
}

// Track database query
function trackDbQuery(queryType, duration) {
  dbQueryDuration.labels(queryType).observe(duration);
}

// Start periodic metrics updates
function startMetricsCollection(pool) {
  console.log('🚀 Starting metrics collection...');

  // Initialize counters immediately
  initializeCounters(pool);

  // Update user metrics immediately
  updateUserMetrics(pool);
  updateExecutionMetrics(pool);

  // Update metrics every 10 seconds (faster than before)
  setInterval(async () => {
    await updateUserMetrics(pool);
    await updateExecutionMetrics(pool);
    
    // Update DB connections
    if (pool && pool.totalCount !== undefined) {
      updateDbConnections(pool.totalCount);
    }
  }, 10000); // 10 seconds instead of 30

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
    dbConnections,
    dbQueryDuration
  },
  trackExecutionStart,
  trackExecutionComplete,
  trackHttpRequest,
  trackWebSocketConnection,
  updateDbConnections,
  trackDbQuery,
  startMetricsCollection,
  updateUserMetrics,
  updateExecutionMetrics,
  initializeCounters
};
