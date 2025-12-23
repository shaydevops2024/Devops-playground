import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import LogViewer from '../components/LogViewer';
import MonitoringButtons from '../components/MonitoringButtons';
import { checkPrerequisites, listScenarios, executeScenario } from '../utils/api';
import { wsClient } from '../utils/websocket';
import { FaHome, FaArrowLeft } from 'react-icons/fa';

const ScriptingPlayground = () => {
  const navigate = useNavigate();
  const [prerequisites, setPrerequisites] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [logs, setLogs] = useState([]);
  const [executingScripts, setExecutingScripts] = useState({});
  const [checkingPrereqs, setCheckingPrereqs] = useState(true);
  const [executionStartTime, setExecutionStartTime] = useState(null);
  const timeoutsRef = useRef({});

  useEffect(() => {
    checkScriptingPrerequisites();
    setupWebSocket();

    return () => {
      wsClient.removeListener('scripting-playground');
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  const setupWebSocket = () => {
    const token = localStorage.getItem('token');
    wsClient.connect(token);

    wsClient.addListener('scripting-playground', (message) => {
      if (message.type === 'log') {
        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString(),
            message: message.data,
            type: message.stream === 'stderr' ? 'stderr' : 'stdout',
          },
        ]);
      } else if (message.type === 'execution_complete') {
        setExecutingScripts((prev) => {
          const newState = { ...prev };
          Object.keys(newState).forEach(key => {
            if (newState[key] === message.executionId) {
              delete newState[key];
              if (timeoutsRef.current[key]) {
                clearTimeout(timeoutsRef.current[key]);
                delete timeoutsRef.current[key];
              }
            }
          });
          return newState;
        });
        
        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString(),
            message: `Execution completed with status: ${message.status}`,
            type: message.status === 'success' ? 'success' : 'stderr',
          },
        ]);
      } else if (message.type === 'execution_error') {
        setExecutingScripts((prev) => {
          const newState = { ...prev };
          Object.keys(newState).forEach(key => {
            if (newState[key] === message.executionId) {
              delete newState[key];
              if (timeoutsRef.current[key]) {
                clearTimeout(timeoutsRef.current[key]);
                delete timeoutsRef.current[key];
              }
            }
          });
          return newState;
        });
      }
    });
  };

  const checkScriptingPrerequisites = async () => {
    try {
      const result = await checkPrerequisites('scripting');
      setPrerequisites(result);
      
      if (result.ready) {
        const scenariosList = await listScenarios('scripting');
        setScenarios(scenariosList.scenarios);
      }
    } catch (error) {
      console.error('Failed to check prerequisites:', error);
    } finally {
      setCheckingPrereqs(false);
    }
  };

  const handleExecuteScript = async (scriptName) => {
    if (!selectedScenario) return;

    const executionKey = `${selectedScenario.name}-${scriptName}`;
    
    if (executingScripts[executionKey]) {
      return;
    }

    setExecutionStartTime(new Date());

    setLogs([
      {
        timestamp: new Date().toLocaleTimeString(),
        message: `Starting execution: ${selectedScenario.displayName || selectedScenario.name} - ${scriptName}`,
        type: 'info',
      },
    ]);

    try {
      const response = await executeScenario('scripting', selectedScenario.name, scriptName);
      
      setExecutingScripts((prev) => ({
        ...prev,
        [executionKey]: response.executionId
      }));

      timeoutsRef.current[executionKey] = setTimeout(() => {
        console.log(`Auto-clearing execution state for ${executionKey} after timeout`);
        setExecutingScripts((prev) => {
          const newState = { ...prev };
          delete newState[executionKey];
          return newState;
        });
        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString(),
            message: `⚠️ Execution timed out or completed without proper notification`,
            type: 'stderr',
          },
        ]);
      }, 300000);

    } catch (error) {
      setExecutingScripts((prev) => {
        const newState = { ...prev };
        delete newState[executionKey];
        return newState;
      });
      
      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString(),
          message: `Error: ${error.message}`,
          type: 'stderr',
        },
      ]);
    }
  };

  const isScriptExecuting = (scriptName) => {
    if (!selectedScenario) return false;
    const executionKey = `${selectedScenario.name}-${scriptName}`;
    return !!executingScripts[executionKey];
  };

  const isAnyScriptExecuting = () => {
    return Object.keys(executingScripts).length > 0;
  };

  const clearAllExecutingStates = () => {
    setExecutingScripts({});
    Object.values(timeoutsRef.current).forEach(clearTimeout);
    timeoutsRef.current = {};
    setLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        message: '🔄 All execution states cleared',
        type: 'info',
      },
    ]);
  };

  const handleBackToScenarios = () => {
    setSelectedScenario(null);
    setLogs([]);
    setExecutionStartTime(null);
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  if (checkingPrereqs) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <LoadingSpinner message="Checking Scripting prerequisites..." />
        </div>
      </div>
    );
  }

  if (!prerequisites?.ready) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="card" style={{ maxWidth: '600px', margin: '40px auto' }}>
            <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>
              Bash Not Available
            </h2>
            <p>Bash is not installed or not accessible on this server.</p>
            <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
              Please install Bash using:
            </p>
            <pre
              style={{
                background: 'var(--code-bg)',
                padding: '12px',
                borderRadius: '8px',
                marginTop: '12px',
              }}
            >
              {prerequisites?.command || 'bash --version'}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        {/* Back/Home buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <button
            className="btn btn-secondary"
            onClick={handleGoHome}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px'
            }}
          >
            <FaHome size={16} />
            Home
          </button>
          
          {selectedScenario && (
            <button
              className="btn btn-secondary"
              onClick={handleBackToScenarios}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px'
              }}
            >
              <FaArrowLeft size={16} />
              Back to Scenarios
            </button>
          )}
        </div>

        <div className="playground-container">
          {/* Left Sidebar - Scripts */}
          <div className="playground-sidebar">
            <h2>Scripting Scenarios</h2>
            <div className="scenario-list">
              {scenarios.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>
                  No scenarios available
                </p>
              ) : (
                scenarios.map((scenario) => (
                  <div
                    key={scenario.name}
                    className={`scenario-card ${
                      selectedScenario?.name === scenario.name ? 'active' : ''
                    }`}
                    onClick={() => setSelectedScenario(scenario)}
                  >
                    <h3>{scenario.displayName || scenario.name}</h3>
                    <p>{scenario.description}</p>
                    {scenario.difficulty && (
                      <span className={`badge badge-${scenario.difficulty}`}>
                        {scenario.difficulty}
                      </span>
                    )}
                    {scenario.estimatedTime && (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                        ⏱️ {scenario.estimatedTime}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
            
            {/* Script execution buttons */}
            {selectedScenario && selectedScenario.scripts && (
              <div className="execution-controls" style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Available Scripts:</h3>
                {selectedScenario.scripts.map((script) => {
                  const isExecuting = isScriptExecuting(script.name);
                  return (
                    <button
                      key={script.name}
                      className="btn btn-primary"
                      onClick={() => handleExecuteScript(script.name)}
                      disabled={isExecuting}
                      style={{ 
                        width: '100%', 
                        marginBottom: '8px',
                        opacity: isExecuting ? 0.6 : 1,
                        cursor: isExecuting ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isExecuting ? 'Executing...' : (script.displayName || script.name)}
                    </button>
                  );
                })}
                
                {Object.keys(executingScripts).length > 0 && (
                  <button
                    className="btn"
                    onClick={clearAllExecutingStates}
                    style={{ 
                      width: '100%',
                      marginTop: '12px',
                      background: '#6c757d',
                      color: 'white',
                      fontSize: '12px'
                    }}
                  >
                    🔄 Reset All Buttons (Debug)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Main Area - Logs and Right Sidebar */}
          <div className="playground-main" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="playground-header">
              <h1>Scripting Playground</h1>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {prerequisites.version}
              </div>
            </div>
            
            {selectedScenario && (
              <div style={{ 
                padding: '16px', 
                background: 'var(--card-bg)', 
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>
                  {selectedScenario.displayName || selectedScenario.name}
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {selectedScenario.description}
                </p>
                {selectedScenario.tags && (
                  <div>
                    {selectedScenario.tags.map((tag) => (
                      <span 
                        key={tag}
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          background: 'var(--primary-color)',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px',
                          marginRight: '8px'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Logs and Monitoring side by side */}
            <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
              {/* Logs - Left side */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <LogViewer logs={logs} />
              </div>

              {/* Monitoring buttons - Right side */}
              {selectedScenario && (
                <div style={{ width: '200px', flexShrink: 0 }}>
                  <MonitoringButtons executionStartTime={executionStartTime} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptingPlayground;