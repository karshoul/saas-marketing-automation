import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("👉 Đang bấm nút gửi mail reset cho:", email);
    setError("");
    setLoading(true);

    try {
      // ĐẢM BẢO ENDPOINT ĐÚNG VỚI BASE URL:
      // Nếu baseURL của axios instance đã có '/api' thì gọi '/auth/forgot-password'
      // Nếu baseURL chưa có '/api' thì phải gọi '/api/auth/forgot-password'
      const response = await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase()
      });
      
      console.log("✅ Kết quả gửi mail:", response.data);
      setIsSubmitted(true);
    } catch (err) {
      console.error("❌ Lỗi gửi mail:", err);
      const resData = err.response?.data;
      setError(
        resData?.message || "Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau."
      );
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
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Khôi Phục Mật Khẩu</h1>
          <p className="text-xs text-[#94a3b8]">
            Nhập email tài khoản để nhận đường dẫn thiết lập mật khẩu mới
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <span>⚠</span> <span>{error}</span>
          </div>
        )}

        {isSubmitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm text-white">
              Đường dẫn khôi phục đã được gửi tới <br />
              <span className="text-[#38bdf8] font-semibold">{email}</span>
            </p>
            <p className="text-xs text-[#94a3b8]">
              Vui lòng kiểm tra hộp thư đến (hoặc hòm thư rác/Spam) và làm theo hướng dẫn.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#38bdf8] hover:underline"
              >
                <ArrowLeft className="w-4 h-4" /> Quay lại trang đăng nhập
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#cbd5e1] uppercase tracking-wider mb-2">
                Email Tài Khoản
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@verdio.io"
                  className="w-full bg-[#020617]/80 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] hover:from-[#4f46e5] hover:to-[#9333ea] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Gửi liên kết xác nhận"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

            <div className="mt-6 pt-4 border-t border-white/5 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Trở về đăng nhập
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}