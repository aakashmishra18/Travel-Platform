import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Reusable 6-digit OTP entry + resend, used both on the dedicated
 * post-signup verification screen and inline in the Dashboard for
 * accounts that are still unverified.
 */
export const OtpVerifyForm = ({ email, onVerified, compact = false }) => {
  const { verifyOtp, resendOtp } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await verifyOtp(email, otp);
      setMessage('Email verified successfully!');
      onVerified?.();
    } catch (err) {
      setError(err.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setError('');
      setResending(true);
      await resendOtp(email);
      setMessage('A new code was sent to your email');
      startCooldown();
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      {!compact && (
        <p className="otp-helper-text">
          We sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify your account.
        </p>
      )}

      {error && <div className="alert-box alert-error">{error}</div>}
      {message && <div className="alert-box alert-success">{message}</div>}

      <form onSubmit={handleVerify}>
        <div className="form-group">
          <input
            type="text"
            inputMode="numeric"
            className="input-field"
            placeholder="6-DIGIT CODE"
            value={otp}
            maxLength={6}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.1rem' }}
            required
          />
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'VERIFYING...' : 'VERIFY EMAIL'}
        </button>
      </form>

      <div style={{ marginTop: 14, fontSize: '0.85rem', textAlign: 'center' }}>
        {cooldown > 0 ? (
          <span className="otp-cooldown-text">Resend available in {cooldown}s</span>
        ) : (
          <span
            className="forgot-link"
            role="button"
            tabIndex={0}
            onClick={resending ? undefined : handleResend}
            style={{ opacity: resending ? 0.6 : 1 }}
          >
            {resending ? 'Sending...' : "Didn't get a code? Resend"}
          </span>
        )}
      </div>
    </div>
  );
};
