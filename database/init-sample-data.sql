-- Database Initialization Script
-- This creates sample data so Grafana dashboards show data immediately

-- Insert sample users if they don't exist
INSERT INTO users (username, email, password_hash, created_at, updated_at)
VALUES 
  ('demo_user1', 'demo1@example.com', '$2b$10$YourHashedPasswordHere', NOW(), NOW()),
  ('demo_user2', 'demo2@example.com', '$2b$10$YourHashedPasswordHere', NOW(), NOW()),
  ('demo_user3', 'demo3@example.com', '$2b$10$YourHashedPasswordHere', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Insert sample executions
DO $$
DECLARE
  user_ids INTEGER[];
  user_id INTEGER;
  i INTEGER;
BEGIN
  -- Get existing user IDs
  SELECT ARRAY_AGG(id) INTO user_ids FROM users LIMIT 3;
  
  IF array_length(user_ids, 1) > 0 THEN
    -- Create sample executions for the last 6 hours
    FOR i IN 1..20 LOOP
      user_id := user_ids[1 + (i % array_length(user_ids, 1))];
      
      -- Successful execution
      INSERT INTO executions (
        user_id, 
        playground_type, 
        scenario_name, 
        status, 
        started_at, 
        completed_at,
        output
      ) VALUES (
        user_id,
        CASE (i % 4)
          WHEN 0 THEN 'docker'
          WHEN 1 THEN 'kubernetes'
          WHEN 2 THEN 'terraform'
          ELSE 'scripting'
        END,
        'sample-scenario-' || i,
        'completed',
        NOW() - (random() * INTERVAL '6 hours'),
        NOW() - (random() * INTERVAL '5 hours'),
        '{"logs": ["Execution completed successfully"]}'
      );
      
      -- Occasional failed execution
      IF i % 5 = 0 THEN
        INSERT INTO executions (
          user_id,
          playground_type,
          scenario_name,
          status,
          started_at,
          completed_at,
          output
        ) VALUES (
          user_id,
          'docker',
          'failing-scenario',
          'failed',
          NOW() - (random() * INTERVAL '6 hours'),
          NOW() - (random() * INTERVAL '5 hours'),
          '{"logs": ["Execution failed"], "error": "Sample error"}'
        );
      END IF;
    END LOOP;
  END IF;
END $$;

-- Verify data was inserted
SELECT 
  'Users created' as info,
  COUNT(*) as count
FROM users;

SELECT 
  'Executions created' as info,
  COUNT(*) as count
FROM executions;

SELECT 
  'Executions by status' as info,
  status,
  COUNT(*) as count
FROM executions
GROUP BY status;
