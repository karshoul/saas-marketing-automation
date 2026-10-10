import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động gắn Token & Workspace ID vào mọi request gửi lên BE kèm log theo dõi
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const workspaceId = localStorage.getItem("workspaceId");

    console.log(`🌐 [AXIOS REQUEST] ---> ${config.method.toUpperCase()} ${config.url}`);
    console.log(`   - Gửi kèm Header x-workspace-id:`, workspaceId);

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
      console.warn("⚠️ [AXIOS 401]: Phiên làm việc hết hạn, đang xóa bộ nhớ đệm...");
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