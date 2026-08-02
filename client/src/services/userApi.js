const API_BASE = '/v1/users';

const request = async (endpoint, accessToken, options = {}) => {
  const { headers = {}, ...rest } = options;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...headers,
    },
    ...rest,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  // 204 No Content responses (deletes) have no body to parse.
  if (response.status === 204) {
    if (!response.ok) throw new Error('Request failed');
    return {};
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.message || data.message || 'An error occurred during request');
  }

  return data;
};

export const userApi = {
  // -----------------------------------------------------------------
  // Profile
  // -----------------------------------------------------------------
  getProfile: (accessToken) => request('/profile', accessToken, { method: 'GET' }),

  updateProfile: (accessToken, fields) =>
    request('/profile', accessToken, { method: 'PUT', body: JSON.stringify(fields) }),

  requestProfileDeletion: (accessToken) =>
    request('/profile/request-deletion', accessToken, { method: 'POST' }),

  // -----------------------------------------------------------------
  // Travellers
  // -----------------------------------------------------------------
  listTravellers: (accessToken) => request('/travellers', accessToken, { method: 'GET' }),

  createTraveller: (accessToken, data) =>
    request('/travellers', accessToken, { method: 'POST', body: JSON.stringify(data) }),

  updateTraveller: (accessToken, travellerId, data) =>
    request(`/travellers/${travellerId}`, accessToken, { method: 'PUT', body: JSON.stringify(data) }),

  deleteTraveller: (accessToken, travellerId) =>
    request(`/travellers/${travellerId}`, accessToken, { method: 'DELETE' }),

  // -----------------------------------------------------------------
  // Traveller documents
  // -----------------------------------------------------------------
  listDocuments: (accessToken, travellerId) =>
    request(`/travellers/${travellerId}/documents`, accessToken, { method: 'GET' }),

  createDocument: (accessToken, travellerId, data) =>
    request(`/travellers/${travellerId}/documents`, accessToken, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteDocument: (accessToken, travellerId, documentId) =>
    request(`/travellers/${travellerId}/documents/${documentId}`, accessToken, { method: 'DELETE' }),

  // -----------------------------------------------------------------
  // Addresses
  // -----------------------------------------------------------------
  listAddresses: (accessToken) => request('/addresses', accessToken, { method: 'GET' }),

  createAddress: (accessToken, data) =>
    request('/addresses', accessToken, { method: 'POST', body: JSON.stringify(data) }),

  updateAddress: (accessToken, addressId, data) =>
    request(`/addresses/${addressId}`, accessToken, { method: 'PUT', body: JSON.stringify(data) }),

  deleteAddress: (accessToken, addressId) =>
    request(`/addresses/${addressId}`, accessToken, { method: 'DELETE' }),

  // -----------------------------------------------------------------
  // Saved contacts
  // -----------------------------------------------------------------
  listContacts: (accessToken) => request('/contacts', accessToken, { method: 'GET' }),

  createContact: (accessToken, data) =>
    request('/contacts', accessToken, { method: 'POST', body: JSON.stringify(data) }),

  deleteContact: (accessToken, contactId) =>
    request(`/contacts/${contactId}`, accessToken, { method: 'DELETE' }),

  // -----------------------------------------------------------------
  // Preferences & settings
  // -----------------------------------------------------------------
  getPreferences: (accessToken) => request('/preferences', accessToken, { method: 'GET' }),

  updatePreferences: (accessToken, fields) =>
    request('/preferences', accessToken, { method: 'PUT', body: JSON.stringify(fields) }),

  getSettings: (accessToken) => request('/settings', accessToken, { method: 'GET' }),

  updateSettings: (accessToken, fields) =>
    request('/settings', accessToken, { method: 'PUT', body: JSON.stringify(fields) }),

  // -----------------------------------------------------------------
  // Loyalty programs
  // -----------------------------------------------------------------
  listLoyaltyPrograms: (accessToken) => request('/loyalty-programs', accessToken, { method: 'GET' }),

  createLoyaltyProgram: (accessToken, data) =>
    request('/loyalty-programs', accessToken, { method: 'POST', body: JSON.stringify(data) }),

  deleteLoyaltyProgram: (accessToken, loyaltyId) =>
    request(`/loyalty-programs/${loyaltyId}`, accessToken, { method: 'DELETE' }),

  // -----------------------------------------------------------------
  // Consents
  // -----------------------------------------------------------------
  listConsents: (accessToken) => request('/consents', accessToken, { method: 'GET' }),

  recordConsent: (accessToken, data) =>
    request('/consents', accessToken, { method: 'POST', body: JSON.stringify(data) }),
};
