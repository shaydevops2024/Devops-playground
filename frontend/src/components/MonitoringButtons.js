import React from 'react';
import './MonitoringButtons.css';

const MonitoringButtons = () => {
  // Dynamically get hostname (works for localhost, IP addresses, domains)
  const hostname = window.location.hostname;

  // ONLY 4 buttons: Grafana, Prometheus, Loki, RabbitMQ
  const buttons = [
    {
      name: 'Grafana',
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
      name: 'Loki',
      url: `http://${hostname}:3001/explore?orgId=1&left=%7B%22datasource%22:%22loki%22,%22queries%22:%5B%7B%22refId%22:%22A%22,%22expr%22:%22%7Bjob%3D%5C%22backend%5C%22%7D%22%7D%5D,%22range%22:%7B%22from%22:%22now-1h%22,%22to%22:%22now%22%7D%7D`,
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
    }
  ];

  return (
    <div className="monitoring-tools-sidebar">
      <div className="monitoring-sidebar-header">
        <span className="monitoring-sidebar-icon">🎛️</span>
        <h3>Monitoring Tools</h3>
      </div>
      <div className="monitoring-tools-list">
        {buttons.map((button, index) => (
          <a
            key={index}
            href={button.url}
            target="_blank"
            rel="noopener noreferrer"
            className="monitoring-tool-btn"
            style={{ borderLeftColor: button.color }}
          >
            <span className="tool-btn-icon">{button.icon}</span>
            <div className="tool-btn-content">
              <h4>{button.name}</h4>
              <p>{button.description}</p>
            </div>
          </a>
        ))}
      </div>
      <div className="monitoring-sidebar-footer">
        <p>Server: <code>{hostname}</code></p>
      </div>
    </div>
  );
};

export default MonitoringButtons;
