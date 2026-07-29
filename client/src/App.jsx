import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { Dashboard } from './components/Dashboard';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';

const MainContent = () => {
  const { user, loading } = useAuth();
  const [view, setView] = useState('login'); // 'login' | 'signup'
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (loading) {
    return (
      <div style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 500 }}>
        Loading authentication state...
      </div>
    );
  }

  return (
    <>
      {user ? (
        <Dashboard />
      ) : view === 'login' ? (
        <LoginPage
          onSwitchToSignup={() => setView('signup')}
          onOpenForgotPassword={() => setShowForgotPassword(true)}
        />
      ) : (
        <SignupPage onSwitchToLogin={() => setView('login')} />
      )}

      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <div className="skyline-bg">
        <div className="glow-aura"></div>
        <div className="center-tower"></div>
        <div className="tower-beacon"></div>
        <div className="city-silhouette">
          <div className="left-buildings"></div>
          <div className="right-buildings"></div>
        </div>
      </div>

      <div className="app-container">
        <MainContent />
      </div>
    </AuthProvider>
  );
}
