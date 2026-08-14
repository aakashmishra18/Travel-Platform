const API_BASE = '/v1/bookings';

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
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.message || data.message || 'An error occurred during request');
  }

  return data;
};

export const bookingApi = {
  createBooking: (accessToken, payload) =>
    request('', accessToken, { method: 'POST', body: JSON.stringify(payload) }),

  // The mock payment gateway always succeeds — this endpoint is what
  // actually turns a PENDING_PAYMENT booking into a real, confirmed
  // one with a PNR. No real charge happens anywhere in this call.
  confirmPayment: (accessToken, bookingId) =>
    request(`/${bookingId}/confirm-payment`, accessToken, { method: 'POST' }),

  getBooking: (accessToken, bookingId) => request(`/${bookingId}`, accessToken, { method: 'GET' }),

  listBookings: (accessToken) => request('', accessToken, { method: 'GET' }),

  cancelBooking: (accessToken, bookingId) =>
    request(`/${bookingId}/cancel`, accessToken, { method: 'POST' }),
};
