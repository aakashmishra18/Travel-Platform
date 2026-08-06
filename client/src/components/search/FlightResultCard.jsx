import React from 'react';
import { Clock, Luggage } from 'lucide-react';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export const FlightResultCard = ({ flight }) => {
  return (
    <div className="flight-result-card">
      <div className="flight-result-airline">
        <span className="flight-result-airline-code">{flight.airline.code}</span>
        <div>
          <div className="flight-result-airline-name">{flight.airline.name}</div>
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
          <Luggage size={12} /> {flight.baggage.checkIn} + {flight.baggage.cabin}
        </span>
        <span className="flight-result-seats">{flight.availableSeats} seats left</span>
      </div>

      <div className="flight-result-price-block">
        <span className="flight-result-price">₹{flight.price.amount.toLocaleString('en-IN')}</span>
        <button type="button" className="btn-secondary">Select</button>
      </div>
    </div>
  );
};
