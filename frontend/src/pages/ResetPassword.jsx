import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { Lock, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Mã khôi phục không tìm thấy trên liên kết URL.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/;
    if (!pwdRegex.test(password)) {
      setError(
        "Mật khẩu phải từ 8-32 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@$!%*?&)."
      );
      return;
    }

    setLoading(true);

    try {
      await api.post(
        `/auth/reset-password?token=${encodeURIComponent(token)}`,
        {
          token,
          password
        }
      );
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const resData = err.response?.data;
      setError(
        resData?.message || "Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ."
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
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Đặt Lại Mật Khẩu</h1>
          <p className="text-xs text-[#94a3b8]">Thiết lập mật khẩu mới cho tài khoản của bạn</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <span>⚠</span> <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">Mật khẩu đã được cập nhật thành công!</p>
            <p className="text-xs text-[#94a3b8]">
              Đang chuyển hướng về trang đăng nhập sau 3 giây...
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-[#38bdf8] hover:underline"
              >
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#cbd5e1] uppercase tracking-wider mb-2">
                Mật Khẩu Mới
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu mới"
                  className="w-full bg-[#020617]/80 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#cbd5e1] uppercase tracking-wider mb-2">
                Xác Nhận Mật Khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full bg-[#020617]/80 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-[#64748b]">
                Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&).
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] hover:from-[#4f46e5] hover:to-[#9333ea] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : "Xác nhận mật khẩu mới"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}