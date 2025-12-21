-- DevOps Playground Database Initialization

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    theme_preference VARCHAR(10) DEFAULT 'light'
);

-- Create sessions table for tracking user activity
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Create playground_executions table to track scenario runs
CREATE TABLE IF NOT EXISTS playground_executions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    playground_type VARCHAR(50) NOT NULL,
    scenario_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    logs TEXT,
    exit_code INTEGER
);

-- Create audit_log table for security tracking
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token);
CREATE INDEX idx_playground_executions_user_id ON playground_executions(user_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);

-- Insert a demo user (password: Demo123!)
-- Password hash is bcrypt hash of "Demo123!"
INSERT INTO users (username, email, password_hash, theme_preference) 
VALUES (
    'demo_user',
    'demo@devops-playground.local',
    '$2b$10$YourBcryptHashHereChangeThis',
    'light'
) ON CONFLICT (username) DO NOTHING;

-- Create view for user statistics
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    u.id,
    u.username,
    u.email,
    COUNT(DISTINCT pe.id) as total_executions,
    COUNT(DISTINCT CASE WHEN pe.status = 'success' THEN pe.id END) as successful_executions,
    COUNT(DISTINCT CASE WHEN pe.status = 'failed' THEN pe.id END) as failed_executions,
    MAX(pe.completed_at) as last_execution,
    u.created_at,
    u.last_login
FROM users u
LEFT JOIN playground_executions pe ON u.id = pe.user_id
GROUP BY u.id, u.username, u.email, u.created_at, u.last_login;
