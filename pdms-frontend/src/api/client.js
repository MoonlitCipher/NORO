const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getToken() {
    return localStorage.getItem('nextus_access_token');
  }

  setTokens(accessToken, refreshToken) {
    if (accessToken) localStorage.setItem('nextus_access_token', accessToken);
    if (refreshToken) localStorage.setItem('nextus_refresh_token', refreshToken);
  }

  clearTokens() {
    localStorage.removeItem('nextus_access_token');
    localStorage.removeItem('nextus_refresh_token');
    localStorage.removeItem('nextus_user');
  }

  getUser() {
    const userStr = localStorage.getItem('nextus_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  setUser(user) {
    if (user) localStorage.setItem('nextus_user', JSON.stringify(user));
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        // If 401 Unauthorized and not already refreshing, try token refresh
        if (response.status === 401 && !endpoint.includes('/auth/')) {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            headers['Authorization'] = `Bearer ${this.getToken()}`;
            const retryRes = await fetch(url, { ...options, headers });
            const retryData = await retryRes.json().catch(() => null);
            if (retryRes.ok) return retryData?.data ?? retryData;
          }
        }

        const errorMessage =
          data?.message || data?.error || `Request failed with status ${response.status}`;
        const err = new Error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
        err.statusCode = response.status;
        err.details = data;
        throw err;
      }

      // Check if wrapped in TransformInterceptor { success, data, timestamp }
      return data?.data !== undefined ? data.data : data;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('nextus_refresh_token');
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        this.clearTokens();
        return false;
      }

      const json = await res.json();
      const data = json?.data || json;
      if (data?.accessToken) {
        this.setTokens(data.accessToken, data.refreshToken);
        return true;
      }
      return false;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  get(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'GET', headers });
  }

  post(endpoint, body, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
    });
  }

  put(endpoint, body, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers,
    });
  }

  patch(endpoint, body, headers = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers,
    });
  }

  delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers });
  }
}

export const api = new ApiClient();

// Auth API
export const authApi = {
  login: async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    if (res?.accessToken) {
      api.setTokens(res.accessToken, res.refreshToken);
      api.setUser(res.user);
    }
    return res;
  },
  registerCustomer: async (data) => {
    const res = await api.post('/auth/register', data);
    if (res?.accessToken) {
      api.setTokens(res.accessToken, res.refreshToken);
      api.setUser(res.user);
    }
    return res;
  },
  registerPartner: async (data) => {
    const res = await api.post('/auth/register/partner', data);
    if (res?.accessToken) {
      api.setTokens(res.accessToken, res.refreshToken);
      api.setUser(res.user);
    }
    return res;
  },
  me: () => api.get('/auth/me'),
  logout: async () => {
    try {
      await api.post('/auth/logout', {});
    } finally {
      api.clearTokens();
    }
  },
};

// Orders API
export const ordersApi = {
  create: (data) => api.post('/orders', data),
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/orders${query ? `?${query}` : ''}`);
  },
  getById: (id) => api.get(`/orders/${id}`),
  track: (trackingNumber) => api.get(`/orders/track/${trackingNumber}`),
  cancel: (id, reason) => api.patch(`/orders/${id}/cancel`, { reason }),
};

// Pricing API
export const pricingApi = {
  getQuote: (data) => api.post('/pricing/quote', data),
  getRules: () => api.get('/pricing/rules'),
  updateRule: (id, data) => api.put(`/pricing/rules/${id}`, data),
};

// Payments API
export const paymentsApi = {
  createIntent: (orderId, method) => api.post('/payments/intent', { orderId, method }),
  verify: (data) => api.post('/payments/verify', data),
};

// Partner API
export const partnerApi = {
  getProfile: () => api.get('/partners/profile'),
  updateAvailability: (isAvailable) => api.patch('/partners/availability', { isAvailable }),
  updateLocation: (lat, lng) => api.patch('/partners/location', { latitude: lat, longitude: lng }),
  getAvailableJobs: () => api.get('/partners/orders/available'),
  getActiveJob: () => api.get('/partners/orders/active'),
  pickupOrder: (orderId) => api.post(`/partners/orders/${orderId}/pickup`, {}),
  inTransitOrder: (orderId) => api.post(`/partners/orders/${orderId}/in-transit`, {}),
  completeDelivery: (orderId, data) => api.post(`/partners/orders/${orderId}/deliver`, data),
  getHistory: () => api.get('/partners/history'),
  submitDocument: (data) => api.post('/partners/documents', data),
  addVehicle: (data) => api.post('/partners/vehicles', data),
};

// Dispatch API
export const dispatchApi = {
  acceptJob: (orderId) => api.post(`/dispatch/accept/${orderId}`, {}),
  rejectJob: (orderId) => api.post(`/dispatch/reject/${orderId}`, {}),
  assignPartner: (orderId, partnerId) => api.post('/dispatch/assign', { orderId, partnerId }),
};

// Earnings API
export const earningsApi = {
  getMyEarnings: () => api.get('/earnings/my'),
  requestSettlement: () => api.post('/earnings/settlement-request', {}),
  getAllSettlements: () => api.get('/earnings/settlements'),
  processSettlement: (id) => api.patch(`/earnings/settlements/${id}/process`, {}),
};

// Notifications API
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`, {}),
  markAllRead: () => api.patch('/notifications/read-all', {}),
  clearAll: () => api.delete('/notifications/clear'),
};

// Users / Addresses API
export const usersApi = {
  updateProfile: (data) => api.patch('/users/me', data),
  getAddresses: () => api.get('/users/addresses'),
  addAddress: (data) => api.post('/users/addresses', data),
  deleteAddress: (id) => api.delete(`/users/addresses/${id}`),
  setDefaultAddress: (id) => api.patch(`/users/addresses/${id}/default`, {}),
};

// Support API
export const supportApi = {
  createTicket: (data) => api.post('/support/tickets', data),
  getTickets: () => api.get('/support/tickets'),
  replyTicket: (id, data) => api.patch(`/support/tickets/${id}/reply`, data),
};

// Admin API
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getPartners: () => api.get('/admin/partners'),
  getPartnerDetails: (id) => api.get(`/admin/partners/${id}`),
  updateKyc: (id, status, reason) => api.patch(`/admin/partners/${id}/kyc`, { status, reason }),
  verifyDocument: (docId, status, rejectionReason) =>
    api.patch(`/admin/documents/${docId}/verify`, { status, rejectionReason }),
  getLiveTracking: () => api.get('/admin/live-tracking'),
  getAuditLogs: (page = 1, limit = 50) => api.get(`/admin/audit-logs?page=${page}&limit=${limit}`),
};
