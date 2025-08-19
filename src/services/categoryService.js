import axios from 'axios';
import api from '../api';

const categoryService = {
  getAll: (params = {}) => api.get('/panel/category', { params }),
  getById: (id) => api.get(`/panel/category/${id}`),
  create: (data) => api.post('/panel/category', data),
  update: (id, data) => api.put(`/panel/category/${id}`, data),
  delete: (id) => api.delete(`/panel/category/${id}`),
  getSubcategories: (parentId) => api.get('/panel/category', { 
    params: { 
      parent_id: parentId,
      includes: ['products', 'parent']
    } 
  }),
  getRootCategories: () => api.get('/panel/category', { 
    params: { 
      parent_id: 'null',
      includes: ['products']
    } 
  }),
};

export default categoryService;




