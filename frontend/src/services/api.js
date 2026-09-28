import { api } from '../api';

export const authApi = {
  login: (email, password) => api.login(email, password),
  register: (formData) => api.register(formData),
  logout: () => api.logout(),
  getMe: () => api.getMe(),
  forgotPassword: (email) => api.forgotPassword(email),
  resetPassword: (token, password) => api.resetPassword(token, password),
  getVerificationStatus: (query) => api.getVerificationStatus(query),
};

export const batchApi = {
  getBatches: (params) => api.getBatches(params),
  getBatchById: (id) => api.getBatchById(id),
  createBatch: (data) => api.createBatch(data),
  updateBatchStatus: (id, status, reason) => api.updateBatchStatus(id, status, reason),
};

export const supplyChainApi = {
  getEvents: (params) => api.getEvents(params),
  getBatchEvents: (batchId) => api.getBatchEvents(batchId),
  recordEvent: (data) => api.recordEvent(data),
  transferBatch: (data) => api.recordEvent(data),
};

export const adminApi = {
  getDashboard: () => api.getAdminDashboard(),
  getUsers: (params) => api.getAdminUsers(params),
  getUserById: (id) => api.getAdminUserById(id),
  updateUserStatus: (id, status, reason) => api.updateAdminUserStatus(id, status, reason),
  getOrganizations: (params) => api.getOrganizations(params),
  updateOrganizationStatus: (id, status, reason) => api.updateOrganizationStatus(id, status, reason),
  getLicenses: (params) => api.getLicenses(params),
  getPendingLicenses: () => api.getLicenses({ status: 'PENDING' }),
  getLicenseById: (id) => api.getLicenseById(id),
  getLicenseDocumentBlob: (id) => api.getLicenseDocumentBlob(id),
  approveLicense: (id, remarks) => api.approveLicense(id, remarks),
  rejectLicense: (id, reason) => api.rejectLicense(id, reason),
  getBatches: (params) => api.getAdminBatches(params),
  getBatchById: (id) => api.getAdminBatchById(id),
  updateBatchStatus: (id, status, reason) => api.updateAdminBatchStatus(id, status, reason),
  recallBatch: (id, reason) => api.updateAdminBatchStatus(id, 'RECALLED', reason),
  flagBatch: (id, reason) => api.updateAdminBatchStatus(id, 'FLAGGED', reason),
};

export const auditApi = {
  getLogs: (params) => api.getAuditLogs(params),
  getLogById: (id) => api.getAuditLogById(id),
};

export const productApi = {
  getProducts: (params) => api.getProducts(params),
  getProductById: (id) => api.getProductById(id),
  createProduct: (data) => api.createProduct(data),
  updateProduct: (id, data) => api.updateProduct(id, data),
  deleteProduct: (id) => api.deleteProduct(id),
};

export const licenseApi = {
  getLicenses: (params) => api.getLicenses(params),
  getLicenseById: (id) => api.getLicenseById(id),
  getLicenseDocumentBlob: (id) => api.getLicenseDocumentBlob(id),
  createLicense: (formData) => api.createLicense(formData),
  approveLicense: (id, remarks) => api.approveLicense(id, remarks),
  rejectLicense: (id, reason) => api.rejectLicense(id, reason),
};

export const verificationApi = {
  verifyProduct: (identifier) => api.verifyProduct(identifier),
  submitScan: (data) => api.submitScan(data),
};

export default api;
