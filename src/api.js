import axios from "axios";
import { logout } from "./services/auth";

const API_URL = "https://gol.digizooom.com/api/v1";

// Create an Axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to include the token in every request
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
  }
);

// Add a response interceptor to handle unauthorized responses and validation errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        // If the response status is 401 (Unauthorized), log out the user
        logout();
        // Redirect to the login page
        window.location.href = "/login";
      }
      
      // Handle validation errors (422) - special format with nested errors
      if (status === 422) {
        // Extract validation errors from the response structure you provided
        const validationErrors = data?.data?.errors || {};
        // Add the validation errors to the error object for easy access
        error.validationErrors = validationErrors;
        // Also add the main error message
        error.validationMessage = data?.message || "validation error";
      }
      
      // For all other errors (403, 409, 500, etc.) - they follow the same format
      // Extract and decode the Unicode message
      if (data?.message) {
        // Decode Unicode characters in the message
        const decodedMessage = data.message.replace(/\\u[\dA-F]{4}/gi, (match) => {
          return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
        });
        error.decodedMessage = decodedMessage;
      }
      
      // Add general error info for easier access
      error.errorData = {
        success: data?.success || false,
        status: status,
        message: data?.message || "خطایی رخ داده است",
        decodedMessage: error.decodedMessage || data?.message || "خطایی رخ داده است",
        data: data?.data || null
      };
    }
    return Promise.reject(error);
  }
);

export default api;
