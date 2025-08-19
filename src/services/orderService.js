// services/orderService.js
import axios from 'axios';
import api from "../api"

const API_URL = 'your_api_url';

const orderService = {
  // Get all orders with filtering and pagination
  getOrders: async (params) => {
    const response = await api.get(`${API_URL}/orders`, { params });
    return response.data;
  },

  // Get single order details
  getOrderById: async (orderId) => {
    const response = await api.get(`${API_URL}/orders/${orderId}`);
    return response.data;
  },

  // Update order status
  updateOrderStatus: async (orderId, status, notes) => {
    const response = await api.put(`${API_URL}/orders/${orderId}/status`, {
      status,
      notes
    });
    return response.data;
  },

  // Process refund
  processRefund: async (orderId, refundData) => {
    const response = await api.post(`${API_URL}/orders/${orderId}/refund`, refundData);
    return response.data;
  },

  // Generate invoice
  generateInvoice: async (orderId) => {
    const response = await api.get(`${API_URL}/orders/${orderId}/invoice`);
    return response.data;
  },

  // Get shipping rates
  getShippingRates: async (orderData) => {
    const response = await api.post(`${API_URL}/shipping/rates`, orderData);
    return response.data;
  },

  // Create shipping label
  createShippingLabel: async (orderId, shippingData) => {
    const response = await api.post(`${API_URL}/orders/${orderId}/shipping-label`, shippingData);
    return response.data;
  }
};

export default orderService;