import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { VerifyOtpPage } from './components/VerifyOtpPage';
import { Dashboard } from './components/Dashboard';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { Plane } from 'lucide-react';

/**
 * Left-hand brand panel for the unauthenticated flow. Full viewport
 * height on desktop, collapses to a compact band above the form on
 * narrow screens (see index.css breakpoints).
 */
const HeroPanel = () => (
  <aside className="hero-panel">
    <div className="hero-panel-inner">
      <div className="brand-mark">
        <span className="brand-mark-dot" />
        Travel OS
      </div>

      <h1 className="hero-headline">
        Plan less.
        <br />
        Travel more.
      </h1>
      <p className="hero-subline">
        One account for flights, stayss and everything in between —
        synced across every deevice you sign in onn.
      </p>

      <div className="flight-path" aria-hidden="true">
        <svg className="flight-path-svg" viewBox="0 0 520 220" preserveAspectRatio="none">
          <path d="M20,190 C150,30 370,30 500,70" className="flight-path-line" />
          <circle cx="20" cy="190" r="6" className="flight-pin flight-pin-start" />
          <circle cx="500" cy="70" r="6" className="flight-pin flight-pin-end" />
        </svg>
        <div className="flight-plane">
          <Plane size={20} strokeWidth={2.25} />
        </div>
        <span className="flight-label flight-label-start">YOU, TODAY</span>
        <span className="flight-label flight-label-end">WHERE NEXT</span>
      </div>

      <dl className="hero-stats">
        <div>
          <dt>12k+</dt>
          <dd>routes tracked</dd>
        </div>
        <div>
          <dt>4.8/5</dt>
          <dd>traveller rating</dd>
        </div>
        <div>
          <dt>190+</dt>
          <dd>countries covered</dd>
        </div>
      </dl>
    </div>
  </aside>
);

const AuthFlow = () => {
  const [view, setView] = useState('login'); // 'login' | 'signup' | 'verify-otp'
  const [verifyEmail, setVerifyEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (view === 'verify-otp') {
    return (
      <VerifyOtpPage
        email={verifyEmail}
        onVerified={() => setView('login')}
        onBackToLogin={() => setView('login')}
      />
    );
  }

  return (
    <>
      {view === 'login' ? (
        <LoginPage
          onSwitchToSignup={() => setView('signup')}
          onOpenForgotPassword={() => setShowForgotPassword(true)}
        />
      ) : (
        <SignupPage
          onSwitchToLogin={() => setView('login')}
          onRegistered={(email) => {
            setVerifyEmail(email);
            setView('verify-otp');
          }}
        />
      )}

      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
    </>
  );
};

const MainContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-shell">
        <div className="loading-state">Loading authentication state…</div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="dashboard-shell">
        <Dashboard />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <HeroPanel />
      <main className="auth-panel">
        <div className="auth-panel-inner">
          <AuthFlow />
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
