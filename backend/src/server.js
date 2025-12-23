const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const WebSocket = require('ws');
const { Pool } = require('pg');
const winston = require('winston');

const authRoutes = require('./routes/auth');
const playgroundRoutes = require('./routes/playground');
const userRoutes = require('./routes/user');
const { setupWebSocket } = require('./websocket/logStreamer');
const metricsModule = require('./services/metrics');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://devops_admin:DevOps2024!Secure@postgres:5432/devops_playground',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    logger.error('Database connection failed:', err);
    process.exit(1);
  }
  logger.info('Database connected successfully at', res.rows[0].now);
});

// Make available globally
global.dbPool = pool;
global.logger = logger;
global.metrics = metricsModule.metrics;
global.trackExecutionStart = metricsModule.trackExecutionStart;
global.trackExecutionComplete = metricsModule.trackExecutionComplete;

// Start metrics collection
metricsModule.startMetricsCollection(pool);

const app = express();
const server = http.createServer(app);

const corsOrigin = process.env.CORS_ORIGIN || '*';
const corsOptions = {
  origin: corsOrigin === '*' ? true : corsOrigin.split(','),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

logger.info('CORS configuration:', { origin: corsOrigin });

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const path = req.route ? req.route.path : req.path;
    
    metricsModule.trackHttpRequest(
      req.method,
      path,
      res.statusCode.toString(),
      duration
    );
  });
  
  next();
});

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    origin: req.get('origin')
  });
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metricsModule.register.contentType);
    res.end(await metricsModule.register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/playground', playgroundRoutes);
app.use('/api/user', userRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const wss = new WebSocket.Server({ server, path: '/ws' });
setupWebSocket(wss);

// Track WebSocket connections
wss.on('connection', () => {
  metricsModule.trackWebSocketConnection(1);
});

wss.on('close', () => {
  metricsModule.trackWebSocketConnection(-1);
});

const PORT = process.env.PORT || 5000;
const METRICS_PORT = process.env.METRICS_PORT || 9090;

// Start main server
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 DevOps Playground Backend running on port ${PORT}`);
  logger.info(`📡 WebSocket server ready at ws://0.0.0.0:${PORT}/ws`);
  logger.info(`🌐 CORS enabled for: ${corsOrigin}`);
});

// Start metrics server on separate port
const metricsApp = express();
metricsApp.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metricsModule.register.contentType);
    res.end(await metricsModule.register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

metricsApp.listen(METRICS_PORT, '0.0.0.0', () => {
  logger.info(`📊 Metrics endpoint available at http://0.0.0.0:${METRICS_PORT}/metrics`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing server gracefully...');
  server.close(() => {
    pool.end(() => {
      logger.info('Database pool closed');
      process.exit(0);
    });
  });
});

module.exports = { app, server };