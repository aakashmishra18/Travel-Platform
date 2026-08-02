import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { OtpVerifyForm } from './OtpVerifyForm';
import { ProfileHub } from './profile/ProfileHub';
import { LogOut, ShieldAlert, ShieldCheck, Monitor, Key, RefreshCw, Trash2, UserCircle, Plane } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'security', label: 'Security', icon: Monitor },
  { key: 'profile', label: 'Profile & Travel', icon: UserCircle },
];

export const Dashboard = () => {
  const { user, accessToken, logoutUser, logoutAllSessions, setUser } = useAuth();
  const [activeSection, setActiveSection] = useState('security'); // 'security' | 'profile'
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOtpBanner, setShowOtpBanner] = useState(false);

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

  const handleVerifiedInline = async () => {
    setShowOtpBanner(false);
    // Refresh the user object so the "Unverified" banner disappears
    // without requiring a full page reload.
    try {
      const data = await api.me(accessToken);
      setUser(data.user);
    } catch (err) {
      // Non-fatal — banner will correct itself next natural refresh.
    }
  };

  // NOTE: the backend returns `emailVerified`, not `isVerified` — using
  // the wrong field name here would make every account show as
  // permanently unverified regardless of actual status.
  const isVerified = user?.emailVerified;
  const initial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-top">
          <div className="dash-brand">
            <span className="dash-brand-badge">
              <Plane size={16} strokeWidth={2.25} />
            </span>
            Travel OS
          </div>

          <div className="dash-identity">
            <div className="dash-avatar">{initial}</div>
            <div className="dash-identity-text">
              <span className="dash-identity-email">{user?.email}</span>
              {isVerified ? (
                <span className="dash-verified-pill dash-verified-pill--ok">
                  <ShieldCheck size={13} /> Verified
                </span>
              ) : (
                <button className="dash-verified-pill dash-verified-pill--warn" onClick={() => setShowOtpBanner((s) => !s)}>
                  <ShieldAlert size={13} /> Verify email
                </button>
              )}
            </div>
          </div>

          <nav className="dash-nav">
            {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                className={`dash-nav-item${activeSection === key ? ' active' : ''}`}
                onClick={() => setActiveSection(key)}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </nav>
        </div>

        <button className="dash-nav-item dash-logout" onClick={logoutUser}>
          <LogOut size={16} /> Log out
        </button>
      </aside>

      <main className="dash-main">
        <div className="dash-content">
          {error && <div className="alert-box alert-error">{error}</div>}
          {message && <div className="alert-box alert-success">{message}</div>}

          {!isVerified && showOtpBanner && (
            <div className="dash-inline-panel">
              <OtpVerifyForm email={user?.email} onVerified={handleVerifiedInline} compact />
            </div>
          )}

          {activeSection === 'profile' ? (
            <ProfileHub />
          ) : (
            <>
              <div className="dash-section-header">
                <h2 className="dash-section-title">Security</h2>
                <p className="dash-section-subtitle">Manage your password and where you're signed in.</p>
              </div>

              <div className="dash-toolbar">
                <button
                  className="btn-secondary"
                  onClick={() => setShowChangePassword(!showChangePassword)}
                >
                  <Key size={16} /> Change Password
                </button>
                <button className="btn-secondary" onClick={logoutAllSessions}>
                  <LogOut size={16} /> Logout All Devices
                </button>
              </div>

              {showChangePassword && (
                <div className="dash-inline-panel">
                  <h4 className="dash-inline-panel-title">Change Password</h4>
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

              <div>
                <div className="dash-list-header">
                  <h4 className="dash-list-title">
                    <Monitor size={18} /> Active Sessions
                  </h4>
                  <button onClick={fetchSessions} className="dash-icon-btn" title="Refresh Sessions">
                    <RefreshCw size={16} />
                  </button>
                </div>

                {loadingSessions ? (
                  <p className="dash-muted-text">Loading active sessions...</p>
                ) : sessions.length === 0 ? (
                  <p className="dash-muted-text">No active sessions found.</p>
                ) : (
                  sessions.map((s) => (
                    <div key={s.id} className="session-item">
                      <div>
                        <div className="session-item-name">{s.deviceName || 'Unknown Device'}</div>
                        <div className="session-item-meta">
                          IP: {s.ipAddress} • Last Active: {s.lastActiveAt ? new Date(s.lastActiveAt).toLocaleString() : '—'}
                        </div>
                      </div>
                      <button onClick={() => handleRevokeSession(s.id)} className="btn-danger">
                        <Trash2 size={14} /> Revoke
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
