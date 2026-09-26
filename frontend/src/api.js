const BASE_URL = '';

const getAuthHeaders = () => {
  const token = localStorage.getItem('securepharma_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (res) => {
  try {
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, message: 'Invalid response from server.' };
  }
};

export const api = {
  // Auth
  async register(formData) {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  async login(email, password) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async logout() {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async forgotPassword(email) {
    const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  async resetPassword(token, newPassword) {
    const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    return handleResponse(res);
  },

  async getVerificationStatus(query) {
    const params = new URLSearchParams(query);
    const res = await fetch(`${BASE_URL}/api/auth/verification-status?${params}`);
    return handleResponse(res);
  },

  // Organizations
  async getOrganizations(params = {}) {
    const query = new URLSearchParams(params);
    const res = await fetch(`${BASE_URL}/api/organizations?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async getOrganizationById(id) {
    const res = await fetch(`${BASE_URL}/api/organizations/${id}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async updateOrganization(id, data) {
    const res = await fetch(`${BASE_URL}/api/organizations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateOrganizationStatus(id, status, reason) {
    const res = await fetch(`${BASE_URL}/api/organizations/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ status, reason }),
    });
    return handleResponse(res);
  },

  // Licenses
  async getLicenses(params = {}) {
    const query = typeof params === 'string' ? `status=${params}` : new URLSearchParams(params);
    const res = await fetch(`${BASE_URL}/api/licenses?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async getLicenseById(id) {
    const res = await fetch(`${BASE_URL}/api/licenses/${id}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async createLicense(formData) {
    const res = await fetch(`${BASE_URL}/api/licenses`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData,
    });
    return handleResponse(res);
  },

  async approveLicense(id, remarks) {
    const res = await fetch(`${BASE_URL}/api/licenses/${id}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ remarks }),
    });
    return handleResponse(res);
  },

  async rejectLicense(id, reason) {
    const res = await fetch(`${BASE_URL}/api/licenses/${id}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
  },

  // Products
  async getProducts(params = {}) {
    const query = new URLSearchParams(params);
    const res = await fetch(`${BASE_URL}/api/products?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async getProductById(id) {
    const res = await fetch(`${BASE_URL}/api/products/${id}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async createProduct(data) {
    const res = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateProduct(id, data) {
    const res = await fetch(`${BASE_URL}/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteProduct(id) {
    const res = await fetch(`${BASE_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  // Batches
  async getBatches(params = {}) {
    const query = new URLSearchParams(params);
    const res = await fetch(`${BASE_URL}/api/batches?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async getBatchById(id) {
    const res = await fetch(`${BASE_URL}/api/batches/${id}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async createBatch(data) {
    const res = await fetch(`${BASE_URL}/api/batches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateBatchStatus(id, status, reason) {
    const res = await fetch(`${BASE_URL}/api/batches/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ status, reason }),
    });
    return handleResponse(res);
  },

  // Supply Chain
  async getEvents(params = {}) {
    const query = new URLSearchParams(params);
    const res = await fetch(`${BASE_URL}/api/supply-chain/events?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async getBatchEvents(batchId) {
    const res = await fetch(`${BASE_URL}/api/supply-chain/batches/${batchId}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async recordEvent(data) {
    const res = await fetch(`${BASE_URL}/api/supply-chain/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Distributor
  async getDistributorDashboard() {
    const res = await fetch(`${BASE_URL}/api/distributor/dashboard`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async getDistributorBatches(params = {}) {
    const query = new URLSearchParams(params);
    const res = await fetch(`${BASE_URL}/api/distributor/batches?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async getDistributorInventory(params = {}) {
    const query = new URLSearchParams(params);
    const res = await fetch(`${BASE_URL}/api/distributor/inventory?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async getDistributorTransfers(params = {}) {
    const query = new URLSearchParams(params);
    const res = await fetch(`${BASE_URL}/api/distributor/transfers?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async receiveDistributorBatch(data) {
    const res = await fetch(`${BASE_URL}/api/distributor/transfers/receive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async dispatchDistributorBatch(data) {
    const res = await fetch(`${BASE_URL}/api/distributor/transfers/dispatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getDistributorOrders(params = {}) {
    const query = new URLSearchParams(params);
    const res = await fetch(`${BASE_URL}/api/distributor/orders?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async getDistributorOrderById(orderId) {
    const res = await fetch(`${BASE_URL}/api/distributor/orders/${encodeURIComponent(orderId)}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async updateDistributorOrderStatus(orderId, status, notes) {
    const res = await fetch(`${BASE_URL}/api/distributor/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ status, notes }),
    });
    return handleResponse(res);
  },

  async createOrder(data) {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Verification
  async verifyProduct(identifier) {
    const res = await fetch(`${BASE_URL}/api/verify/${encodeURIComponent(identifier)}`);
    return handleResponse(res);
  },

  async submitScan(data) {
    const res = await fetch(`${BASE_URL}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Backward compatibility
  async trackBatchPublic(batchNumber) {
    return this.verifyProduct(batchNumber);
  },

  // Notifications
  async getNotifications(params = {}) {
    const query = new URLSearchParams(params);
    const res = await fetch(`${BASE_URL}/api/notifications?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async markNotificationRead(id) {
    const res = await fetch(`${BASE_URL}/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async markAllNotificationsRead() {
    const res = await fetch(`${BASE_URL}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  // Audit Logs
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams(params);
    const res = await fetch(`${BASE_URL}/api/audit-logs?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  // Health
  async checkHealth() {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      return handleResponse(res);
    } catch {
      return { success: false, message: 'Backend unreachable.' };
    }
  },
};
