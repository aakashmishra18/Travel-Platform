const API_BASE = '/v1/search';

/**
 * Unlike userApi's request(), accessToken here is optional — search is
 * a public feature. When present, it's forwarded so search-service can
 * personalize/log the search against the account (see optionalAuth
 * middleware server-side); when absent, the search still works fine
 * as a guest.
 */
const request = async (endpoint, accessToken, options = {}) => {
  const { headers = {}, ...rest } = options;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
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

export const searchApi = {
  searchFlights: (accessToken, params) =>
    request('/flights', accessToken, { method: 'POST', body: JSON.stringify(params) }),

  searchAirports: (query) =>
    request(`/airports?q=${encodeURIComponent(query)}`, null, { method: 'GET' }),

  popularRoutes: () => request('/popular-routes', null, { method: 'GET' }),

  recentSearches: (accessToken) =>
    request('/recent-searches', accessToken, { method: 'GET' }),
};
