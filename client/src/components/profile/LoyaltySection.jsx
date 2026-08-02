import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../services/userApi';
import { Plus, Trash2 } from 'lucide-react';

const emptyForm = { programType: 'AIRLINE', providerName: '', membershipNumber: '' };

export const LoyaltySection = () => {
  const { accessToken } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      setLoading(true);
      const data = await userApi.listLoyaltyPrograms(accessToken);
      setPrograms(data.programs || []);
    } catch (err) {
      setError(err.message || 'Failed to load loyalty programs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [accessToken]);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await userApi.createLoyaltyProgram(accessToken, form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message || 'Failed to add loyalty program');
    }
  };

  const handleDelete = async (loyaltyId) => {
    try {
      setError('');
      await userApi.deleteLoyaltyProgram(accessToken, loyaltyId);
      load();
    } catch (err) {
      setError(err.message || 'Failed to remove loyalty program');
    }
  };

  if (loading) return <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Loading loyalty programs...</p>;

  return (
    <div>
      {error && <div className="alert-box alert-error">{error}</div>}

      <button
        className="btn-secondary"
        onClick={() => setShowForm((s) => !s)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}
      >
        <Plus size={16} /> Add Loyalty Program
      </button>

      {showForm && (
        <div style={{ background: '#ffffff', border: '1px solid var(--line)', padding: 16, borderRadius: 12, marginBottom: 20 }}>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <select className="input-field" value={form.programType} onChange={handleChange('programType')}>
                <option value="AIRLINE">Airline</option>
                <option value="HOTEL">Hotel</option>
                <option value="RAIL">Rail</option>
              </select>
            </div>
            <div className="form-group">
              <input className="input-field" placeholder="PROVIDER (e.g. IndiGo)" value={form.providerName} onChange={handleChange('providerName')} required />
            </div>
            <div className="form-group">
              <input className="input-field" placeholder="MEMBERSHIP NUMBER" value={form.membershipNumber} onChange={handleChange('membershipNumber')} required />
            </div>
            <button type="submit" className="btn-submit">SAVE PROGRAM</button>
          </form>
        </div>
      )}

      {programs.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No loyalty programs added yet.</p>
      ) : (
        programs.map((p) => (
          <div key={p.id} className="session-item" style={{ marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.providerName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
                {p.programType} • {p.membershipNumber}
              </div>
            </div>
            <button onClick={() => handleDelete(p.id)} className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))
      )}
    </div>
  );
};
