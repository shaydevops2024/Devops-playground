import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { logout } from '../utils/api';

const Navbar = () => {
  const { user, logout: authLogout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      authLogout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to={user ? '/dashboard' : '/'} style={styles.logo}>
          DevOps Playground
        </Link>
        
        <div style={styles.actions}>
          <button onClick={toggleTheme} style={styles.iconButton} title="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          
          {user && (
            <>
              <div style={styles.userInfo}>
                <span>👤 {user.username}</span>
              </div>
              <button onClick={handleLogout} style={styles.iconButton} title="Logout">
                🚪
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    background: 'var(--card-bg)',
    borderBottom: '2px solid var(--border-color)',
    padding: '16px 0',
    boxShadow: '0 2px 4px var(--shadow-color)',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'var(--accent-primary)',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-primary)',
    fontSize: '14px',
  },
  iconButton: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.3s ease',
    fontSize: '20px',
  },
};

export default Navbar;
