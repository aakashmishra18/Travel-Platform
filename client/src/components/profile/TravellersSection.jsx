import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../services/userApi';
import { Plus, Trash2, ChevronDown, ChevronUp, FileText } from 'lucide-react';

const emptyForm = { type: 'ADULT', relationship: 'FAMILY', firstName: '', lastName: '', dateOfBirth: '', nationality: '' };

export const TravellersSection = () => {
  const { accessToken } = useAuth();
  const [travellers, setTravellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await userApi.listTravellers(accessToken);
      setTravellers(data.travellers || []);
    } catch (err) {
      setError(err.message || 'Failed to load travellers');
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
      await userApi.createTraveller(accessToken, form);
      setMessage('Traveller added');
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message || 'Failed to add traveller');
    }
  };

  const handleDelete = async (travellerId) => {
    try {
      setError('');
      await userApi.deleteTraveller(accessToken, travellerId);
      setMessage('Traveller removed');
      load();
    } catch (err) {
      setError(err.message || 'Failed to remove traveller');
    }
  };

  if (loading) return <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Loading travellers...</p>;

  return (
    <div>
      {error && <div className="alert-box alert-error">{error}</div>}
      {message && <div className="alert-box alert-success">{message}</div>}

      <button
        className="btn-secondary"
        onClick={() => setShowForm((s) => !s)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}
      >
        <Plus size={16} /> Add Traveller
      </button>

      {showForm && (
        <div style={{ background: '#ffffff', border: '1px solid var(--line)', padding: 16, borderRadius: 12, marginBottom: 20 }}>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <input
                  className="input-field"
                  placeholder="FIRST NAME"
                  value={form.firstName}
                  onChange={handleChange('firstName')}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  className="input-field"
                  placeholder="LAST NAME"
                  value={form.lastName}
                  onChange={handleChange('lastName')}
                  required
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <select className="input-field" value={form.type} onChange={handleChange('type')}>
                  <option value="ADULT">Adult</option>
                  <option value="CHILD">Child</option>
                  <option value="INFANT">Infant</option>
                </select>
              </div>
              <div className="form-group">
                <select className="input-field" value={form.relationship} onChange={handleChange('relationship')}>
                  <option value="FAMILY">Family</option>
                  <option value="FRIEND">Friend</option>
                  <option value="OTHER">Other</option>
                </select>
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
                <input
                  className="input-field"
                  placeholder="NATIONALITY (e.g. IN)"
                  maxLength={2}
                  value={form.nationality}
                  onChange={handleChange('nationality')}
                />
              </div>
            </div>
            <button type="submit" className="btn-submit">SAVE TRAVELLER</button>
          </form>
        </div>
      )}

      {travellers.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No travellers added yet.</p>
      ) : (
        travellers.map((t) => (
          <div key={t.id} style={{ marginBottom: 10 }}>
            <div className="session-item">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {t.firstName} {t.lastName}
                  {t.relationship === 'SELF' && <span className="session-current-badge">You</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
                  {t.type} • {t.relationship}
                  {t.nationality ? ` • ${t.nationality}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  title="Documents"
                >
                  <FileText size={14} /> Docs {expandedId === t.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {t.relationship !== 'SELF' && (
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="btn-danger"
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    title="Remove Traveller"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {expandedId === t.id && (
              <div style={{ background: 'rgba(16,32,43,0.03)', border: '1px solid var(--line)', padding: 12, borderRadius: 10, marginTop: 6 }}>
                <TravellerDocuments travellerId={t.id} />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

const emptyDocForm = { documentType: 'PASSPORT', documentNumber: '', issueCountry: '', nationality: '', issueDate: '', expiryDate: '' };

const TravellerDocuments = ({ travellerId }) => {
  const { accessToken } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyDocForm);

  const load = async () => {
    try {
      setLoading(true);
      const data = await userApi.listDocuments(accessToken, travellerId);
      setDocuments(data.documents || []);
    } catch (err) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [travellerId]);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await userApi.createDocument(accessToken, travellerId, form);
      setForm(emptyDocForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message || 'Failed to add document');
    }
  };

  const handleDelete = async (documentId) => {
    try {
      setError('');
      await userApi.deleteDocument(accessToken, travellerId, documentId);
      load();
    } catch (err) {
      setError(err.message || 'Failed to remove document');
    }
  };

  if (loading) return <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Loading documents...</p>;

  return (
    <div>
      {error && <div className="alert-box alert-error">{error}</div>}

      {documents.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 10 }}>No documents on file.</p>
      ) : (
        documents.map((d) => (
          <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '6px 0' }}>
            <span>
              {d.documentType} — {d.documentNumberMasked} {d.expiryDate ? `(exp. ${d.expiryDate.slice(0, 10)})` : ''}
            </span>
            <button onClick={() => handleDelete(d.id)} className="btn-danger" style={{ padding: '4px 8px' }}>
              <Trash2 size={12} />
            </button>
          </div>
        ))
      )}

      <button
        className="btn-secondary"
        onClick={() => setShowForm((s) => !s)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: '0.8rem' }}
      >
        <Plus size={14} /> Add Document
      </button>

      {showForm && (
        <form onSubmit={handleAdd} style={{ marginTop: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <select className="input-field" value={form.documentType} onChange={handleChange('documentType')}>
              <option value="PASSPORT">Passport</option>
              <option value="VISA">Visa</option>
              <option value="NATIONAL_ID">National ID</option>
              <option value="OTHER">Other</option>
            </select>
            <input
              className="input-field"
              placeholder="DOCUMENT NUMBER"
              value={form.documentNumber}
              onChange={handleChange('documentNumber')}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <input
              className="input-field"
              placeholder="ISSUE COUNTRY (e.g. IN)"
              maxLength={2}
              value={form.issueCountry}
              onChange={handleChange('issueCountry')}
            />
            <input
              className="input-field"
              placeholder="NATIONALITY (e.g. IN)"
              maxLength={2}
              value={form.nationality}
              onChange={handleChange('nationality')}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <input type="date" className="input-field" value={form.issueDate} onChange={handleChange('issueDate')} />
            <input type="date" className="input-field" value={form.expiryDate} onChange={handleChange('expiryDate')} />
          </div>
          <button type="submit" className="btn-submit" style={{ marginTop: 10 }}>SAVE DOCUMENT</button>
        </form>
      )}
    </div>
  );
};
