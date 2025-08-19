// services/supportService.js
import axios from 'axios';
import api from "../api"


const API_URL = 'your_api_url';

const supportService = {
  // Tickets
  getTickets: async (params) => {
    const response = await api.get(`${API_URL}/tickets`, { params });
    return response.data;
  },

  createTicket: async (ticketData) => {
    const response = await api.post(`${API_URL}/tickets`, ticketData);
    return response.data;
  },

  updateTicket: async (ticketId, updateData) => {
    const response = await api.put(`${API_URL}/tickets/${ticketId}`, updateData);
    return response.data;
  },

  // Chat
  getChatHistory: async (userId) => {
    const response = await api.get(`${API_URL}/chat/${userId}`);
    return response.data;
  },

  sendMessage: async (chatData) => {
    const response = await api.post(`${API_URL}/chat/messages`, chatData);
    return response.data;
  },

  // Disputes
  getDisputes: async (params) => {
    const response = await api.get(`${API_URL}/disputes`, { params });
    return response.data;
  },

  createDispute: async (disputeData) => {
    const response = await api.post(`${API_URL}/disputes`, disputeData);
    return response.data;
  },

  // Returns/Refunds
  getReturnRequests: async (params) => {
    const response = await api.get(`${API_URL}/returns`, { params });
    return response.data;
  },

  createReturnRequest: async (returnData) => {
    const response = await api.post(`${API_URL}/returns`, returnData);
    return response.data;
  },

  // Feedback
  getFeedback: async (params) => {
    const response = await api.get(`${API_URL}/feedback`, { params });
    return response.data;
  },

  submitFeedback: async (feedbackData) => {
    const response = await api.post(`${API_URL}/feedback`, feedbackData);
    return response.data;
  }
};

export default supportService;