import React from 'react';
import { FaChartLine, FaServer, FaFileAlt, FaTachometerAlt, FaChartBar, FaBug } from 'react-icons/fa';

const MonitoringButtons = ({ executionStartTime = null, compact = false }) => {
  const monitoringTools = [
    {
      name: 'Grafana',
      url: 'http://localhost:3001/d/devops-playground-overview/devops-playground-overview',
      icon: <FaChartLine />,
      color: '#F46800'
    },
    {
      name: 'Prometheus',
      url: 'http://localhost:9091/graph',
      icon: <FaChartBar />,
      color: '#E6522C'
    },
    {
      name: 'Loki Logs',
      // Simple URL that works - just opens Explore with Loki pre-selected
      url: 'http://localhost:3001/explore?schemaVersion=1&panes=%7B%22bvr%22%3A%7B%22datasource%22%3A%22Loki%22%2C%22queries%22%3A%5B%7B%22refId%22%3A%22A%22%2C%22expr%22%3A%22%7Bjob%3D%5C%22varlogs%5C%22%7D%22%7D%5D%2C%22range%22%3A%7B%22from%22%3A%22now-1h%22%2C%22to%22%3A%22now%22%7D%7D%7D&orgId=1',
      icon: <FaFileAlt />,
      color: '#F5B800'
    },
    {
      name: 'cAdvisor',
      url: 'http://localhost:8080/containers',
      icon: <FaServer />,
      color: '#326CE5'
    },
    {
      name: 'System',
      url: 'http://localhost:3001/d/system-resources/system-resources',
      icon: <FaTachometerAlt />,
      color: '#5C9CCC'
    },
    {
      name: 'RabbitMQ',
      url: 'http://localhost:15672',
      icon: <FaBug />,
      color: '#FF6600'
    }
  ];

  const openMonitoringTool = (tool) => {
    let url = tool.url;
    
    // Add time range if execution is running (for Grafana and System dashboards)
    if (executionStartTime && (tool.name === 'Grafana' || tool.name === 'System')) {
      const from = executionStartTime.getTime();
      const to = new Date().getTime();
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}from=${from}&to=${to}&refresh=5s`;
    }
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (compact) {
    // Compact layout - no background, just buttons
    return (
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '8px 0',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <span style={{ 
          fontSize: '13px', 
          fontWeight: '600', 
          color: 'var(--text-secondary)',
          marginRight: '8px'
        }}>
          Monitor:
        </span>
        {monitoringTools.map((tool) => (
          <button
            key={tool.name}
            className="btn btn-secondary"
            onClick={() => openMonitoringTool(tool)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              padding: '6px 12px',
              borderLeft: `3px solid ${tool.color}`
            }}
            title={`Open ${tool.name}`}
          >
            <span style={{ color: tool.color, fontSize: '14px' }}>
              {tool.icon}
            </span>
            {tool.name}
          </button>
        ))}
      </div>
    );
  }

  // Full layout - no background, clean grid
  return (
    <div style={{ padding: '0' }}>
      <h3 style={{ 
        fontSize: '14px', 
        marginBottom: '12px',
        fontWeight: '600',
        color: 'var(--text-primary)'
      }}>
        Real-time Monitoring
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px'
      }}>
        {monitoringTools.map((tool) => (
          <button
            key={tool.name}
            className="btn"
            onClick={() => openMonitoringTool(tool)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 8px',
              fontSize: '11px',
              fontWeight: '600',
              border: `2px solid ${tool.color}`,
              background: 'var(--card-bg)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              minHeight: '70px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = tool.color + '15';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--card-bg)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            title={`Open ${tool.name}`}
          >
            <span style={{ 
              color: tool.color, 
              fontSize: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {tool.icon}
            </span>
            <span style={{ 
              color: 'var(--text-primary)',
              textAlign: 'center',
              lineHeight: '1.2'
            }}>
              {tool.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MonitoringButtons;
