import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động gắn Token & Workspace ID vào mọi request gửi lên BE
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const workspaceId = localStorage.getItem("workspaceId");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (workspaceId) {
      config.headers["x-workspace-id"] = workspaceId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Bắt lỗi tập trung: Hết hạn phiên làm việc (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("workspaceId");
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;