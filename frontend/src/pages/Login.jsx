import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Lock, Mail, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
  if (e && e.preventDefault) e.preventDefault();
  setError("");
  setLoading(true);

  console.log("🚀 [1] Đang gửi payload đăng nhập:", {
    email: formData.email.trim().toLowerCase(),
    password: formData.password
  });

  try {
    const res = await api.post("/auth/login", {
      email: formData.email.trim().toLowerCase(),
      password: formData.password
    });

    console.log("✅ [2] Response từ Backend:", res.data);

    // Quét tìm token ở mọi vị trí có thể có
    const token = 
      res.data?.token || 
      res.data?.accessToken || 
      res.data?.data?.token || 
      res.data?.data?.accessToken ||
      res.data?.result?.token;

    console.log("🔑 [3] Token trích xuất được:", token);

    if (!token) {
      setError("Đăng nhập thành công nhưng Backend không trả về token hợp lệ! Hãy kiểm tra console F12.");
      setLoading(false);
      return;
    }

    // 1. Lưu token chuẩn
    localStorage.setItem("token", token);

    // 2. Lưu User & Workspace
    const userData = res.data?.user || res.data?.data?.user || res.data?.data;
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    }

    const ws = res.data?.workspace || res.data?.data?.workspace || userData?.workspaces?.[0];
    if (ws) {
      localStorage.setItem("workspaceId", ws._id || ws.id);
      localStorage.setItem("workspaceName", ws.name || ws.workspaceName || "VERDIO Workspace");
    } else {
      localStorage.setItem("workspaceName", "VERDIO Workspace");
    }

    // 3. Phân luồng điều hướng theo Role chuẩn xác
    const role = (userData?.role || "").toUpperCase();
    const email = (userData?.email || formData.email).toLowerCase();

    const isSuperAdmin =
      role === "SUPERADMIN" ||
      email === "khuongnguyenbevis@gmail.com" ||
      email.endsWith("@verdio.io");

    console.log("🚀 [4] Phân quyền đăng nhập:", { role, email, isSuperAdmin });

    if (isSuperAdmin) {
      console.log("👑 Điều hướng về SuperAdmin Portal...");
      window.location.href = "/admin/tenants";
    } else {
      console.log("🏢 Điều hướng về Tenant Dashboard...");
      window.location.href = "/dashboard";
    }

  } catch (err) {
    console.error("💥 [LỖI ĐĂNG NHẬP]:", err);
    console.error("Chi tiết response lỗi:", err.response?.data);

    const resData = err.response?.data;
    const msg =
      resData?.message ||
      resData?.error ||
      resData?.errors?.[0]?.message ||
      (err.message === "Network Error" 
        ? "Không thể kết nối đến Backend (Kiểm tra backend đã chạy ở port 5000 chưa, hoặc lỗi CORS)." 
        : "Email hoặc mật khẩu không chính xác.");

    setError(msg);
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
              <label className="text-xs font-semibold text-[#cbd5e1] uppercase tracking-wider">Mật Khẩu</label>
              <a href="#" className="text-xs text-[#38bdf8] hover:underline">Quên mật khẩu?</a>
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