import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getUserStatistics } from '../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const data = await getUserStatistics();
      setStats(data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const playgrounds = [
    { id: 'terraform', name: 'Terraform', icon: '🏗️', path: '/playground/terraform' },
    { id: 'docker', name: 'Docker / Docker Compose', icon: '🐳', path: '/playground/docker' },
    { id: 'kubernetes', name: 'Kubernetes', icon: '☸️', path: '/playground/kubernetes' },
    { id: 'scripting', name: 'Scripting', icon: '📜', path: '/playground/scripting' },
    { id: 'monitoring', name: 'Monitoring', icon: '📊', path: '/playground/monitoring' },
  ];

  return (
    <div>
      <Navbar />
      <div className="container">
        <h1 style={styles.title}>Dashboard</h1>

        {/* Statistics */}
        {!loading && stats && (
          <div style={styles.statsGrid}>
            <div className="card" style={styles.statCard}>
              <span style={{ fontSize: '32px' }}>📊</span>
              <div>
                <h3 style={styles.statNumber}>{stats.total_executions || 0}</h3>
                <p style={styles.statLabel}>Total Executions</p>
              </div>
            </div>
            <div className="card" style={styles.statCard}>
              <span style={{ fontSize: '32px' }}>✅</span>
              <div>
                <h3 style={styles.statNumber}>{stats.successful_executions || 0}</h3>
                <p style={styles.statLabel}>Successful</p>
              </div>
            </div>
            <div className="card" style={styles.statCard}>
              <span style={{ fontSize: '32px' }}>❌</span>
              <div>
                <h3 style={styles.statNumber}>{stats.failed_executions || 0}</h3>
                <p style={styles.statLabel}>Failed</p>
              </div>
            </div>
            <div className="card" style={styles.statCard}>
              <span style={{ fontSize: '32px' }}>🕐</span>
              <div>
                <h3 style={styles.statNumber}>
                  {stats.last_execution
                    ? new Date(stats.last_execution).toLocaleDateString()
                    : 'Never'}
                </h3>
                <p style={styles.statLabel}>Last Execution</p>
              </div>
            </div>
          </div>
        )}

        {/* Playgrounds */}
        <h2 style={styles.sectionTitle}>Choose a Playground</h2>
        <div style={styles.grid}>
          {playgrounds.map((playground) => (
            <Link
              key={playground.id}
              to={playground.path}
              className="card"
              style={styles.playgroundCard}
            >
              <div style={styles.icon}>{playground.icon}</div>
              <h3 style={styles.cardTitle}>{playground.name}</h3>
              <button className="btn btn-primary" style={{ marginTop: 'auto' }}>
                Launch
              </button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: 'var(--text-primary)',
    marginBottom: '30px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: 'var(--text-primary)',
    margin: 0,
  },
  statLabel: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    margin: 0,
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'var(--text-primary)',
    marginBottom: '24px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginBottom: '60px',
  },
  playgroundCard: {
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    minHeight: '200px',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: 'var(--text-primary)',
    marginBottom: '16px',
  },
};

export default Dashboard;
