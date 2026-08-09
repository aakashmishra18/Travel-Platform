import React, { useState } from 'react';
import { Clock, Luggage, ChevronDown, ChevronUp, Wifi, WifiOff, Utensils, Plane } from 'lucide-react';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(minutes) {
  if (minutes == null) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

/**
 * flight comes straight from supplier-service's normalized offer shape
 * now (via search-service passthrough) — offerId/airlineCode/airlineName
 * instead of the old local mock's id/airline.code/airline.name. Several
 * fields (availableSeats, meal, wifi) can be null for real providers
 * that don't expose them the same way Mock does — every read below is
 * null-safe rather than assuming Mock's shape.
 */
export const FlightResultCard = ({ flight }) => {
  const [expanded, setExpanded] = useState(false);
  const fareRules = flight.fareRules || {};

  return (
    <div className="flight-result-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', width: '100%' }}>
        <div className="flight-result-airline">
          <span className="flight-result-airline-code">{flight.airlineCode}</span>
          <div>
            <div className="flight-result-airline-name">{flight.airlineName}</div>
            <div className="flight-result-flight-number">{flight.flightNumber}</div>
          </div>
        </div>

        <div className="flight-result-times">
          <div className="flight-result-time-block">
            <span className="flight-result-time">{formatTime(flight.departureTime)}</span>
            <span className="flight-result-airport">{flight.origin}</span>
          </div>
          <div className="flight-result-duration">
            <Clock size={12} />
            {formatDuration(flight.durationMinutes)}
            <div className="flight-result-stops">
              {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
            </div>
          </div>
          <div className="flight-result-time-block">
            <span className="flight-result-time">{formatTime(flight.arrivalTime)}</span>
            <span className="flight-result-airport">{flight.destination}</span>
          </div>
        </div>

        <div className="flight-result-meta">
          <span className="flight-result-baggage">
            <Luggage size={12} /> {flight.baggage?.checkIn || 'See fare rules'} + {flight.baggage?.cabin || '—'}
          </span>
          <span className="flight-result-seats">
            {flight.availableSeats != null ? `${flight.availableSeats} seats left` : 'Seats: on request'}
          </span>
        </div>

        <div className="flight-result-price-block">
          <span className="flight-result-price">₹{flight.price.amount.toLocaleString('en-IN')}</span>
          <button type="button" className="btn-secondary" onClick={() => setExpanded((e) => !e)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            Details {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
          <div>
            <div style={{ color: 'var(--muted)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Plane size={12} /> Aircraft
            </div>
            {flight.aircraft || 'Not specified'}
          </div>
          <div>
            <div style={{ color: 'var(--muted)', marginBottom: 3 }}>Terminal</div>
            {flight.terminal?.departure || '—'} → {flight.terminal?.arrival || '—'}
          </div>
          <div>
            <div style={{ color: 'var(--muted)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Utensils size={12} /> Meal
            </div>
            {flight.meal || 'See fare rules'}
          </div>
          <div>
            <div style={{ color: 'var(--muted)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
              {flight.wifi ? <Wifi size={12} /> : <WifiOff size={12} />} Wi-Fi
            </div>
            {flight.wifi == null ? 'Not specified' : flight.wifi ? 'Available' : 'Not available'}
          </div>
          <div>
            <div style={{ color: 'var(--muted)', marginBottom: 3 }}>Refundable</div>
            {fareRules.refundable ? 'Yes' : 'No'}
          </div>
          <div>
            <div style={{ color: 'var(--muted)', marginBottom: 3 }}>Cancellation Fee</div>
            {fareRules.cancellationFee != null ? `₹${fareRules.cancellationFee.toLocaleString('en-IN')}` : '—'}
          </div>
          <div>
            <div style={{ color: 'var(--muted)', marginBottom: 3 }}>Change Fee</div>
            {fareRules.changeFee != null ? `₹${fareRules.changeFee.toLocaleString('en-IN')}` : '—'}
          </div>
        </div>
      )}
    </div>
  );
};
