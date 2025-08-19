import axios from "axios";
import { logout } from "./services/auth";

const API_URL = "https://api.digizooom.com/api/v1";

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
      if (error.response.status === 401) {
        // If the response status is 401 (Unauthorized), log out the user
        logout();
        // Redirect to the login page
        window.location.href = "/login";
      }
      
      // Handle validation errors (422)
      if (error.response.status === 422) {
        // Extract validation errors from the response
        const validationErrors = error.response.data?.data?.errors || {};
        // Add the validation errors to the error object for easy access
        error.validationErrors = validationErrors;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
