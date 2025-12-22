import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { register } from '../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    console.log('Register form submitted');
    console.log('Form data:', { ...formData, password: '***', confirmPassword: '***' });

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    // Check password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must contain at least: 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&#)');
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);

    try {
      console.log('Sending registration request...');
      const response = await register(formData.username, formData.email, formData.password);
      console.log('Registration response:', response);
      
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response);
      
      let errorMessage = 'Registration failed';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.errors) {
        // Handle validation errors array
        const errors = err.response.data.errors;
        errorMessage = errors.map(e => e.msg).join(', ');
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={styles.container}>
        <div className="card" style={styles.card}>
          <h1 style={styles.title}>Create Account</h1>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
                minLength="3"
                autoComplete="username"
              />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                minLength="8"
                autoComplete="new-password"
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                Min 8 characters with uppercase, lowercase, number, and special character (@$!%*?&#)
              </small>
            </div>

            <div className="input-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            {error && <div className="error" style={{ marginBottom: '16px' }}>{error}</div>}
            {success && <div className="success" style={{ marginBottom: '16px' }}>{success}</div>}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <p style={styles.link}>
            Already have an account? <Link to="/login" style={styles.linkText}>Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 120px)',
  },
  card: {
    maxWidth: '450px',
    width: '100%',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: 'var(--accent-primary)',
    marginBottom: '24px',
    textAlign: 'center',
  },
  link: {
    marginTop: '20px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
  },
  linkText: {
    color: 'var(--accent-primary)',
    textDecoration: 'none',
    fontWeight: '600',
  },
};

export default Register;