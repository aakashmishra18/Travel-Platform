import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingApi } from '../services/bookingApi';
import { Plane, Ticket, XCircle, RefreshCw } from 'lucide-react';

const STATUS_COLORS = {
  PENDING_PAYMENT: { color: '#c05621', label: 'Pending Payment' },
  CONFIRMED: { color: '#38a169', label: 'Confirmed' },
  CANCELLED: { color: '#a0aec0', label: 'Cancelled' },
  EXPIRED: { color: '#a0aec0', label: 'Expired' },
  PAYMENT_FAILED: { color: '#e53e3e', label: 'Payment Failed' },
};

export const MyBookingsSection = () => {
  const { accessToken } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [cancellingId, setCancellingId] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await bookingApi.listBookings(accessToken);
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [accessToken]);

  const handleCancel = async (bookingId) => {
    try {
      setError('');
      setCancellingId(bookingId);
      await bookingApi.cancelBooking(accessToken, bookingId);
      setMessage('Booking cancelled');
      load();
    } catch (err) {
      setError(err.message || 'Failed to cancel booking');
    } finally {
      setCancellingId('');
    }
  };

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">My Bookings</h2>
        <p className="dash-section-subtitle">Everything you've booked, confirmed or otherwise.</p>
      </div>

      {error && <div className="alert-box alert-error">{error}</div>}
      {message && <div className="alert-box alert-success">{message}</div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={load} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <p className="dash-muted-text">Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <p className="dash-muted-text">No bookings yet — search for a flight and book one.</p>
      ) : (
        bookings.map((b) => {
          const statusMeta = STATUS_COLORS[b.status] || { color: 'var(--muted)', label: b.status };
          return (
            <div key={b.id} className="flight-result-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Plane size={16} color="var(--sunset-dark)" />
                  <strong>{b.origin} → {b.destination}</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{b.departureDate}</span>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: statusMeta.color }}>
                  {statusMeta.label}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                <span>Amount: ₹{b.totalAmount.toLocaleString('en-IN')}</span>
                {b.pnr && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Ticket size={12} /> PNR: <strong>{b.pnr}</strong>
                  </span>
                )}
                {b.refundAmount != null && <span>Refunded: ₹{b.refundAmount.toLocaleString('en-IN')}</span>}
              </div>

              {(b.status === 'CONFIRMED' || b.status === 'PENDING_PAYMENT') && (
                <div>
                  <button
                    onClick={() => handleCancel(b.id)}
                    className="btn-danger"
                    disabled={cancellingId === b.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <XCircle size={14} /> {cancellingId === b.id ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
