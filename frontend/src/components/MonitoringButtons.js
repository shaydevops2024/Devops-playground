import React from 'react';
import './MonitoringButtons.css';

const MonitoringButtons = () => {
  // Dynamically get hostname (works for localhost, IP addresses, domains)
  const hostname = window.location.hostname;

  // Build URLs based on current hostname
  const grafanaUrl = `http://${hostname}:3001/d/devops-playground-overview/devops-playground-overview`;
  const prometheusUrl = `http://${hostname}:9091/graph`;
  const lokiUrl = `http://${hostname}:3001/explore`;
  const rabbitmqUrl = `http://${hostname}:15672`;
  const postgresUrl = `http://${hostname}:9187/metrics`;

  const buttons = [
    {
      name: 'Grafana Dashboard',
      url: grafanaUrl,
      description: 'View metrics dashboards',
      icon: '📊',
      color: '#F46800',
      port: '3001'
    },
    {
      name: 'Prometheus',
      url: prometheusUrl,
      description: 'Query metrics directly',
      icon: '🔥',
      color: '#E6522C',
      port: '9091'
    },
    {
      name: 'Loki Logs',
      url: lokiUrl,
      description: 'Search and analyze logs',
      icon: '📝',
      color: '#F46800',
      port: '3001'
    },
    {
      name: 'RabbitMQ',
      url: rabbitmqUrl,
      description: 'Message queue management',
      icon: '🐰',
      color: '#FF6600',
      port: '15672'
    },
    {
      name: 'Postgres Metrics',
      url: postgresUrl,
      description: 'Database metrics',
      icon: '🐘',
      color: '#336791',
      port: '9187'
    }
  ];

  return (
    <div className="monitoring-buttons-container">
      <div className="monitoring-header">
        <h2>🎛️ Monitoring Tools</h2>
        <p className="monitoring-subtitle">
          Server: <code>{hostname}</code>
        </p>
      </div>
      <div className="monitoring-buttons-grid">
        {buttons.map((button, index) => (
          <a
            key={index}
            href={button.url}
            target="_blank"
            rel="noopener noreferrer"
            className="monitoring-button"
            style={{ borderLeftColor: button.color }}
          >
            <div className="monitoring-button-icon">{button.icon}</div>
            <div className="monitoring-button-content">
              <h3>{button.name}</h3>
              <p>{button.description}</p>
              <span className="monitoring-button-url">
                {hostname}:{button.port}
              </span>
            </div>
          </a>
        ))}
      </div>
      <div className="monitoring-footer">
        <p>
          💡 <strong>Auto-configured:</strong> All URLs automatically use your current server address
        </p>
      </div>
    </div>
  );
};

export default MonitoringButtons;
