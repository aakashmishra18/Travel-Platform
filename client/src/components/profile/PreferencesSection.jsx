import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../services/userApi';
import { Save } from 'lucide-react';

export const PreferencesSection = () => {
  const { accessToken } = useAuth();
  const [form, setForm] = useState({
    language: '', currency: '', timezone: '',
    flightSeat: '', flightMeal: '', flightClass: '',
    hotelRoomPref: '', hotelAccessibility: '',
    railBerth: '', railClass: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await userApi.getPreferences(accessToken);
        const p = data.preferences || {};
        setForm({
          language: p.language || '',
          currency: p.currency || '',
          timezone: p.timezone || '',
          flightSeat: p.flight?.seat || '',
          flightMeal: p.flight?.meal || '',
          flightClass: p.flight?.class || '',
          hotelRoomPref: p.hotel?.roomPreference || '',
          hotelAccessibility: p.hotel?.accessibility || '',
          railBerth: p.rail?.berth || '',
          railClass: p.rail?.class || '',
        });
      } catch (err) {
        setError(err.message || 'Failed to load preferences');
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
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
      await userApi.updatePreferences(accessToken, payload);
      setMessage('Preferences saved');
    } catch (err) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Loading preferences...</p>;

  return (
    <div>
      {error && <div className="alert-box alert-error">{error}</div>}
      {message && <div className="alert-box alert-success">{message}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <input className="input-field" placeholder="LANGUAGE (en)" value={form.language} onChange={handleChange('language')} />
          </div>
          <div className="form-group">
            <input className="input-field" placeholder="CURRENCY (INR)" value={form.currency} onChange={handleChange('currency')} />
          </div>
          <div className="form-group">
            <input className="input-field" placeholder="TIMEZONE" value={form.timezone} onChange={handleChange('timezone')} />
          </div>
        </div>

        <h4 style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '16px 0 10px' }}>FLIGHT</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <select className="input-field" value={form.flightSeat} onChange={handleChange('flightSeat')}>
              <option value="">Seat</option>
              <option value="WINDOW">Window</option>
              <option value="AISLE">Aisle</option>
              <option value="MIDDLE">Middle</option>
            </select>
          </div>
          <div className="form-group">
            <select className="input-field" value={form.flightMeal} onChange={handleChange('flightMeal')}>
              <option value="">Meal</option>
              <option value="VEG">Veg</option>
              <option value="NON_VEG">Non-Veg</option>
              <option value="VEGAN">Vegan</option>
            </select>
          </div>
          <div className="form-group">
            <select className="input-field" value={form.flightClass} onChange={handleChange('flightClass')}>
              <option value="">Class</option>
              <option value="ECONOMY">Economy</option>
              <option value="PREMIUM_ECONOMY">Premium Economy</option>
              <option value="BUSINESS">Business</option>
            </select>
          </div>
        </div>

        <h4 style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '16px 0 10px' }}>HOTEL</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <input className="input-field" placeholder="ROOM PREFERENCE" value={form.hotelRoomPref} onChange={handleChange('hotelRoomPref')} />
          </div>
          <div className="form-group">
            <input className="input-field" placeholder="ACCESSIBILITY NEEDS" value={form.hotelAccessibility} onChange={handleChange('hotelAccessibility')} />
          </div>
        </div>

        <h4 style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '16px 0 10px' }}>RAIL</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <input className="input-field" placeholder="BERTH PREFERENCE" value={form.railBerth} onChange={handleChange('railBerth')} />
          </div>
          <div className="form-group">
            <input className="input-field" placeholder="CLASS PREFERENCE" value={form.railClass} onChange={handleChange('railClass')} />
          </div>
        </div>

        <button type="submit" className="btn-submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Save size={16} /> {saving ? 'SAVING...' : 'SAVE PREFERENCES'}
        </button>
      </form>
    </div>
  );
};
