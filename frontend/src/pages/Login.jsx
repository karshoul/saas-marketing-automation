import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Lock, Mail, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Hàm xử lý lưu session & phân luồng điều hướng tập trung cho cả Login thường & Google OAuth
  const handleAuthSuccess = (resData) => {
    const token =
      resData?.accessToken ||
      resData?.token ||
      resData?.data?.accessToken ||
      resData?.data?.token;

    if (!token) {
      setError("Đăng nhập thành công nhưng hệ thống không trả về Token hợp lệ.");
      return;
    }

    localStorage.setItem("token", token);

    const userData = resData?.user || resData?.data?.user || resData?.data;
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    }

    // 🔥 Xử lý Workspace thông minh: Ưu tiên danh sách workspaces, nếu không có lấy tenant đơn lẻ
    const workspaces = resData?.workspaces || resData?.data?.workspaces || userData?.workspaces || [];
    const ownedWorkspace = workspaces.find(w => w.role === "OWNER" || w.isOwner);
    const primaryTenant = resData?.tenant || resData?.data?.tenant || resData?.workspace || resData?.data?.workspace;
    
    const defaultWs = ownedWorkspace || primaryTenant || workspaces[0];

    if (defaultWs) {
      localStorage.setItem("workspaceId", defaultWs._id || defaultWs.id);
      localStorage.setItem("workspaceName", defaultWs.name || defaultWs.workspaceName || "VERDIO Workspace");
    } else {
      // Nếu không có thông tin workspace cụ thể, xóa sạch ID cũ để Backend tự trỏ về workspace gốc của Owner
      localStorage.removeItem("workspaceId");
      localStorage.setItem("workspaceName", "VERDIO Workspace");
    }

    // Xóa sạch bộ nhớ tạm chuyển workspace cũ nếu có để tránh bị lệch quyền
    localStorage.removeItem("activeWorkspaceOverride");

    // Lấy cờ isSuperAdmin trực tiếp từ User model của Backend
    const isSuperAdmin = Boolean(userData?.isSuperAdmin);

    // Điều hướng phân quyền 3 cấp / Cổng quản trị
    if (isSuperAdmin) {
      window.location.href = "/admin/tenants";
    } else {
      window.location.href = "/dashboard";
    }
  };

  // 1. Đăng nhập Email + Mật khẩu thông thường
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      handleAuthSuccess(res.data);
    } catch (err) {
      console.error("💥 [LỖI ĐĂNG NHẬP]:", err);
      const resData = err.response?.data;
      const msg =
        resData?.message ||
        resData?.error ||
        resData?.errors?.[0]?.message ||
        (err.message === "Network Error"
          ? "Không thể kết nối đến Backend (Kiểm tra server hoặc CORS)."
          : "Email hoặc mật khẩu không chính xác.");

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Đăng nhập qua Google OAuth
  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/google", {
        credential: credentialResponse.credential
      });

      handleAuthSuccess(res.data);
    } catch (err) {
      console.error("💥 [LỖI GOOGLE AUTH]:", err);
      const resData = err.response?.data;
      setError(resData?.message || "Đăng nhập Google thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] text-[#f8fafc] flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#6366f1]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#38bdf8]/10 rounded-full blur-[120px] pointer-events-none" />

      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-9 h-9 rounded-xl bg-[#6366f1]/20 border border-[#6366f1]/40 flex items-center justify-center text-[#38bdf8] font-mono font-bold text-lg shadow-[0_0_20px_rgba(99,102,241,0.3)] group-hover:scale-105 transition-transform">
          V
        </div>
        <span className="text-xl font-bold tracking-widest text-white">
          VERDIO <span className="text-[#38bdf8] font-normal text-xs ml-1">// CORE</span>
        </span>
      </Link>

      <div className="w-full max-w-md bg-[#0f172a]/70 border border-white/10 rounded-2xl p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative z-10">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Đăng Nhập Console</h1>
          <p className="text-xs text-[#94a3b8]">Truy cập trung tâm điều phối và hàng đợi chiến dịch</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <span>⚠</span> <span>{error}</span>
          </div>
        )}

        {/* Nút Đăng nhập Google */}
        <div className="mb-5 flex justify-center w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Đăng nhập Google bị hủy hoặc thất bại.")}
            theme="filled_black"
            shape="pill"
            width="384px"
            text="signin_with"
          />
        </div>

        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#0f172a] px-3 text-[11px] text-[#64748b] uppercase tracking-wider absolute">
            hoặc với email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#cbd5e1] uppercase tracking-wider mb-2">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="developer@verdio.io"
                className="w-full bg-[#020617]/80 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-[#cbd5e1] uppercase tracking-wider">
                MẬT KHẨU
              </label>
              <Link 
                to="/forgot-password" 
                className="text-xs text-[#38bdf8] hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-[#020617]/80 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] hover:from-[#4f46e5] hover:to-[#9333ea] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Đang xác thực..." : "Đăng Nhập"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-[#94a3b8]">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-[#38bdf8] font-semibold hover:underline ml-1">
            Đăng ký tài khoản
          </Link>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-4 text-xs text-[#64748b]">
        <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> 256-bit SSL</span>
        <span>•</span>
        <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> BullMQ Adaptive Concurrency</span>
      </div>
    </div>
  );
}