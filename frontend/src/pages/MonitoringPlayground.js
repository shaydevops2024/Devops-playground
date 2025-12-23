import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { checkPrerequisites } from '../utils/api';
import { 
  FaChartLine, 
  FaServer, 
  FaDatabase, 
  FaFileAlt, 
  FaExternalLinkAlt,
  FaChartBar,
  FaBug,
  FaHome
} from 'react-icons/fa';

const MonitoringPlayground = () => {
  const navigate = useNavigate();
  const [prerequisites, setPrerequisites] = useState(null);
  const [checkingPrereqs, setCheckingPrereqs] = useState(true);

  const monitoringTools = [
    {
      name: 'Grafana',
      description: 'Metrics Visualization & Dashboards',
      url: 'http://localhost:3001',
      icon: <FaChartLine />,
      color: '#F46800',
      dashboards: [
        { name: 'Overview', path: '/d/devops-playground-overview/devops-playground-overview' },
        { name: 'User Stats', path: '/d/user-statistics/user-statistics' },
        { name: 'Execution Stats', path: '/d/execution-statistics/execution-statistics' },
        { name: 'System Resources', path: '/d/system-resources/system-resources' }
      ]
    },
    {
      name: 'Prometheus',
      description: 'Metrics Collection & Queries',
      url: 'http://localhost:9091',
      icon: <FaChartBar />,
      color: '#E6522C',
      dashboards: [
        { name: 'Targets', path: '/targets' },
        { name: 'Alerts', path: '/alerts' },
        { name: 'Graph', path: '/graph' }
      ]
    },
    {
      name: 'Loki (via Grafana)',
      description: 'Log Aggregation & Search',
      url: 'http://localhost:3001/explore',
      icon: <FaFileAlt />,
      color: '#F5B800',
      dashboards: [
        { name: 'Explore Logs', path: '?orgId=1&left={"datasource":"Loki","queries":[{"expr":"{job=\\"varlogs\\"}","refId":"A"}],"range":{"from":"now-1h","to":"now"}}' }
      ]
    },
    {
      name: 'cAdvisor',
      description: 'Container Resource Metrics',
      url: 'http://localhost:8080',
      icon: <FaServer />,
      color: '#326CE5',
      dashboards: []
    },
    {
      name: 'Node Exporter',
      description: 'System Hardware Metrics',
      url: 'http://localhost:9100/metrics',
      icon: <FaDatabase />,
      color: '#5C9CCC',
      dashboards: []
    },
    {
      name: 'RabbitMQ',
      description: 'Message Queue Management',
      url: 'http://localhost:15672',
      icon: <FaBug />,
      color: '#FF6600',
      dashboards: []
    }
  ];

  useEffect(() => {
    checkMonitoringPrerequisites();
  }, []);

  const checkMonitoringPrerequisites = async () => {
    try {
      const result = await checkPrerequisites('monitoring');
      setPrerequisites(result);
    } catch (error) {
      console.error('Failed to check prerequisites:', error);
    } finally {
      setCheckingPrereqs(false);
    }
  };

  const openMonitoringTool = (tool, dashboard = null) => {
    let url = tool.url;
    
    if (dashboard) {
      url += dashboard.path;
    }
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleGoHome = () => {
    navigate('/dashboard');
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
        {/* Home button */}
        <div style={{ marginBottom: '20px' }}>
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
        </div>

        {/* Header */}
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
            <FaChartLine size={36} /> Monitoring Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            Access all your monitoring tools in one place
          </p>
        </div>

        {/* Monitoring Tools Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          {monitoringTools.map((tool) => (
            <div
              key={tool.name}
              className="card"
              style={{
                padding: '24px',
                transition: 'all 0.3s ease',
                borderLeft: `4px solid ${tool.color}`,
                position: 'relative',
                cursor: tool.dashboards.length === 0 ? 'pointer' : 'default'
              }}
              onClick={tool.dashboards.length === 0 ? () => openMonitoringTool(tool) : undefined}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '16px' }}>
                <div style={{ fontSize: '32px', color: tool.color }}>
                  {tool.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '20px', marginBottom: '4px' }}>{tool.name}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {tool.description}
                  </p>
                </div>
              </div>
              
              {tool.dashboards.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tool.dashboards.map((dashboard) => (
                    <button
                      key={dashboard.name}
                      className="btn btn-secondary"
                      onClick={() => openMonitoringTool(tool, dashboard)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      <span>{dashboard.name}</span>
                      <FaExternalLinkAlt size={12} />
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    openMonitoringTool(tool);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    fontSize: '15px',
                    fontWeight: '600'
                  }}
                >
                  Open {tool.name}
                  <FaExternalLinkAlt size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="card" style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)' }}>
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaChartLine /> Quick Tips
          </h3>
          <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>
              <strong>Grafana:</strong> Pre-configured dashboards showing user activity, execution statistics, and system resources
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Prometheus:</strong> Raw metrics and custom queries (PromQL)
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Loki:</strong> Searchable logs from all containers and applications
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>cAdvisor:</strong> Real-time container resource usage
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Node Exporter:</strong> Host system metrics (CPU, RAM, Disk, Network)
            </li>
            <li>
              <strong>RabbitMQ:</strong> Message queue monitoring and management
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MonitoringPlayground;