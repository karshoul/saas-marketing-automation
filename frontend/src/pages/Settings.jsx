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
  ShieldAlert
} from "lucide-react";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState("general");

  // Kiểm tra quyền (Chỉ OWNER và ADMIN mới được vào cấu hình)
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = (user?.role || "MEMBER").toUpperCase();

  const [tenant, setTenant] = useState({
    name: "",
    slug: "",
    status: "TRIAL",
    _id: ""
  });

  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const [smtpConfig, setSmtpConfig] = useState({
    host: "",
    port: 465,
    user: "",
    pass: "",
    senderEmail: ""
  });

  // Tải thông tin Tenant & API Key thực tế từ Backend
  const fetchTenantProfile = useCallback(async () => {
    if (userRole === "MEMBER") return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.get("/tenants/me");
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
        if (tenantData.apiKey) {
          setApiKey(tenantData.apiKey);
        }
        if (tenantData.smtpConfig) {
          setSmtpConfig({
            host: tenantData.smtpConfig.host || "",
            port: tenantData.smtpConfig.port || 465,
            user: tenantData.smtpConfig.user || "",
            pass: tenantData.smtpConfig.pass ? "••••••••••••" : "",
            senderEmail: tenantData.smtpConfig.senderEmail || ""
          });
        }
      }
    } catch (err) {
      console.error("Lỗi lấy cấu hình Tenant:", err);
      setErrorMsg(err.response?.data?.message || "Không thể tải cấu hình Workspace.");
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchTenantProfile();
  }, [fetchTenantProfile]);

  // Chặn truy cập nếu là MEMBER
  if (userRole === "MEMBER") {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 rounded-3xl bg-[#0b1329]/90 border border-red-500/30 text-center space-y-4 shadow-[0_0_50px_rgba(239,68,68,0.15)] font-sans">
        <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Truy Cập Bị Từ Chối (403 Forbidden)</h2>
        <p className="text-xs text-[#94a3b8] leading-relaxed">
          Tài khoản của bạn giữ vai trò <span className="font-mono text-white font-bold">(MEMBER)</span>. 
          Khu vực cấu hình hệ thống chỉ dành cho <span className="text-amber-400 font-bold">Quản trị viên (ADMIN)</span> và <span className="text-amber-400 font-bold">Chủ sở hữu (OWNER)</span>.
        </p>
      </div>
    );
  }

  // 1. Cập nhật thông tin chung (Tên Workspace)
  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = { name: tenant.name.trim() };
      const res = await api.put("/tenants/me", payload);
      const updated = res.data?.data?.tenant || res.data?.tenant || res.data?.data;
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

  // 2. Tạo mới / Xoay vòng Khóa API (Rotate API Key)
  const handleRegenerateApiKey = async () => {
    if (!window.confirm("Bạn có chắc muốn tạo lại Khóa API mới? Khóa cũ sẽ bị vô hiệu hóa ngay lập tức.")) return;
    try {
      const res = await api.post("/tenants/regenerate-api-key");
      const newKey = res.data?.data?.apiKey || res.data?.apiKey;
      if (newKey) {
        setApiKey(newKey);
        setSuccessMsg("Đã tạo mới Khóa API thành công!");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Không thể tạo mới khóa API.");
    }
  };

  // 3. Cập nhật cấu hình SMTP riêng cho Workspace
  const handleUpdateSmtp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await api.put("/tenants/smtp", smtpConfig);
      setSuccessMsg("Cập nhật cấu hình cổng gửi thư (SMTP) thành công!");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Lỗi cập nhật cấu hình SMTP.");
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
    <div className="space-y-8 animate-in fade-in duration-300 font-sans text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
              <SettingsIcon className="w-6 h-6 text-[#38bdf8]" />
              Cấu Hình Không Gian Làm Việc
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#6366f1]/20 border border-[#6366f1]/40 text-[#818cf8] text-[10px] font-mono font-bold">
              TENANT DOMAIN
            </span>
          </div>
          <p className="text-xs text-[#94a3b8]">
            Quản trị tổ chức đa người thuê (Multi-tenant), thông tin định danh và khóa API hệ thống
          </p>
        </div>

        <button onClick={fetchTenantProfile} disabled={loading} className="p-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs text-white transition-all flex items-center gap-2 cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#38bdf8]" : ""}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {errorMsg && <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between"><span>{errorMsg}</span><button onClick={() => setErrorMsg("")}>✕</button></div>}
      {successMsg && <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between"><span>{successMsg}</span><button onClick={() => setSuccessMsg("")}>✕</button></div>}

      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button onClick={() => setActiveTab("general")} className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${activeTab === "general" ? "bg-[#6366f1]/20 text-[#38bdf8] border border-[#38bdf8]/30 font-bold" : "text-[#94a3b8] hover:text-white"}`}>
          <Building2 className="w-4 h-4" /><span>Thông Tin Chung</span>
        </button>
        <button onClick={() => setActiveTab("apikeys")} className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${activeTab === "apikeys" ? "bg-[#6366f1]/20 text-[#38bdf8] border border-[#38bdf8]/30 font-bold" : "text-[#94a3b8] hover:text-white"}`}>
          <Key className="w-4 h-4" /><span>Khóa API & Tích Hợp</span>
        </button>
        <button onClick={() => setActiveTab("smtp")} className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${activeTab === "smtp" ? "bg-[#6366f1]/20 text-[#38bdf8] border border-[#38bdf8]/30 font-bold" : "text-[#94a3b8] hover:text-white"}`}>
          <Mail className="w-4 h-4" /><span>Cổng Gửi Thư (SMTP)</span>
        </button>
      </div>

      {/* TAB 1: THÔNG TIN CHUNG */}
      {activeTab === "general" && (
        <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl max-w-3xl space-y-6">
          <form onSubmit={handleUpdateTenant} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#cbd5e1] font-semibold mb-1.5">Tên Không Gian Làm Việc (*)</label>
              <input type="text" required value={tenant.name} onChange={(e) => setTenant({ ...tenant, name: e.target.value })} className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#38bdf8]" />
            </div>
            <div>
              <label className="block text-[#cbd5e1] font-semibold mb-1.5">Mã Slug Định Danh (Read-only)</label>
              <input type="text" disabled value={tenant.slug} className="w-full bg-[#020617]/50 border border-white/5 rounded-xl px-3.5 py-2.5 text-[#64748b] font-mono cursor-not-allowed" />
            </div>
            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] text-white text-xs font-bold uppercase tracking-wider cursor-pointer hover:opacity-90">
                {submitting ? "Đang lưu..." : "Lưu Cập Nhật"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: KHÓA API */}
      {activeTab === "apikeys" && (
        <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl max-w-3xl space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold">Production Live API Key</h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">Sử dụng khóa này để xác thực các yêu cầu gọi API bên ngoài từ ứng dụng của bạn.</p>
            </div>
            <button onClick={handleRegenerateApiKey} className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all cursor-pointer">
              🔄 Tạo Mới Khóa
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#020617] border border-white/10 flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0 flex-1">
              <div className="font-mono text-white text-sm truncate">{showApiKey ? (apiKey || "Chưa khởi tạo khóa") : "vdo_live_••••••••••••••••••••••••••••"}</div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="p-2 rounded-lg bg-white/[0.05] text-[#94a3b8] hover:text-white cursor-pointer">{showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              <button type="button" onClick={() => copyToClipboard(apiKey)} className="p-2 rounded-lg bg-[#6366f1]/20 text-[#38bdf8] border border-[#6366f1]/30 flex items-center gap-1.5 cursor-pointer">{copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}<span>{copiedKey ? "Đã sao chép" : "Sao chép"}</span></button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CỔNG GỬI THƯ SMTP */}
      {activeTab === "smtp" && (
        <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl max-w-3xl space-y-6">
          <div>
            <h2 className="text-sm font-bold">Cấu Hình SMTP Riêng Cho Workspace</h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">Thiết lập máy chủ thư tín để gửi email thông qua hạ tầng của riêng doanh nghiệp bạn.</p>
          </div>

          <form onSubmit={handleUpdateSmtp} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[#cbd5e1] font-semibold mb-1.5">Máy Chủ SMTP (Host)</label>
                <input type="text" placeholder="smtp.gmail.com" value={smtpConfig.host} onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })} className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#38bdf8]" />
              </div>
              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1.5">Cổng (Port)</label>
                <input type="number" placeholder="465" value={smtpConfig.port} onChange={(e) => setSmtpConfig({ ...smtpConfig, port: Number(e.target.value) })} className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#38bdf8]" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1.5">Tài Khoản Đăng Nhập (User)</label>
                <input type="text" placeholder="username@gmail.com" value={smtpConfig.user} onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })} className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#38bdf8]" />
              </div>
              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1.5">Mật Khẩu / App Password</label>
                <input type="password" placeholder="••••••••••••" value={smtpConfig.pass} onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })} className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#38bdf8]" />
              </div>
            </div>

            <div>
              <label className="block text-[#cbd5e1] font-semibold mb-1.5">Email Người Gửi Mặc Định (Sender Email)</label>
              <input type="email" placeholder="no-reply@company.com" value={smtpConfig.senderEmail} onChange={(e) => setSmtpConfig({ ...smtpConfig, senderEmail: e.target.value })} className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#38bdf8]" />
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] text-white text-xs font-bold uppercase tracking-wider cursor-pointer hover:opacity-90">
                {submitting ? "Đang lưu..." : "Lưu Cấu Hình SMTP"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}