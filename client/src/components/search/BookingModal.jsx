import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../services/userApi';
import { bookingApi } from '../../services/bookingApi';
import { X, CheckCircle2, CreditCard, Loader2, PlaneTakeoff } from 'lucide-react';

/**
 * Real booking flow, backed by booking-service. The "payment" step is
 * genuinely functional end-to-end (creates a real booking row, gets a
 * real PNR back) but the actual charge is mocked — see
 * booking-service's mockPaymentGateway.js. No real money moves here.
 */
export const BookingModal = ({ flight, onClose }) => {
  const { accessToken } = useAuth();
  const [step, setStep] = useState('travellers'); // travellers | payment | confirmed
  const [travellers, setTravellers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await userApi.listTravellers(accessToken);
        setTravellers(data.travellers || []);
        const self = (data.travellers || []).find((t) => t.relationship === 'SELF');
        if (self) setSelectedIds([self.id]);
      } catch (err) {
        setError(err.message || 'Failed to load travellers');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accessToken]);

  const toggleTraveller = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      setError('Select at least one traveller');
      return;
    }
    if (!contactEmail) {
      setError('Contact email is required');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      const data = await bookingApi.createBooking(accessToken, {
        offerId: flight.offerId,
        travellerIds: selectedIds,
        contactEmail,
        contactPhone: contactPhone || undefined,
      });
      setBooking(data.booking);
      setStep('payment');
    } catch (err) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      setError('');
      setSubmitting(true);
      const data = await bookingApi.confirmPayment(accessToken, booking.id);
      setBooking(data.booking);
      setStep('confirmed');
    } catch (err) {
      setError(err.message || 'Payment confirmation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {step === 'confirmed' ? 'Booking Confirmed' : 'Book This Flight'}
          </h3>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 16 }}>
          {flight.airlineName} {flight.flightNumber} — {flight.origin} → {flight.destination}
        </div>

        {error && <div className="alert-box alert-error">{error}</div>}

        {step === 'travellers' && (
          <form onSubmit={handleCreateBooking}>
            {loading ? (
              <p className="dash-muted-text">Loading your travellers...</p>
            ) : travellers.length === 0 ? (
              <p className="dash-muted-text">
                No travellers on file yet — add one under Profile &amp; Travel → Travellers first.
              </p>
            ) : (
              <div style={{ marginBottom: 16 }}>
                {travellers.map((t) => (
                  <label
                    key={t.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(t.id)}
                      onChange={() => toggleTraveller(t.id)}
                    />
                    {t.firstName} {t.lastName}
                    {t.relationship === 'SELF' && <span className="session-current-badge">You</span>}
                  </label>
                ))}
              </div>
            )}

            <div className="form-group">
              <input
                type="email"
                className="input-field"
                placeholder="CONTACT EMAIL"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                className="input-field"
                placeholder="CONTACT PHONE (OPTIONAL)"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-submit" disabled={submitting || travellers.length === 0}>
              {submitting ? 'CREATING BOOKING...' : 'CONTINUE TO PAYMENT'}
            </button>
          </form>
        )}

        {step === 'payment' && booking && (
          <div>
            <div style={{ background: 'var(--sunset-soft)', borderRadius: 10, padding: 16, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>Total Amount</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>
                ₹{booking.totalAmount.toLocaleString('en-IN')}
              </div>
              {booking.priceChanged && (
                <div style={{ fontSize: '0.75rem', color: '#c05621', marginTop: 6 }}>
                  Price updated since search
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 16, textAlign: 'center' }}>
              This uses a mock payment gateway — no real card is charged.
              Clicking below simulates a successful payment.
            </p>

            <button
              onClick={handleConfirmPayment}
              className="btn-submit"
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {submitting ? <Loader2 size={16} /> : <CreditCard size={16} />}
              {submitting ? 'CONFIRMING PAYMENT...' : 'SIMULATE PAYMENT (MOCK)'}
            </button>
          </div>
        )}

        {step === 'confirmed' && booking && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <CheckCircle2 size={44} color="#38a169" style={{ marginBottom: 12 }} />
            <p style={{ fontWeight: 600, marginBottom: 16 }}>Your flight is booked!</p>

            <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: 16, textAlign: 'left', fontSize: '0.85rem', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span className="dash-muted-text">PNR</span>
                <strong>{booking.pnr}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span className="dash-muted-text">Ticket Number</span>
                <strong>{booking.ticketNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span className="dash-muted-text">Status</span>
                <strong>{booking.status}</strong>
              </div>
            </div>

            <button onClick={onClose} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto' }}>
              <PlaneTakeoff size={16} /> Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
