import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import LogViewer from '../components/LogViewer';
import { checkPrerequisites, listScenarios, executeScenario } from '../utils/api';
import { wsClient } from '../utils/websocket';

const MonitoringPlayground = () => {
  const [prerequisites, setPrerequisites] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [logs, setLogs] = useState([]);
  const [executing, setExecuting] = useState(false);
  const [checkingPrereqs, setCheckingPrereqs] = useState(true);

  useEffect(() => {
    checkMonitoringPrerequisites();
    setupWebSocket();

    return () => {
      wsClient.removeListener('monitoring-playground');
    };
  }, []);

  const setupWebSocket = () => {
    const token = localStorage.getItem('token');
    wsClient.connect(token);

    wsClient.addListener('monitoring-playground', (message) => {
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
        setExecuting(false);
        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString(),
            message: `Execution completed with status: ${message.status}`,
            type: message.status === 'success' ? 'success' : 'stderr',
          },
        ]);
      }
    });
  };

  const checkMonitoringPrerequisites = async () => {
    try {
      const result = await checkPrerequisites('monitoring');
      setPrerequisites(result);
      
      if (result.ready) {
        const scenariosList = await listScenarios('monitoring');
        setScenarios(scenariosList.scenarios);
      }
    } catch (error) {
      console.error('Failed to check prerequisites:', error);
    } finally {
      setCheckingPrereqs(false);
    }
  };

  const handleExecuteScenario = async () => {
    if (!selectedScenario) return;

    setExecuting(true);
    setLogs([
      {
        timestamp: new Date().toLocaleTimeString(),
        message: `Starting execution of scenario: ${selectedScenario}`,
        type: 'info',
      },
    ]);

    try {
      await executeScenario('monitoring', selectedScenario);
    } catch (error) {
      setExecuting(false);
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

  if (checkingPrereqs) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <LoadingSpinner message="Checking Monitoring prerequisites..." />
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
              Monitoring Tools Not Available
            </h2>
            <p>Docker is not installed or not accessible on this server.</p>
            <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
              Please install Docker using:
            </p>
            <pre
              style={{
                background: 'var(--code-bg)',
                padding: '12px',
                borderRadius: '8px',
                marginTop: '12px',
              }}
            >
              {prerequisites?.command || 'docker --version'}
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
        <div className="playground-container">
          {/* Sidebar */}
          <div className="playground-sidebar">
            <h2>Monitoring Scenarios</h2>
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
                      selectedScenario === scenario.name ? 'active' : ''
                    }`}
                    onClick={() => setSelectedScenario(scenario.name)}
                  >
                    <h3>{scenario.name}</h3>
                    <p>{scenario.description}</p>
                  </div>
                ))
              )}
            </div>
            {selectedScenario && (
              <div className="execution-controls">
                <button
                  className="btn btn-primary"
                  onClick={handleExecuteScenario}
                  disabled={executing}
                  style={{ width: '100%' }}
                >
                  {executing ? 'Executing...' : 'Execute Scenario'}
                </button>
              </div>
            )}
          </div>

          {/* Main Area */}
          <div className="playground-main">
            <div className="playground-header">
              <h1>Monitoring Playground</h1>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {prerequisites.version}
              </div>
            </div>
            <LogViewer logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringPlayground;
