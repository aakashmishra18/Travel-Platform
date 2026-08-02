import React from 'react';
import { MailCheck } from 'lucide-react';
import { OtpVerifyForm } from './OtpVerifyForm';

export const VerifyOtpPage = ({ email, onVerified, onBackToLogin }) => {
  return (
    <div className="auth-card">
      <div className="avatar-badge">
        <MailCheck />
      </div>

      <h2 className="auth-title">Verify your email</h2>

      <OtpVerifyForm email={email} onVerified={onVerified} />

      <div style={{ marginTop: 18, textAlign: 'center' }}>
        <span className="forgot-link" role="button" tabIndex={0} onClick={onBackToLogin}>
          Back to log in
        </span>
      </div>
    </div>
  );
};
