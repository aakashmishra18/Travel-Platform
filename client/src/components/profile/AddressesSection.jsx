import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../services/userApi';
import { Plus, Trash2 } from 'lucide-react';

const emptyForm = { type: 'HOME', line1: '', city: '', state: '', postalCode: '', country: '', isDefault: false };

export const AddressesSection = () => {
  const { accessToken } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      setLoading(true);
      const data = await userApi.listAddresses(accessToken);
      setAddresses(data.addresses || []);
    } catch (err) {
      setError(err.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [accessToken]);

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await userApi.createAddress(accessToken, form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message || 'Failed to add address');
    }
  };

  const handleDelete = async (addressId) => {
    try {
      setError('');
      await userApi.deleteAddress(accessToken, addressId);
      load();
    } catch (err) {
      setError(err.message || 'Failed to remove address');
    }
  };

  if (loading) return <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Loading addresses...</p>;

  return (
    <div>
      {error && <div className="alert-box alert-error">{error}</div>}

      <button
        className="btn-secondary"
        onClick={() => setShowForm((s) => !s)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}
      >
        <Plus size={16} /> Add Address
      </button>

      {showForm && (
        <div style={{ background: '#ffffff', border: '1px solid var(--line)', padding: 16, borderRadius: 12, marginBottom: 20 }}>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <select className="input-field" value={form.type} onChange={handleChange('type')}>
                <option value="HOME">Home</option>
                <option value="BILLING">Billing</option>
                <option value="WORK">Work</option>
                <option value="GST">GST / Company</option>
              </select>
            </div>
            <div className="form-group">
              <input className="input-field" placeholder="ADDRESS LINE 1" value={form.line1} onChange={handleChange('line1')} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <input className="input-field" placeholder="CITY" value={form.city} onChange={handleChange('city')} />
              </div>
              <div className="form-group">
                <input className="input-field" placeholder="STATE" value={form.state} onChange={handleChange('state')} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <input className="input-field" placeholder="POSTAL CODE" value={form.postalCode} onChange={handleChange('postalCode')} />
              </div>
              <div className="form-group">
                <input className="input-field" placeholder="COUNTRY (e.g. IN)" maxLength={2} value={form.country} onChange={handleChange('country')} />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', marginBottom: 14, color: 'var(--ink-soft)' }}>
              <input type="checkbox" checked={form.isDefault} onChange={handleChange('isDefault')} />
              Set as default
            </label>
            <button type="submit" className="btn-submit">SAVE ADDRESS</button>
          </form>
        </div>
      )}

      {addresses.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No addresses saved yet.</p>
      ) : (
        addresses.map((a) => (
          <div key={a.id} className="session-item" style={{ marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                {a.type}
                {a.isDefault && <span className="session-current-badge">Default</span>}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
                {[a.line1, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', ')}
              </div>
            </div>
            <button onClick={() => handleDelete(a.id)} className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))
      )}
    </div>
  );
};
