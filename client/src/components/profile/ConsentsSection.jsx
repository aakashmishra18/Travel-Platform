import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../services/userApi';
import { CheckCircle, XCircle } from 'lucide-react';

const CONSENT_TYPES = [
  { key: 'TERMS_OF_SERVICE', label: 'Terms of Service' },
  { key: 'PRIVACY_POLICY', label: 'Privacy Policy' },
  { key: 'MARKETING_EMAIL', label: 'Marketing Emails' },
  { key: 'MARKETING_SMS', label: 'Marketing SMS' },
];
const CURRENT_VERSION = 'v1';

export const ConsentsSection = () => {
  const { accessToken } = useAuth();
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await userApi.listConsents(accessToken);
      setConsents(data.consents || []);
    } catch (err) {
      setError(err.message || 'Failed to load consents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [accessToken]);

  const currentStatus = (type) => {
    // Most recent record for this type + version, if any.
    const match = consents.find((c) => c.consentType === type && c.version === CURRENT_VERSION);
    return match?.status || null;
  };

  const handleToggle = async (type, nextStatus) => {
    try {
      setError('');
      setUpdating(type);
      await userApi.recordConsent(accessToken, { consentType: type, status: nextStatus, version: CURRENT_VERSION });
      load();
    } catch (err) {
      setError(err.message || 'Failed to update consent');
    } finally {
      setUpdating('');
    }
  };

  if (loading) return <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Loading consents...</p>;

  return (
    <div>
      {error && <div className="alert-box alert-error">{error}</div>}

      {CONSENT_TYPES.map(({ key, label }) => {
        const status = currentStatus(key);
        const granted = status === 'GRANTED';
        return (
          <div key={key} className="session-item" style={{ marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                {label}
                {granted ? (
                  <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
                    <CheckCircle size={13} /> Granted
                  </span>
                ) : status === 'REVOKED' ? (
                  <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
                    <XCircle size={13} /> Revoked
                  </span>
                ) : (
                  <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Not set</span>
                )}
              </div>
            </div>
            <button
              className={granted ? 'btn-danger' : 'btn-secondary'}
              disabled={updating === key}
              onClick={() => handleToggle(key, granted ? 'REVOKED' : 'GRANTED')}
            >
              {updating === key ? '...' : granted ? 'Revoke' : 'Grant'}
            </button>
          </div>
        );
      })}
    </div>
  );
};
