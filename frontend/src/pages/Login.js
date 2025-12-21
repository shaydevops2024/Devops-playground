import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Captcha from '../components/Captcha';
import { login } from '../utils/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleCaptchaVerify = (token) => {
    console.log('Captcha verified with token:', token);
    setCaptchaVerified(true);
    setCaptchaToken(token);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Login submit clicked');
    console.log('Captcha verified:', captchaVerified);
    console.log('Username:', username);
    console.log('Password:', password ? '***' : 'empty');

    if (!captchaVerified) {
      setError('Please verify the captcha first');
      return;
    }

    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Sending login request...');
      const response = await login(username, password, captchaToken);
      console.log('Login response:', response);
      
      authLogin(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Login failed';
      setError(errorMessage);
      setCaptchaVerified(false);
      setCaptchaToken('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={styles.container}>
        <div className="card" style={styles.card}>
          <h1 style={styles.title}>Login</h1>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {error && <div className="error" style={{ marginBottom: '16px' }}>{error}</div>}

            {!captchaVerified ? (
              <Captcha onVerify={handleCaptchaVerify} />
            ) : (
              <>
                <div className="success" style={{ marginBottom: '16px' }}>
                  ✓ Captcha verified
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </>
            )}
          </form>

          <p style={styles.link}>
            Don't have an account? <Link to="/register">Register here</Link>
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
};

export default Login;