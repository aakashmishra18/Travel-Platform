import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../services/userApi';
import { Plus, Trash2 } from 'lucide-react';

const emptyForm = { type: 'EMERGENCY', value: '', label: '', isDefault: false };

export const ContactsSection = () => {
  const { accessToken } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      setLoading(true);
      const data = await userApi.listContacts(accessToken);
      setContacts(data.contacts || []);
    } catch (err) {
      setError(err.message || 'Failed to load contacts');
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
      await userApi.createContact(accessToken, form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message || 'Failed to add contact');
    }
  };

  const handleDelete = async (contactId) => {
    try {
      setError('');
      await userApi.deleteContact(accessToken, contactId);
      load();
    } catch (err) {
      setError(err.message || 'Failed to remove contact');
    }
  };

  if (loading) return <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Loading contacts...</p>;

  return (
    <div>
      {error && <div className="alert-box alert-error">{error}</div>}

      <button
        className="btn-secondary"
        onClick={() => setShowForm((s) => !s)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}
      >
        <Plus size={16} /> Add Contact
      </button>

      {showForm && (
        <div style={{ background: '#ffffff', border: '1px solid var(--line)', padding: 16, borderRadius: 12, marginBottom: 20 }}>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <select className="input-field" value={form.type} onChange={handleChange('type')}>
                <option value="EMERGENCY">Emergency</option>
                <option value="EMAIL">Email</option>
                <option value="PHONE">Phone</option>
              </select>
            </div>
            <div className="form-group">
              <input className="input-field" placeholder="VALUE (email or phone)" value={form.value} onChange={handleChange('value')} required />
            </div>
            <div className="form-group">
              <input className="input-field" placeholder="LABEL (e.g. Mom)" value={form.label} onChange={handleChange('label')} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', marginBottom: 14, color: 'var(--ink-soft)' }}>
              <input type="checkbox" checked={form.isDefault} onChange={handleChange('isDefault')} />
              Set as default
            </label>
            <button type="submit" className="btn-submit">SAVE CONTACT</button>
          </form>
        </div>
      )}

      {contacts.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No saved contacts yet.</p>
      ) : (
        contacts.map((c) => (
          <div key={c.id} className="session-item" style={{ marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                {c.label || c.type}
                {c.isDefault && <span className="session-current-badge">Default</span>}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
                {c.type} • {c.value}
              </div>
            </div>
            <button onClick={() => handleDelete(c.id)} className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))
      )}
    </div>
  );
};
