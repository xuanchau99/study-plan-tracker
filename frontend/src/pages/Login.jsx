import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';
import { KeyRound, User, AlertCircle } from 'lucide-react';

/**
 * Authentication interface for the application.
 * Handles both user registration and login flows, redirecting based on role.
 */
export default function Login({ setUser }) {
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Register modes
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  /**
   * Handles the form submission to either the /login or /register endpoint.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const data = await fetchApi(endpoint, {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      // On successful authentication, save the JWT token and user info to LocalStorage
      if (data && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('username', data.username);
        setUser(data); // Update global state
        
        // Redirect to the appropriate dashboard based on Role-Based Access Control (RBAC)
        if (data.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/user');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-card">
        <h1 className="title">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        <p className="subtitle">
          {isLogin ? 'Enter your details to access the platform' : 'Join our high-performance quiz system'}
        </p>

        {error && (
          <div className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', marginBottom: 16, width: '100%', padding: 12 }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: 40 }}
                placeholder="Enter username" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required 
              />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
              <input 
                type="password" 
                className="input-field" 
                style={{ paddingLeft: 40 }}
                placeholder="Enter password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>
          
          <button type="submit" className="btn-primary" style={{ width: '100%', marginBottom: 16 }} disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#94a3b8' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span className="link" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Register here' : 'Login here'}
          </span>
        </p>
      </div>
    </div>
  );
}
