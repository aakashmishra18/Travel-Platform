import React, { useState } from 'react';
import { api } from '../services/api';
import { X, KeyRound, CheckCircle } from 'lucide-react';

export const ForgotPasswordModal = ({ onClose }) => {
  const [step, setStep] = useState('request'); // 'request' | 'reset'
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const res = await api.forgotPassword(email);
      setMessage(res.message || 'Password reset link sent to your email');
      if (res.debugResetToken) {
        setResetToken(res.debugResetToken);
      }
      setStep('reset');
    } catch (err) {
      setError(err.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken || !newPassword) {
      setError('Token and new password are required');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const res = await api.resetPassword(resetToken, newPassword);
      setMessage(res.message || 'Password reset successfully!');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header-row">
          <div className="modal-header-title">
            <KeyRound size={20} />
            <span>Reset Password</span>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        {error && <div className="alert-box alert-error">{error}</div>}
        {message && <div className="alert-box alert-success">{message}</div>}

        {step === 'request' ? (
          <form onSubmit={handleRequestReset}>
            <p className="modal-helper-text">
              Enter your registered email address to receive password reset instructions.
            </p>
            <div className="form-group">
              <input
                type="email"
                className="input-field"
                placeholder="EMAIL ADDRESS"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'SENDING...' : 'CONTINUE'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <p className="modal-helper-text">
              Check your email for the reset link, then paste the token from that link below along with your new password.
            </p>
            <div className="form-group">
              <input
                type="text"
                className="input-field"
                placeholder="RESET TOKEN"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                className="input-field"
                placeholder="NEW PASSWORD"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'RESETTING...' : 'UPDATE PASSWORD'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
