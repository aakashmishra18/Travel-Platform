import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../services/userApi';
import { Save } from 'lucide-react';

export const ProfileInfoSection = () => {
  const { accessToken } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await userApi.getProfile(accessToken);
        const p = data.profile || {};
        setForm({
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
          gender: p.gender || '',
          phone: p.phone || '',
        });
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accessToken]);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setMessage('');
      setSaving(true);
      // Only send fields that have a value — the backend merges via
      // COALESCE, so omitting empty fields avoids blanking them.
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
      await userApi.updateProfile(accessToken, payload);
      setMessage('Profile updated');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Loading profile...</p>;

  return (
    <div>
      {error && <div className="alert-box alert-error">{error}</div>}
      {message && <div className="alert-box alert-success">{message}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <input
              className="input-field"
              placeholder="FIRST NAME"
              value={form.firstName}
              onChange={handleChange('firstName')}
            />
          </div>
          <div className="form-group">
            <input
              className="input-field"
              placeholder="LAST NAME"
              value={form.lastName}
              onChange={handleChange('lastName')}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <input
              type="date"
              className="input-field"
              value={form.dateOfBirth}
              onChange={handleChange('dateOfBirth')}
            />
          </div>
          <div className="form-group">
            <select className="input-field" value={form.gender} onChange={handleChange('gender')}>
              <option value="">GENDER</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <input
            className="input-field"
            placeholder="PHONE NUMBER"
            value={form.phone}
            onChange={handleChange('phone')}
          />
        </div>

        <button type="submit" className="btn-submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Save size={16} /> {saving ? 'SAVING...' : 'SAVE PROFILE'}
        </button>
      </form>
    </div>
  );
};
