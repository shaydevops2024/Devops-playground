import React from 'react';
import './MonitoringButtons.css';

const MonitoringButtons = () => {
  // Dynamically get hostname (works for localhost, IP addresses, domains)
  const hostname = window.location.hostname;

  // Build URLs based on current hostname
  const buttons = [
    {
      name: 'Grafana Dashboard',
      url: `http://${hostname}:3001/d/devops-playground-overview/devops-playground-overview`,
      description: 'View metrics dashboards',
      icon: '📊',
      color: '#F46800'
    },
    {
      name: 'Prometheus',
      url: `http://${hostname}:9091/graph`,
      description: 'Query metrics directly',
      icon: '🔥',
      color: '#E6522C'
    },
    {
      name: 'Loki Logs',
      url: `http://${hostname}:3001/explore`,
      description: 'Search and analyze logs',
      icon: '📝',
      color: '#F46800'
    },
    {
      name: 'RabbitMQ',
      url: `http://${hostname}:15672`,
      description: 'Message queue management',
      icon: '🐰',
      color: '#FF6600'
    },
    {
      name: 'Postgres Metrics',
      url: `http://${hostname}:9187/metrics`,
      description: 'Database metrics',
      icon: '🐘',
      color: '#336791'
    }
  ];

  return (
    <div className="monitoring-tools-container">
      <div className="monitoring-tools-header">
        <span className="monitoring-tools-icon">🎛️</span>
        <h3>Monitoring Tools</h3>
        <p className="monitoring-tools-subtitle">
          Server: <code>{hostname}</code>
        </p>
      </div>
      <div className="monitoring-tools-list">
        {buttons.map((button, index) => (
          <a
            key={index}
            href={button.url}
            target="_blank"
            rel="noopener noreferrer"
            className="monitoring-tool-button"
            style={{ borderLeftColor: button.color }}
          >
            <span className="tool-icon">{button.icon}</span>
            <div className="tool-info">
              <h4>{button.name}</h4>
              <p>{button.description}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default MonitoringButtons;
