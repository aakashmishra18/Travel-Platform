import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { searchApi } from '../../services/searchApi';
import { AirportAutocomplete } from './AirportAutocomplete';
import { FlightResultCard } from './FlightResultCard';
import { ArrowLeftRight, Search } from 'lucide-react';

const emptyAirport = { code: '', displayText: '' };

export const FlightSearchSection = () => {
  const { accessToken } = useAuth();
  const [tripType, setTripType] = useState('oneway'); // 'oneway' | 'roundtrip'
  const [origin, setOrigin] = useState(emptyAirport);
  const [destination, setDestination] = useState(emptyAirport);
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState('ECONOMY');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!origin.code || !destination.code) {
      setError('Pick an origin and destination from the suggestions list');
      return;
    }

    try {
      setError('');
      setLoading(true);
      setResults(null);
      const data = await searchApi.searchFlights(accessToken, {
        origin: origin.code,
        destination: destination.code,
        departureDate,
        returnDate: tripType === 'roundtrip' ? returnDate : null,
        adults,
        children,
        infants,
        cabinClass,
      });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">Search Flights</h2>
        <p className="dash-section-subtitle">Compare fares across airlines for your next trip.</p>
      </div>

      <div className="dash-inline-panel">
        <div className="auth-tabs" style={{ maxWidth: 280, marginBottom: 20 }}>
          <button
            type="button"
            className={`tab-btn${tripType === 'oneway' ? ' active' : ''}`}
            onClick={() => setTripType('oneway')}
          >
            ONE WAY
          </button>
          <button
            type="button"
            className={`tab-btn${tripType === 'roundtrip' ? ' active' : ''}`}
            onClick={() => setTripType('roundtrip')}
          >
            ROUND TRIP
          </button>
        </div>

        {error && <div className="alert-box alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="flight-search-route-row">
            <AirportAutocomplete placeholder="FROM — CITY OR AIRPORT" value={origin} onChange={setOrigin} />
            <button type="button" className="flight-search-swap-btn" onClick={handleSwap} title="Swap">
              <ArrowLeftRight size={16} />
            </button>
            <AirportAutocomplete placeholder="TO — CITY OR AIRPORT" value={destination} onChange={setDestination} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: tripType === 'roundtrip' ? '1fr 1fr' : '1fr', gap: 12 }}>
            <div className="form-group">
              <input
                type="date"
                className="input-field"
                min={today}
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                required
              />
            </div>
            {tripType === 'roundtrip' && (
              <div className="form-group">
                <input
                  type="date"
                  className="input-field"
                  min={departureDate || today}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div className="form-group">
              <select className="input-field" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
                {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <select className="input-field" value={children} onChange={(e) => setChildren(Number(e.target.value))}>
                {Array.from({ length: 9 }, (_, i) => i).map((n) => (
                  <option key={n} value={n}>{n} Child{n !== 1 ? 'ren' : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <select className="input-field" value={infants} onChange={(e) => setInfants(Number(e.target.value))}>
                {Array.from({ length: 5 }, (_, i) => i).map((n) => (
                  <option key={n} value={n}>{n} Infant{n !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <select className="input-field" value={cabinClass} onChange={(e) => setCabinClass(e.target.value)}>
                <option value="ECONOMY">Economy</option>
                <option value="PREMIUM_ECONOMY">Premium Economy</option>
                <option value="BUSINESS">Business</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Search size={16} /> {loading ? 'SEARCHING...' : 'SEARCH FLIGHTS'}
          </button>
        </form>
      </div>

      {results && (
        <div>
          <div className="dash-list-header">
            <h4 className="dash-list-title">
              {results.origin.city} → {results.destination.city}
            </h4>
            <span className="dash-muted-text">{results.outboundFlights.length} flights found</span>
          </div>

          {results.outboundFlights.length === 0 ? (
            <p className="dash-muted-text">No outbound flights found for this route/date.</p>
          ) : (
            results.outboundFlights.map((f) => <FlightResultCard key={f.offerId} flight={f} />)
          )}

          {results.returnFlights && (
            <>
              <div className="dash-list-header" style={{ marginTop: 24 }}>
                <h4 className="dash-list-title">
                  {results.destination.city} → {results.origin.city} (Return)
                </h4>
                <span className="dash-muted-text">{results.returnFlights.length} flights found</span>
              </div>
              {results.returnFlights.map((f) => <FlightResultCard key={f.offerId} flight={f} />)}
            </>
          )}
        </div>
      )}
    </div>
  );
};
