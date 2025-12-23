const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { broadcastToUser } = require('../websocket/logStreamer');

// Check if prerequisites are installed
async function checkPrerequisites(playgroundType) {
  const checks = {
    terraform: 'terraform version',
    docker: 'docker --version',
    kubernetes: 'kubectl version --client',
    scripting: 'bash --version',
    monitoring: 'docker --version'
  };

  const command = checks[playgroundType];
  
  if (!command) {
    return { 
      ready: false, 
      message: `Unknown playground type: ${playgroundType}`,
      command: null 
    };
  }

  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(' ');
    const process = spawn(cmd, args);

    let output = '';
    let error = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      error += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({
          ready: true,
          message: `${playgroundType} is ready!`,
          command,
          version: output.trim().split('\n')[0]
        });
      } else {
        resolve({
          ready: false,
          message: `${playgroundType} is not installed or not accessible`,
          command,
          error: error || 'Command failed'
        });
      }
    });

    process.on('error', (err) => {
      resolve({
        ready: false,
        message: `Failed to check ${playgroundType}`,
        command,
        error: err.message
      });
    });
  });
}

// List available scenarios for a playground type
async function listScenarios(playgroundType) {
  const scenariosPath = path.join('/app/scenarios', playgroundType);

  try {
    const files = await fs.readdir(scenariosPath);
    
    const scenarios = [];
    
    for (const file of files) {
      const stat = await fs.stat(path.join(scenariosPath, file));
      
      if (stat.isDirectory()) {
        const metadataPath = path.join(scenariosPath, file, 'metadata.json');
        let metadata = { name: file, description: 'No description available' };
        
        try {
          const metadataContent = await fs.readFile(metadataPath, 'utf8');
          metadata = JSON.parse(metadataContent);
        } catch (e) {
          // Metadata file doesn't exist, use defaults
        }

        if (playgroundType === 'scripting' && metadata.scripts) {
          scenarios.push({
            name: file,
            ...metadata
          });
        } else {
          scenarios.push({
            name: file,
            ...metadata
          });
        }
      }
    }

    return scenarios;
  } catch (error) {
    global.logger.error(`Failed to list scenarios for ${playgroundType}:`, error);
    return [];
  }
}

// Execute a scenario
async function executeScenario(executionId, userId, playgroundType, scenarioName, scriptName = null) {
  const startTime = Date.now();
  const scenarioPath = path.join('/app/scenarios', playgroundType, scenarioName);
  
  // Verify scenario exists
  try {
    await fs.access(scenarioPath);
  } catch (error) {
    await updateExecution(executionId, 'failed', 'Scenario not found', 1);
    
    // Track failed execution
    if (typeof global.trackExecutionComplete === 'function') {
      const duration = (Date.now() - startTime) / 1000;
      global.trackExecutionComplete(playgroundType, scenarioName, 'failed', duration);
    }
    return;
  }

  // Determine execution command based on playground type
  let command, args;
  
  switch (playgroundType) {
    case 'terraform':
      command = 'bash';
      args = ['-c', `cd ${scenarioPath} && terraform init && terraform plan`];
      break;
    
    case 'docker':
      command = 'bash';
      args = ['-c', `cd ${scenarioPath} && docker-compose up -d`];
      break;
    
    case 'kubernetes':
      command = 'kubectl';
      args = ['apply', '-f', scenarioPath];
      break;
    
    case 'scripting':
      if (scriptName) {
        const scriptPath = path.join(scenarioPath, `${scriptName}.sh`);
        try {
          await fs.access(scriptPath);
          command = 'bash';
          args = [scriptPath];
        } catch (err) {
          await updateExecution(executionId, 'failed', `Script ${scriptName}.sh not found`, 1);
          if (typeof global.trackExecutionComplete === 'function') {
            const duration = (Date.now() - startTime) / 1000;
            global.trackExecutionComplete(playgroundType, scenarioName, 'failed', duration);
          }
          return;
        }
      } else {
        command = 'bash';
        args = [path.join(scenarioPath, 'script.sh')];
      }
      break;
    
    case 'monitoring':
      command = 'bash';
      args = ['-c', `cd ${scenarioPath} && docker-compose up -d`];
      break;
    
    default:
      await updateExecution(executionId, 'failed', `Unknown playground type: ${playgroundType}`, 1);
      if (typeof global.trackExecutionComplete === 'function') {
        const duration = (Date.now() - startTime) / 1000;
        global.trackExecutionComplete(playgroundType, scenarioName, 'failed', duration);
      }
      return;
  }

  // Start process
  const childProcess = spawn(command, args, {
    cwd: scenarioPath,
    env: { 
      ...process.env,
      EXECUTION_ID: executionId.toString(),
      DB_HOST: 'postgres',
      DB_PORT: '5432',
      DB_NAME: 'devops_playground',
      DB_USER: 'devops_admin',
      DB_PASS: 'DevOps2024!Secure',
      RABBITMQ_HOST: 'rabbitmq',
      RABBITMQ_PORT: '5672',
      RABBITMQ_USER: 'admin',
      RABBITMQ_PASS: 'DevOps2024!'
    }
  });

  let allLogs = '';

  // Stream stdout
  childProcess.stdout.on('data', (data) => {
    const logLine = data.toString();
    allLogs += logLine;
    broadcastToUser(userId, {
      type: 'log',
      executionId,
      data: logLine,
      stream: 'stdout'
    });
  });

  // Stream stderr
  childProcess.stderr.on('data', (data) => {
    const logLine = data.toString();
    allLogs += logLine;
    broadcastToUser(userId, {
      type: 'log',
      executionId,
      data: logLine,
      stream: 'stderr'
    });
  });

  // Handle completion
  childProcess.on('close', async (code) => {
    const status = code === 0 ? 'success' : 'failed';
    const duration = (Date.now() - startTime) / 1000;
    
    await updateExecution(executionId, status, allLogs, code);
    
    // Track metrics using global functions
    if (typeof global.trackExecutionComplete === 'function') {
      global.trackExecutionComplete(playgroundType, scenarioName, status, duration);
    }
    
    broadcastToUser(userId, {
      type: 'execution_complete',
      executionId,
      status,
      exitCode: code
    });

    global.logger.info(`Execution ${executionId} completed: ${status} (${duration}s)`);
  });

  // Handle errors
  childProcess.on('error', async (error) => {
    const duration = (Date.now() - startTime) / 1000;
    
    await updateExecution(executionId, 'failed', error.message, 1);
    
    // Track metrics
    if (typeof global.trackExecutionComplete === 'function') {
      global.trackExecutionComplete(playgroundType, scenarioName, 'failed', duration);
    }
    
    broadcastToUser(userId, {
      type: 'execution_error',
      executionId,
      error: error.message
    });

    global.logger.error(`Execution ${executionId} error:`, error);
  });
}

// Update execution record in database - CORRECT column name is 'logs'
async function updateExecution(executionId, status, logs, exitCode) {
  try {
    await global.dbPool.query(
      'UPDATE playground_executions SET status = $1, logs = $2, exit_code = $3, completed_at = CURRENT_TIMESTAMP WHERE id = $4',
      [status, logs, exitCode, executionId]
    );
  } catch (error) {
    global.logger.error('Failed to update execution:', error);
  }
}

module.exports = {
  checkPrerequisites,
  listScenarios,
  executeScenario
};
