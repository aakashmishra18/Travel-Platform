import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

export const SignupPage = ({ onSwitchToLogin }) => {
  const { registerUser, loginUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [debugToken, setDebugToken] = useState('');

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

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setError('');
      setSuccessMsg('');
      setLoading(true);
      const res = await registerUser(email, password);
      
      setSuccessMsg('Account created successfully!');
      if (res.debugVerificationToken) {
        setDebugToken(res.debugVerificationToken);
      }

      // Auto login after registration
      setTimeout(async () => {
        try {
          await loginUser(email, password, false);
        } catch (loginErr) {
          onSwitchToLogin();
        }
      }, 1500);

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
      {successMsg && <div className="alert-box alert-success">{successMsg}</div>}
      
      {debugToken && (
        <div className="alert-box alert-success" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
          Verification Token (Console Debug):<br />
          <code>{debugToken}</code>
        </div>
      )}

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
