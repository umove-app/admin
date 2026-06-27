import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/admin/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
};

// Admin API
export const adminApi = {
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getUserRegistrationStats: (startDate: string, endDate: string) =>
    api.get('/admin/analytics/user-registrations', { params: { startDate, endDate } }),
  getPaymentStats: (startDate: string, endDate: string) =>
    api.get('/admin/analytics/payments', { params: { startDate, endDate } }),
  getOrderStats: (startDate: string, endDate: string) =>
    api.get('/admin/analytics/orders', { params: { startDate, endDate } }),
  getDriverPerformance: (startDate?: string, endDate?: string) =>
    api.get('/admin/analytics/driver-performance', { params: { startDate, endDate } }),
  getVehicleUtilization: (startDate?: string, endDate?: string) =>
    api.get('/admin/analytics/vehicle-utilization', { params: { startDate, endDate } }),

  // User Management
  getAllUsers: (page?: number, limit?: number, role?: string, search?: string) =>
    api.get('/admin/users', { params: { page, limit, role, search } }),
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  suspendUser: (id: string, reason: string) => api.patch(`/admin/users/${id}/suspend`, { reason }),
  activateUser: (id: string) => api.patch(`/admin/users/${id}/activate`),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  // Order Management
  getAllOrders: (page?: number, limit?: number, status?: string, startDate?: string, endDate?: string) =>
    api.get('/admin/orders', { params: { page, limit, status, startDate, endDate } }),
  getOrderById: (id: string) => api.get(`/admin/orders/${id}`),

  // Driver Monitoring
  getActiveDrivers: () => api.get('/admin/drivers/active'),
  getDriverCurrentOrder: (driverId: string) => api.get(`/admin/drivers/${driverId}/current-order`),
};

// Driver API
export const driverApi = {
  getAllDrivers: (page?: number, limit?: number, status?: string) =>
    api.get('/drivers', { params: { page, limit, status } }),
  getDriverById: (id: string) => api.get(`/drivers/${id}`),
  verifyDriver: (id: string) => api.post(`/drivers/${id}/verify`),
  rejectDriver: (id: string, reason: string) => api.post(`/drivers/${id}/reject`, { reason }),
  suspendDriver: (id: string, reason: string) => api.post(`/drivers/${id}/suspend`, { reason }),
};

// Vehicle API
export const vehicleApi = {
  getAllVehicleTypes: (page?: number, limit?: number) =>
    api.get('/admin/vehicles/types', { params: { page, limit } }),
  getVehicleTypeById: (id: string) => api.get(`/admin/vehicles/types/${id}`),
  createVehicleType: (data: any) => api.post('/admin/vehicles/types', data),
  updateVehicleType: (id: string, data: any) => api.put(`/admin/vehicles/types/${id}`, data),
  deleteVehicleType: (id: string) => api.delete(`/admin/vehicles/types/${id}`),
};

// Promo API
export const promoApi = {
  getAllPromos: (page?: number, limit?: number, isActive?: boolean) =>
    api.get('/promos', { params: { page, limit, isActive } }),
  getPromoById: (id: string) => api.get(`/promos/${id}`),
  getPromoByCode: (code: string) => api.get(`/promos/code/${code}`),
  getPromoStats: (id: string) => api.get(`/promos/${id}/stats`),
  createPromo: (data: any) => api.post('/promos', data),
  updatePromo: (id: string, data: any) => api.put(`/promos/${id}`, data),
  activatePromo: (id: string) => api.patch(`/promos/${id}/activate`),
  deactivatePromo: (id: string) => api.patch(`/promos/${id}/deactivate`),
  deletePromo: (id: string) => api.delete(`/promos/${id}`),
};

// Notification API
export const notificationApi = {
  sendNotification: (data: {
    title: string;
    body: string;
    type: string;
    userId?: string;
    audienceGroup?: string;
    imageUrl?: string;
    data?: Record<string, any>;
  }) => api.post('/notifications/admin/send', data),
  getAllNotifications: (page?: number, limit?: number) =>
    api.get('/notifications/admin', { params: { page, limit } }),
};

// Settings API
export const settingsApi = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data: any) => api.put('/settings', data),
};

// Emergency API
export const emergencyApi = {
  getAll: (page?: number, limit?: number, status?: string, type?: string) =>
    api.get('/admin/emergencies', { params: { page, limit, status, type } }),
  getById: (id: string) => api.get(`/admin/emergencies/${id}`),
  getRecent: (limit?: number) => api.get('/admin/emergencies/recent', { params: { limit } }),
  getStats: () => api.get('/admin/emergencies/stats'),
  update: (id: string, data: { status?: string; adminNotes?: string }) =>
    api.patch(`/admin/emergencies/${id}`, data),
};

// Location Tracking API
export const locationTrackingApi = {
  getAllDriverLocations: () => api.get('/admin/location-tracking/drivers/all'),
  getDriverLocation: (driverId: string) => api.get(`/admin/location-tracking/drivers/${driverId}`),
  getDriverLocationHistory: (driverId: string, startDate?: string, endDate?: string, limit?: number) =>
    api.get(`/admin/location-tracking/drivers/${driverId}/history`, { params: { startDate, endDate, limit } }),
  getOrderLocationTrail: (orderId: string) => api.get(`/admin/location-tracking/orders/${orderId}`),
};
