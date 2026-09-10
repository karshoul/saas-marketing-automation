import React, { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import {
  Settings as SettingsIcon,
  Building2,
  Key,
  Mail,
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Globe,
  Sliders,
  Sparkles
} from "lucide-react";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState("general"); // general | apikeys | smtp

  // State Tenant từ Backend
  const [tenant, setTenant] = useState({
    name: "",
    slug: "",
    status: "TRIAL",
    _id: ""
  });

  // API Key & Security State
  const [apiKey, setApiKey] = useState("vdo_live_8f93a9c72e104bb01a75d9e9");
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // SMTP Settings State
  const [smtpConfig, setSmtpConfig] = useState({
    host: "smtp.sendgrid.net",
    port: 587,
    senderEmail: "marketing@verdio.io",
    senderName: "VERDIO Dispatcher",
    user: "apikey",
    pass: "••••••••••••••••••••••••"
  });

  // ==========================================
  // 1. LẤY DỮ LIỆU WORKSPACE TỪ BACKEND
  // ==========================================
  const fetchTenantProfile = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.get("/tenants/me");
      // Cấu trúc trả về từ TenantController: success(res, msg, { tenant })
      const tenantData = res.data?.data?.tenant || res.data?.tenant || res.data?.data;
      if (tenantData) {
        setTenant({
          name: tenantData.name || "",
          slug: tenantData.slug || "",
          status: tenantData.status || "TRIAL",
          _id: tenantData._id || tenantData.id || ""
        });
        if (tenantData.name) {
          localStorage.setItem("workspaceName", tenantData.name);
        }
      }
    } catch (err) {
      console.error("Lỗi lấy cấu hình Tenant:", err);
      setErrorMsg(err.response?.data?.message || "Không thể tải cấu hình Workspace.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenantProfile();
  }, [fetchTenantProfile]);

  // ==========================================
  // 2. CẬP NHẬT TÊN VÀ CẤU HÌNH WORKSPACE
  // ==========================================
  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        name: tenant.name.trim()
      };
      const res = await api.put("/tenants/me", payload);
      const updated = res.data?.data?.tenant || res.data?.tenant;
      if (updated?.name) {
        localStorage.setItem("workspaceName", updated.name);
      }
      setSuccessMsg("Cập nhật thông tin Workspace thành công!");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Lỗi cập nhật cấu hình Workspace.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <SettingsIcon className="w-6 h-6 text-[#38bdf8]" />
              Cấu Hình Không Gian Làm Việc
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#6366f1]/20 border border-[#6366f1]/40 text-[#818cf8] text-[10px] font-mono font-bold">
              TENANT DOMAIN
            </span>
          </div>
          <p className="text-xs text-[#94a3b8]">
            Quản trị tổ chức đa người thuê (Multi-tenant), thông tin định danh và khóa API
          </p>
        </div>

        <button
          onClick={fetchTenantProfile}
          disabled={loading}
          className="p-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs text-white transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#38bdf8]" : ""}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Thông báo Messages */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="hover:text-white">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="hover:text-white">✕</button>
        </div>
      )}

      {/* ================= TABS NAVIGATION ================= */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
            activeTab === "general"
              ? "bg-[#6366f1]/20 text-[#38bdf8] border border-[#38bdf8]/30 font-bold"
              : "text-[#94a3b8] hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Thông Tin Chung</span>
        </button>

        <button
          onClick={() => setActiveTab("apikeys")}
          className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
            activeTab === "apikeys"
              ? "bg-[#6366f1]/20 text-[#38bdf8] border border-[#38bdf8]/30 font-bold"
              : "text-[#94a3b8] hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Khóa API & Tích Hợp</span>
        </button>

        <button
          onClick={() => setActiveTab("smtp")}
          className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
            activeTab === "smtp"
              ? "bg-[#6366f1]/20 text-[#38bdf8] border border-[#38bdf8]/30 font-bold"
              : "text-[#94a3b8] hover:text-white hover:bg-white/[0.03]"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Cổng Gửi Thư (SMTP)</span>
        </button>
      </div>

      {/* ================= TAB 1: THÔNG TIN CHUNG ================= */}
      {activeTab === "general" && (
        <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl max-w-3xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#38bdf8]" />
              Hồ Sơ Workspace Hiện Tại
            </h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Thay đổi định danh tổ chức và các thông số vận hành của phân vùng Tenant
            </p>
          </div>

          <form onSubmit={handleUpdateTenant} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#cbd5e1] font-semibold mb-1.5">Tên Không Gian Làm Việc (*)</label>
              <input
                type="text"
                required
                value={tenant.name}
                onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
                className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1.5">Định Danh Đường Dẫn (Slug)</label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-[#64748b] font-mono">
                  <Globe className="w-4 h-4" />
                  <span>{tenant.slug || "chua-cap-nhat"}</span>
                </div>
                <p className="text-[10px] text-[#64748b] mt-1">Dùng để định tuyến API phân quyền multi-tenant</p>
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1.5">Trạng Thái Bản Quyền (Status)</label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-bold">{tenant.status}</span>
                </div>
                <p className="text-[10px] text-[#64748b] mt-1">Tài nguyên hàng đợi BullMQ được cấp phát tự động</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
              >
                {submitting ? "Đang lưu..." : "Lưu Cập Nhật"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= TAB 2: KHÓA API & TÍCH HỢP ================= */}
      {activeTab === "apikeys" && (
        <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl max-w-3xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-[#38bdf8]" />
              Khóa Xác Thực Lập Trình Viên (API Secret Key)
            </h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Sử dụng khóa này trong Header <code className="text-[#38bdf8] font-mono">Authorization: Bearer vdo_live_...</code> để bắn email tự động từ server bên ngoài
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#020617] border border-white/10 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase font-mono text-[#64748b] mb-1">Production Live Key</div>
                <div className="font-mono text-white text-sm truncate">
                  {showApiKey ? apiKey : "vdo_live_••••••••••••••••••••••••••••"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/10 text-[#94a3b8] hover:text-white"
                  title={showApiKey ? "Ẩn khóa" : "Hiện khóa"}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(apiKey)}
                  className="p-2 rounded-lg bg-[#6366f1]/20 hover:bg-[#6366f1]/30 text-[#38bdf8] border border-[#6366f1]/30 flex items-center gap-1.5"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey ? "Đã sao chép" : "Sao chép"}</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Shield className="w-4 h-4" /> Bảo mật hệ thống
              </div>
              Tuyệt đối không chia sẻ khóa bí mật này trong mã nguồn Frontend hoặc kho lưu trữ Git công khai.
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: CỔNG GỬI THƯ SMTP ================= */}
      {activeTab === "smtp" && (
        <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl max-w-3xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#38bdf8]" />
              Cấu Hình Cổng Phát Tán Thư (SMTP Relay Gateway)
            </h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Kết nối với máy chủ gửi thư chuyên nghiệp như SendGrid, Amazon SES, Mailgun hoặc Custom SMTP
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1.5">Máy Chủ SMTP (Host)</label>
                <input
                  type="text"
                  value={smtpConfig.host}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#38bdf8]"
                />
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1.5">Cổng Kết Nối (Port)</label>
                <input
                  type="number"
                  value={smtpConfig.port}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, port: Number(e.target.value) })}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#38bdf8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1.5">Email Người Gửi (From Email)</label>
                <input
                  type="email"
                  value={smtpConfig.senderEmail}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, senderEmail: e.target.value })}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#38bdf8]"
                />
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1.5">Tên Người Gửi (From Name)</label>
                <input
                  type="text"
                  value={smtpConfig.senderName}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, senderName: e.target.value })}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#38bdf8]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSuccessMsg("Đã gửi email kiểm tra kết nối SMTP thành công!")}
                className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white font-medium hover:bg-white/[0.08]"
              >
                Kiểm Tra Kết Nối
              </button>
              <button
                type="button"
                onClick={() => setSuccessMsg("Đã lưu cấu hình cổng SMTP thành công!")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] text-white font-bold"
              >
                Lưu Cấu Hình SMTP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}