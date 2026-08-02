import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

export const SignupPage = ({ onSwitchToLogin, onRegistered }) => {
  const { registerUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await registerUser(email, password);
      // Registration succeeded — auth-service has sent a 6-digit OTP to
      // this email. Hand off to the verification screen rather than
      // auto-logging in, so the account gets verified right away.
      onRegistered(email);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="avatar-badge">
        <UserPlus />
      </div>

      <div className="auth-tabs">
        <button className="tab-btn" type="button" onClick={onSwitchToLogin}>
          LOG IN
        </button>
        <button className="tab-btn active" type="button">
          SIGN UP
        </button>
      </div>

      <h2 className="auth-title">Create your account</h2>

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

        <div className="form-group">
          <input
            type="password"
            className="input-field"
            placeholder="CONFIRM PASSWORD"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
        </button>
      </form>
    </div>
  );
};
