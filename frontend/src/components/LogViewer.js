import React, { useEffect, useRef } from 'react';
import { FaChartLine, FaServer, FaFileAlt, FaTachometerAlt } from 'react-icons/fa';

const LogViewer = ({ logs, showMonitoringButtons = false, onOpenMetrics }) => {
  const logsEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getLogStyle = (type) => {
    const baseStyle = {
      padding: '8px 12px',
      marginBottom: '4px',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '14px',
      lineHeight: '1.5',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    };

    switch (type) {
      case 'stderr':
        return { 
          ...baseStyle, 
          backgroundColor: '#fee', 
          borderLeft: '3px solid #dc3545',
          color: '#721c24'
        };
      case 'success':
        return { 
          ...baseStyle, 
          backgroundColor: '#d4edda', 
          borderLeft: '3px solid #28a745',
          color: '#155724'
        };
      case 'info':
        return { 
          ...baseStyle, 
          backgroundColor: '#d1ecf1', 
          borderLeft: '3px solid #17a2b8',
          color: '#0c5460'
        };
      default:
        return { 
          ...baseStyle, 
          backgroundColor: 'var(--code-bg)', 
          borderLeft: '3px solid var(--border-color)',
          color: 'var(--text-primary)'
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Monitoring Buttons */}
      {showMonitoringButtons && onOpenMetrics && (
        <div style={{
          display: 'flex',
          gap: '10px',
          padding: '12px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px 8px 0 0',
          borderBottom: '2px solid var(--border-color)',
          flexWrap: 'wrap'
        }}>
          <button
            className="btn btn-secondary"
            onClick={() => onOpenMetrics('execution')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              padding: '8px 12px'
            }}
            title="View real-time execution metrics in Grafana"
          >
            <FaChartLine />
            Execution Metrics
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={() => onOpenMetrics('system')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              padding: '8px 12px'
            }}
            title="View system resource usage in real-time"
          >
            <FaServer />
            System Resources
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={() => onOpenMetrics('logs')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              padding: '8px 12px'
            }}
            title="View detailed logs in Grafana Explore"
          >
            <FaFileAlt />
            View in Loki
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={() => onOpenMetrics('metrics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              padding: '8px 12px'
            }}
            title="View complete metrics dashboard"
          >
            <FaTachometerAlt />
            Full Dashboard
          </button>
        </div>
      )}

      {/* Logs Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: 'var(--code-bg)',
          borderRadius: showMonitoringButtons ? '0 0 8px 8px' : '8px',
          maxHeight: showMonitoringButtons ? 'calc(100vh - 350px)' : 'calc(100vh - 280px)',
          minHeight: '400px',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ 
            color: 'var(--text-secondary)', 
            textAlign: 'center',
            padding: '40px 20px',
            fontStyle: 'italic'
          }}>
            No logs yet. Execute a scenario to see output here.
            {showMonitoringButtons && (
              <div style={{ marginTop: '20px', fontSize: '14px' }}>
                💡 Use the buttons above to monitor execution in real-time!
              </div>
            )}
          </div>
        ) : (
          <>
            {logs.map((log, index) => (
              <div key={index} style={getLogStyle(log.type)}>
                <span style={{ 
                  color: 'var(--text-secondary)', 
                  marginRight: '12px',
                  fontSize: '12px'
                }}>
                  [{log.timestamp}]
                </span>
                {log.message}
              </div>
            ))}
            <div ref={logsEndRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default LogViewer;