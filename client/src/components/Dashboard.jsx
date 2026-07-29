import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LogOut, ShieldAlert, ShieldCheck, Monitor, Key, RefreshCw, Trash2 } from 'lucide-react';

export const Dashboard = () => {
  const { user, accessToken, logoutUser, logoutAllSessions, setUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const data = await api.listSessions(accessToken);
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchSessions();
    }
  }, [accessToken]);

  const handleRevokeSession = async (sessionId) => {
    try {
      await api.revokeSession(accessToken, sessionId);
      setMessage('Session revoked successfully');
      fetchSessions();
    } catch (err) {
      setError(err.message || 'Failed to revoke session');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const res = await api.changePassword(accessToken, currentPassword, newPassword);
      setMessage(res.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setShowChangePassword(false);
      fetchSessions();
    } catch (err) {
      setError(err.message || 'Failed to change password');
    }
  };

  const handleResendVerification = async () => {
    try {
      setError('');
      const res = await api.resendVerification(user.email);
      setMessage(res.message || 'Verification token sent!');
      if (res.debugVerificationToken) {
        console.log('[CLIENT DEBUG] Resent verification token:', res.debugVerificationToken);
      }
    } catch (err) {
      setError(err.message || 'Failed to resend verification');
    }
  };

  return (
    <div className="dashboard-card">
      <div className="dashboard-header">
        <div className="dashboard-user-info">
          <div className="dashboard-avatar">
            {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user?.email}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', marginTop: 4 }}>
              {user?.isVerified ? (
                <span style={{ color: '#68d391', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={14} /> Verified Account
                </span>
              ) : (
                <span style={{ color: '#f6ad55', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShieldAlert size={14} /> Unverified Account
                  <button
                    onClick={handleResendVerification}
                    style={{ background: 'none', border: 'none', color: '#00f0ff', textDecoration: 'underline', cursor: 'pointer', marginLeft: 6 }}
                  >
                    Resend
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={logoutUser} title="Log Out">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {error && <div className="alert-box alert-error">{error}</div>}
      {message && <div className="alert-box alert-success">{message}</div>}

      {/* Action Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          className="btn-secondary"
          onClick={() => setShowChangePassword(!showChangePassword)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Key size={16} /> Change Password
        </button>
        <button
          className="btn-secondary"
          onClick={logoutAllSessions}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <LogOut size={16} /> Logout All Devices
        </button>
      </div>

      {/* Change Password Collapsible Section */}
      {showChangePassword && (
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: 16, borderRadius: 8, marginBottom: 20 }}>
          <h4 style={{ marginBottom: 12, fontSize: '0.95rem' }}>Change Password</h4>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <input
                type="password"
                className="input-field"
                placeholder="CURRENT PASSWORD"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                className="input-field"
                placeholder="NEW PASSWORD"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-submit">
              UPDATE PASSWORD
            </button>
          </form>
        </div>
      )}

      {/* Active Sessions List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Monitor size={18} color="#00f0ff" /> Active Sessions
          </h4>
          <button
            onClick={fetchSessions}
            style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer' }}
            title="Refresh Sessions"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {loadingSessions ? (
          <p style={{ color: '#a0aec0', fontSize: '0.85rem' }}>Loading active sessions...</p>
        ) : sessions.length === 0 ? (
          <p style={{ color: '#a0aec0', fontSize: '0.85rem' }}>No active sessions found.</p>
        ) : (
          sessions.map((s) => (
            <div key={s.sessionId} className="session-item">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {s.deviceName}
                  {s.isCurrent && <span className="session-current-badge">This Device</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: 2 }}>
                  IP: {s.ipAddress} • Last Active: {new Date(s.lastActive).toLocaleString()}
                </div>
              </div>

              {!s.isCurrent && (
                <button
                  onClick={() => handleRevokeSession(s.sessionId)}
                  className="btn-danger"
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  title="Revoke Session"
                >
                  <Trash2 size={14} /> Revoke
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
