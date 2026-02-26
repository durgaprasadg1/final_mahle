import axios from "axios";
import { toast } from "react-toastify";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.message || "An error occurred";
      const isLoginRequest = error.config?.url?.includes("/auth/login");

      if (error.response.status === 401) {
        if (!isLoginRequest) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
          toast.error("Session expired. Please login again.");
        }
      } else if (error.response.status === 403) {
        toast.error(message);
      } else if (error.response.status >= 500) {
        toast.error("Server error. Please try again later.");
      }
    } else if (error.request) {
      toast.error("Network error. Please check your connection.");
    }

    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  getProfile: () => api.get("/auth/profile"),
  changePassword: (data) => api.put("/auth/change-password", data),
};

// User API
export const userAPI = {
  create: (userData) => api.post("/users", userData),
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  updateStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
  delete: (id) => api.delete(`/users/${id}`),
  getByUnit: (unitId) => api.get(`/users/unit/${unitId}`),
};

// Unit API
export const unitAPI = {
  getAll: () => api.get("/units"),
  getById: (id) => api.get(`/units/${id}`),
  create: (unitData) => api.post("/units", unitData),
  update: (id, unitData) => api.put(`/units/${id}`, unitData),
};

// Product API
export const productAPI = {
  create: (productData) => api.post("/products", productData),
  getAll: (params) => api.get("/products", { params }),
  getById: (id) => api.get(`/products/${id}`),
  update: (id, productData) => api.put(`/products/${id}`, productData),
  delete: (id) => api.delete(`/products/${id}`),
  getByUnit: (unitId) => api.get(`/products/unit/${unitId}`),
  getTypes: () => api.get("/products/types"),
  getTemplates: (params) => api.get("/templates", { params }),
  createTemplate: (type, data) => api.post(`/templates/${type}`, data),
};

// Component templates API (fractiles, cells, tiers) with hierarchy
export const templateAPI = {
  list: (type, params) => api.get(`/templates/${type}`, { params }),
  create: (type, data) => api.post(`/templates/${type}`, data),
  update: (type, id, data) => api.put(`/templates/${type}/${id}`, data),
  delete: (type, id) => api.delete(`/templates/${type}/${id}`),
  // Get cells for a specific fractile
  getCellsByFractile: (fractileId) => api.get(`/templates/cells`, { params: { fractile_id: fractileId } }),
  // Get tiers for a specific cell
  getTiersByCell: (cellId) => api.get(`/templates/tiers`, { params: { cell_id: cellId } }),
  // Get full hierarchy for a tier (for product creation)
  getTierHierarchy: (tierId) => api.get(`/templates/tiers/${tierId}/hierarchy`),
};

// Batch API
export const batchAPI = {
  create: (batchData) => api.post("/batches", batchData),
  getAll: (params) => api.get("/batches", { params }),
  getById: (id) => api.get(`/batches/${id}`),
  update: (id, batchData) => api.put(`/batches/${id}`, batchData),
  delete: (id) => api.delete(`/batches/${id}`),
  getByUnit: (unitId, params) => api.get(`/batches/unit/${unitId}`, { params }),
  getStatistics: (unitId, params) =>
    api.get(`/batches/unit/${unitId}/statistics`, { params }),
};

export default api;
