const API_BASE = '/v1/auth';

const request = async (endpoint, options = {}) => {
  const { headers = {}, ...rest } = options;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...rest,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || 'An error occurred during request');
  }

  return data;
};

export const api = {
  register: (email, password) =>
    request('/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: (email, password, deviceName) =>
    request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, deviceName }),
    }),

  me: (accessToken) =>
    request('/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  refresh: (refreshToken) =>
    request('/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  listSessions: (accessToken) =>
    request('/sessions', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  revokeSession: (accessToken, sessionId) =>
    request(`/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  changePassword: (accessToken, currentPassword, newPassword) =>
    request('/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  forgotPassword: (email) =>
    request('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token, newPassword) =>
    request('/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  resendVerification: (email) =>
    request('/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyEmail: (token) =>
    request('/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  logout: (accessToken, refreshToken) =>
    request('/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ refreshToken }),
    }),

  logoutAll: (accessToken) =>
    request('/logout-all', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};
