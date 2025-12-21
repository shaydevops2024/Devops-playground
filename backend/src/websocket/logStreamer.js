const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Store active WebSocket connections by user ID
const userConnections = new Map();

function setupWebSocket(wss) {
  wss.on('connection', (ws, req) => {
    global.logger.info('New WebSocket connection');

    let userId = null;
    let isAuthenticated = false;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);

        // Handle authentication
        if (data.type === 'auth') {
          const token = data.token;

          if (!token) {
            ws.send(JSON.stringify({ type: 'error', message: 'No token provided' }));
            ws.close();
            return;
          }

          try {
            // Verify JWT
            const decoded = jwt.verify(token, JWT_SECRET);

            // Check session validity
            const session = await global.dbPool.query(
              'SELECT user_id FROM user_sessions WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP',
              [token]
            );

            if (session.rows.length === 0) {
              ws.send(JSON.stringify({ type: 'error', message: 'Invalid or expired token' }));
              ws.close();
              return;
            }

            userId = session.rows[0].user_id;
            isAuthenticated = true;

            // Store connection
            if (!userConnections.has(userId)) {
              userConnections.set(userId, new Set());
            }
            userConnections.get(userId).add(ws);

            // Send authentication success
            ws.send(JSON.stringify({ 
              type: 'auth_success', 
              message: 'WebSocket authenticated',
              userId 
            }));

            global.logger.info(`WebSocket authenticated for user ${userId}`);
          } catch (error) {
            ws.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }));
            ws.close();
          }
        } else if (!isAuthenticated) {
          ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
          ws.close();
        } else {
          // Handle other message types
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        }
      } catch (error) {
        global.logger.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      if (userId && userConnections.has(userId)) {
        userConnections.get(userId).delete(ws);
        if (userConnections.get(userId).size === 0) {
          userConnections.delete(userId);
        }
        global.logger.info(`WebSocket disconnected for user ${userId}`);
      }
    });

    ws.on('error', (error) => {
      global.logger.error('WebSocket error:', error);
    });

    // Send welcome message
    ws.send(JSON.stringify({ 
      type: 'welcome', 
      message: 'Connected to DevOps Playground WebSocket. Please authenticate.' 
    }));
  });

  global.logger.info('WebSocket server setup complete');
}

// Broadcast message to a specific user
function broadcastToUser(userId, message) {
  if (userConnections.has(userId)) {
    const connections = userConnections.get(userId);
    const messageStr = JSON.stringify(message);
    
    connections.forEach((ws) => {
      if (ws.readyState === 1) { // OPEN
        ws.send(messageStr);
      }
    });
  }
}

// Broadcast message to all connected users
function broadcastToAll(message) {
  const messageStr = JSON.stringify(message);
  
  userConnections.forEach((connections) => {
    connections.forEach((ws) => {
      if (ws.readyState === 1) { // OPEN
        ws.send(messageStr);
      }
    });
  });
}

module.exports = {
  setupWebSocket,
  broadcastToUser,
  broadcastToAll
};
