import axios from 'axios';
import api from '../api';

export const roleService = {
  getRoles: () => api.get('/panel/roles'),
  getRole: (id) => api.get(`/roles/${id}`),
  createRole: (data) => api.post('/panel/roles', data),
  updateRole: (id, data) => api.post(`/panel/roles/${id}?_method=PUT`, data),
  deleteRole: (id) => api.delete(`/panel/roles/${id}`),
  getAllPermissions: () => api.get('/panel/permissions'),
  syncPermissions: (data) => api.post('/panel/roles/syncPermissions' , data)
};