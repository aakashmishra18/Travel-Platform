import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { searchApi } from '../../services/searchApi';

const DEBOUNCE_MS = 250;

/**
 * Text input with a debounced dropdown of matching airports. Displays
 * "City (CODE)" once picked, but the value the parent actually holds
 * (and submits) is always the 3-letter code — `displayText` is purely
 * local, cosmetic state.
 */
export const AirportAutocomplete = ({ value, onChange, placeholder }) => {
  const [query, setQuery] = useState(value?.displayText || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // Sync local text if the parent resets the value externally (e.g.
    // a "swap origin/destination" action elsewhere).
    setQuery(value?.displayText || '');
  }, [value?.displayText]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInput = (e) => {
    const text = e.target.value;
    setQuery(text);
    onChange({ code: '', displayText: text }); // clear the committed code until a real pick is made

    clearTimeout(debounceRef.current);
    if (text.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await searchApi.searchAirports(text);
        setSuggestions(data.airports || []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  };

  const handlePick = (airport) => {
    const displayText = `${airport.city} (${airport.code})`;
    setQuery(displayText);
    onChange({ code: airport.code, displayText });
    setOpen(false);
  };

  return (
    <div className="form-group" ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        className="input-field"
        placeholder={placeholder}
        value={query}
        onChange={handleInput}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
        required
      />
      {open && (
        <div className="airport-suggest-list">
          {loading && <div className="airport-suggest-empty">Searching...</div>}
          {!loading && suggestions.length === 0 && (
            <div className="airport-suggest-empty">No airports found</div>
          )}
          {!loading &&
            suggestions.map((a) => (
              <button
                type="button"
                key={a.code}
                className="airport-suggest-item"
                onClick={() => handlePick(a)}
              >
                <MapPin size={14} />
                <span>
                  <strong>{a.city}</strong> ({a.code}) — {a.name}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
};
