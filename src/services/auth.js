import axios from "axios";

const API_URL = "https://gol.digizooom.com/api/v1";

export const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    username,
    password,
  });
  const token = response.data.meta.token;
  const permissions = response.data.meta.permissions || [];
  const role = response.data.meta.role || null;
  
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(response.data.data));
  localStorage.setItem("permissions", JSON.stringify(permissions));
  localStorage.setItem("role", role);
  
  return {
    ...response.data,
    permissions: permissions,
    role: role
  };
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("permissions");
  localStorage.removeItem("role");
  window.location.href = "/login"; // Redirect to login page
};

export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  console.log("isAuthenticated:", !!token);
  return !!token;
};

export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  const permissions = localStorage.getItem("permissions");
  const role = localStorage.getItem("role");
  
  if (!user) return null;
  
  const userData = JSON.parse(user);
  const permissionsData = permissions ? JSON.parse(permissions) : null;
  
  return {
    ...userData,
    permissions: permissionsData,
    role: role
  };
};
