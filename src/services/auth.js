import axios from "axios";

const API_URL = "https://api.digizooom.com/api/v1";

export const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    username,
    password,
  });
  const token = response.data.meta.token;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(response.data.data));
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login"; // Redirect to login page
};

export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  console.log("isAuthenticated:", !!token);
  return !!token;
};

export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};
