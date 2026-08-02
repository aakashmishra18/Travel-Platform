import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || '');
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken') || '');
  const [loading, setLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('rememberMe') === 'true');
  // Set right after a successful registration so the UI can route to
  // the OTP verification screen for this specific email.
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      if (accessToken) {
        try {
          const data = await api.me(accessToken);
          setUser(data.user);
        } catch (err) {
          // Access token might be expired, attempt refresh
          if (refreshToken) {
            try {
              const refreshed = await api.refresh(refreshToken);
              setAccessToken(refreshed.accessToken);
              setRefreshToken(refreshed.refreshToken);
              if (rememberMe) {
                localStorage.setItem('accessToken', refreshed.accessToken);
                localStorage.setItem('refreshToken', refreshed.refreshToken);
              }
              const userData = await api.me(refreshed.accessToken);
              setUser(userData.user);
            } catch (refErr) {
              clearAuth();
            }
          } else {
            clearAuth();
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const clearAuth = () => {
    setUser(null);
    setAccessToken('');
    setRefreshToken('');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const loginUser = async (email, password, remember) => {
    setRememberMe(remember);
    localStorage.setItem('rememberMe', remember ? 'true' : 'false');

    const deviceName = `${navigator.userAgentData?.platform || navigator.platform || 'Browser'} Device`;
    const data = await api.login(email, password, deviceName);

    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);

    if (remember) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }

    return data;
  };

  const registerUser = async (email, password) => {
    const result = await api.register(email, password);
    setPendingVerificationEmail(email);
    return result;
  };

  const verifyOtp = async (email, otp) => {
    const result = await api.verifyOtp(email, otp);
    setPendingVerificationEmail('');
    return result;
  };

  const resendOtp = async (email) => {
    return await api.resendOtp(email);
  };

  const logoutUser = async () => {
    try {
      if (accessToken && refreshToken) {
        await api.logout(accessToken, refreshToken);
      }
    } catch (err) {
      console.warn('Logout API warning:', err.message);
    } finally {
      clearAuth();
    }
  };

  const logoutAllSessions = async () => {
    try {
      if (accessToken) {
        await api.logoutAll(accessToken);
      }
    } catch (err) {
      console.warn('Logout all warning:', err.message);
    } finally {
      clearAuth();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        loading,
        rememberMe,
        pendingVerificationEmail,
        setPendingVerificationEmail,
        loginUser,
        registerUser,
        verifyOtp,
        resendOtp,
        logoutUser,
        logoutAllSessions,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
