import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Welcome = () => {
  return (
    <div>
      <Navbar />
      <div style={styles.hero}>
        <h1 style={styles.title}>Welcome to DevOps Playground</h1>
        <p style={styles.subtitle}>
          Master DevOps tools through hands-on practice with real scenarios
        </p>
        <div style={styles.actions}>
          <Link to="/login" className="btn btn-primary btn-large">
            Get Started
          </Link>
          <Link to="/register" className="btn btn-secondary btn-large">
            Create Account
          </Link>
        </div>
      </div>

      <div className="container" style={{ marginTop: '60px' }}>
        <h2 style={styles.sectionTitle}>Available Playgrounds</h2>
        <div style={styles.grid}>
          {playgrounds.map((playground) => (
            <div key={playground.id} className="card" style={styles.playgroundCard}>
              <div style={styles.icon}>{playground.icon}</div>
              <h3 style={styles.cardTitle}>{playground.name}</h3>
              <p style={styles.cardDescription}>{playground.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const playgrounds = [
  {
    id: 'terraform',
    name: 'Terraform',
    icon: '🏗️',
    description: 'Practice infrastructure as code with Terraform scenarios',
  },
  {
    id: 'docker',
    name: 'Docker / Docker Compose',
    icon: '🐳',
    description: 'Build and manage containerized applications',
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    icon: '☸️',
    description: 'Orchestrate containers at scale with Kubernetes',
  },
  {
    id: 'scripting',
    name: 'Scripting',
    icon: '📜',
    description: 'Automate tasks with shell scripts',
  },
  {
    id: 'monitoring',
    name: 'Monitoring',
    icon: '📊',
    description: 'Set up monitoring with Grafana, Loki, and Prometheus',
  },
];

const styles = {
  hero: {
    textAlign: 'center',
    padding: '80px 20px',
    background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(247, 147, 30, 0.1))',
  },
  title: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: 'var(--accent-primary)',
    marginBottom: '20px',
  },
  subtitle: {
    fontSize: '20px',
    color: 'var(--text-secondary)',
    marginBottom: '40px',
    maxWidth: '600px',
    margin: '0 auto 40px',
  },
  actions: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: '36px',
    fontWeight: 'bold',
    color: 'var(--text-primary)',
    marginBottom: '40px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '60px',
  },
  playgroundCard: {
    textAlign: 'center',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'var(--text-primary)',
    marginBottom: '12px',
  },
  cardDescription: {
    fontSize: '16px',
    color: 'var(--text-secondary)',
  },
};

export default Welcome;
