import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from 'lucide-react';

export const LoginPage = ({ onSwitchToSignup, onOpenForgotPassword }) => {
  const { loginUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both Email and Password');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await loginUser(email, password, rememberMe);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      {/* Top Floating White Avatar Circle */}
      <div className="avatar-badge">
        <User />
      </div>

      {/* Tabs */}
      <div className="auth-tabs">
        <button className="tab-btn active" type="button">
          LOG IN
        </button>
        <button className="tab-btn" type="button" onClick={onSwitchToSignup}>
          SIGN UP
        </button>
      </div>

      <h2 className="auth-title">Welcome back!</h2>

      {error && <div className="alert-box alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="email"
            className="input-field"
            placeholder="EMAIL ADDRESS"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            className="input-field"
            placeholder="PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'LOGGING IN...' : 'LOG IN'}
        </button>

        <div className="auth-options">
          <label className="remember-label">
            <input
              type="checkbox"
              className="remember-checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Remember Me</span>
          </label>

          <span
            className="forgot-link"
            onClick={onOpenForgotPassword}
            role="button"
            tabIndex={0}
          >
            I forgot my password
          </span>
        </div>
      </form>
    </div>
  );
};
