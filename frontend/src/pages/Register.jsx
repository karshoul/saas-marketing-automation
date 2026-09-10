import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { User, Mail, Lock, Building2, ArrowRight } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    workspaceName: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Kiểm tra nhanh phía client theo đúng Zod schema
    if (formData.fullName.trim().length < 3) {
      setError("Họ và tên phải có ít nhất 3 ký tự.");
      return;
    }
    if (formData.workspaceName.trim().length < 3) {
      setError("Tên Workspace phải có ít nhất 3 ký tự.");
      return;
    }
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/;
    if (!pwdRegex.test(formData.password)) {
      setError("Mật khẩu phải từ 8-32 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@$!%*?&).");
      return;
    }

    setLoading(true);

    const payload = {
      fullName: formData.fullName.trim(),
      workspaceName: formData.workspaceName.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password
    };

    try {
      const res = await api.post("/auth/register", payload);
      const token = res.data?.token || res.data?.data?.token;
      if (token) {
        localStorage.setItem("token", token);
      }
      navigate("/dashboard");
    } catch (err) {
      const resData = err.response?.data;
      const msg =
        resData?.errors?.[0]?.message ||
        resData?.details?.[0]?.message ||
        resData?.message ||
        "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] text-[#f8fafc] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#6366f1]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#38bdf8]/10 rounded-full blur-[120px] pointer-events-none" />

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
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Tạo Workspace Mới</h1>
          <p className="text-xs text-[#94a3b8]">Bắt đầu tự động hóa hàng triệu chiến dịch đa kênh</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <span>⚠</span> <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#cbd5e1] uppercase tracking-wider mb-2">Họ & Tên</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                className="w-full bg-[#020617]/80 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#cbd5e1] uppercase tracking-wider mb-2">Tên Workspace</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="workspaceName"
                required
                value={formData.workspaceName}
                onChange={handleChange}
                placeholder="Acme Production"
                className="w-full bg-[#020617]/80 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#cbd5e1] uppercase tracking-wider mb-2">Email Công Việc</label>
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
            <label className="block text-xs font-semibold text-[#cbd5e1] uppercase tracking-wider mb-2">Mật Khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Ví dụ: Verdio@2026"
                className="w-full bg-[#020617]/80 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-[#64748b]">Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&).</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] hover:from-[#4f46e5] hover:to-[#9333ea] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Đang khởi tạo..." : "Tạo Tài Khoản Free"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-[#94a3b8]">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-[#38bdf8] font-semibold hover:underline ml-1">
            Đăng nhập Console
          </Link>
        </div>
      </div>
    </div>
  );
}