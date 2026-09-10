import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import api from "../../api/axios";
import {
  LayoutDashboard,
  Users,
  FileCode2,
  Send,
  GitFork,
  Cpu,
  BarChart3,
  Settings,
  ChevronDown,
  Search,
  LogOut,
  X,
  ExternalLink,
  CreditCard,
  ChevronRight,
  Sparkles
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Bàn Điều Khiển", path: "/dashboard", icon: LayoutDashboard },
  { label: "Danh Bạ & Phân Khúc", path: "/contacts", icon: Users },
  { label: "Mẫu Gửi Tin (Templates)", path: "/templates", icon: FileCode2 },
  { label: "Chiến Dịch Gửi", path: "/campaigns", icon: Send },
  { label: "Kịch Bản Tự Động", path: "/automations", icon: GitFork },
  { label: "Gói Cước & Thanh Toán", path: "/billing", icon: CreditCard },
  { label: "Trạm Hàng Đợi (Queue)", path: "/queue-monitor", icon: Cpu, badge: "P(t)" },
  { label: "Báo Cáo & Telemetry", path: "/analytics", icon: BarChart3 }
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(() => {
    return localStorage.getItem("workspaceName") || "VERDIO Workspace";
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // State thông tin Gói & Hạn ngạch (Quota) từ Backend
  const [tenantInfo, setTenantInfo] = useState({
    plan: "FREE",
    emailsSent: 0,
    monthlyLimit: 3000
  });

  // Command Palette (Cmd + K)
  const [cmdOpen, setCmdOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Tải thông tin gói cước thực tế của Tenant
  // Thêm listener vào useEffect lấy tenant quota trong AppLayout.jsx:
  // Trong AppLayout.jsx:
  useEffect(() => {
    const fetchTenantQuota = async () => {
      try {
        const res = await api.get("/tenants/me");
        // Kiểm tra tất cả các trường hợp bọc dữ liệu: res.data.data.tenant, res.data.tenant, hoặc res.data.data
        const t = res.data?.data?.tenant || res.data?.tenant || res.data?.data;
        
        if (t) {
          if (t.name) setWorkspace(t.name);
          
          const activePlan = t.plan || t.subscriptionPlan || "FREE";
          const limit = t.quotas?.monthlyEmailLimit 
            || (activePlan === "PRO" ? 50000 : activePlan === "ENTERPRISE" ? 500000 : 3000);
          
          setTenantInfo({
            plan: activePlan,
            emailsSent: t.usage?.emailsSentThisMonth || 0,
            monthlyLimit: limit
          });
        }
      } catch (err) {
        console.error("Lỗi lấy quota tenant:", err);
      }
    };

    fetchTenantQuota();

    window.addEventListener("tenant_updated", fetchTenantQuota);
    return () => window.removeEventListener("tenant_updated", fetchTenantQuota);
  }, [location.pathname]);

  // Phím tắt Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setCmdOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("workspaceId");
    localStorage.removeItem("workspaceName");
    navigate("/login");
  };

  const filteredNav = NAV_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const usagePercent = Math.min(
    100,
    Math.round((tenantInfo.emailsSent / (tenantInfo.monthlyLimit || 1)) * 100)
  );

  return (
    <div className="min-h-screen bg-[#020617] text-[#f8fafc] flex font-sans antialiased selection:bg-[#38bdf8]/30 selection:text-[#38bdf8]">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 border-r border-white/10 bg-[#060b18]/80 backdrop-blur-2xl flex flex-col justify-between fixed top-0 bottom-0 left-0 z-40">
        <div className="overflow-y-auto">
          {/* Workspace Switcher Card */}
          <div className="p-4 border-b border-white/10 space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all cursor-pointer group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#38bdf8] flex-shrink-0 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] text-sm">
                  {workspace.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white tracking-wide truncate">
                    {workspace}
                  </div>
                  <div className="text-[10px] text-[#38bdf8] font-mono tracking-wider">
                    {tenantInfo.plan} CLUSTER
                  </div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-[#94a3b8] flex-shrink-0 group-hover:text-white transition-colors" />
            </div>

            {/* Quick Upgrade Widget */}
            <Link
              to="/billing"
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-[#6366f1]/15 to-[#38bdf8]/15 border border-[#38bdf8]/30 hover:border-[#38bdf8] transition-all text-xs group shadow-[0_0_15px_rgba(56,189,248,0.1)]"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#38bdf8] animate-pulse" />
                <span className="text-white font-semibold text-[11px] group-hover:text-[#38bdf8] transition-colors">
                  {tenantInfo.plan === "ENTERPRISE" ? "Quản Lý Gói Cước" : "Nâng Cấp Gói Cước"}
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#64748b] group-hover:text-[#38bdf8] group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Quota Usage Bar */}
            <div className="px-1 pt-1">
              <div className="flex justify-between text-[10px] font-mono text-[#94a3b8] mb-1">
                <span>Hạn Mức Email</span>
                <span>{tenantInfo.emailsSent.toLocaleString()} / {tenantInfo.monthlyLimit.toLocaleString()}</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#38bdf8] transition-all duration-500"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono tracking-widest text-[#64748b] uppercase">
              Hệ Thống Phân Tán
            </div>
            {NAV_ITEMS.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    active
                      ? "bg-[#6366f1]/15 text-[#38bdf8] border border-[#38bdf8]/30 shadow-[0_0_20px_rgba(56,189,248,0.15)]"
                      : "text-[#94a3b8] hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        active ? "text-[#38bdf8]" : "text-[#64748b] group-hover:text-white"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#6366f1]/30 text-[#818cf8] border border-[#6366f1]/50">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer & User Info */}
        <div className="p-3 border-t border-white/10 space-y-2">
          {user && (
            <div className="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#6366f1]/20 border border-[#6366f1]/40 flex items-center justify-center text-[11px] font-bold text-[#38bdf8]">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-white truncate">
                  {user.fullName || "Người dùng"}
                </div>
                <div className="text-[10px] text-[#64748b] truncate">{user.email}</div>
              </div>
            </div>
          )}

          <Link
            to="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#94a3b8] hover:text-white hover:bg-white/[0.04] transition-all"
          >
            <Settings className="w-4 h-4 text-[#64748b]" />
            <span>Cấu Hình Workspace</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-all group"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4" />
              <span>Đăng Xuất</span>
            </div>
            <span className="text-[10px] text-red-400/60 font-mono">JWT</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN VIEWPORT ================= */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-white/10 bg-[#020617]/70 backdrop-blur-2xl px-8 flex items-center justify-between sticky top-0 z-30">
          {/* Quick Search Button */}
          <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 text-xs text-[#64748b] hover:text-[#94a3b8] transition-all w-80 justify-between"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#64748b]" />
              <span>Tìm chiến dịch, job ID, danh bạ...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-[#cbd5e1]">
              ⌘K
            </kbd>
          </button>

          {/* Engine Realtime Pulse */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" />
              BULLMQ CLUSTER: ACTIVE (C=14)
            </div>

            <div className="h-4 w-px bg-white/10" />

            <Link
              to="/"
              target="_blank"
              className="text-xs text-[#94a3b8] hover:text-white flex items-center gap-1.5 transition-colors"
              title="Xem trang Landing Page 3D"
            >
              <span>Xem Web 3D</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Page Content Render Outlet */}
        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* ================= COMMAND PALETTE (CMD+K) ================= */}
      {cmdOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-[#010409]/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[#0b1329] border border-[#38bdf8]/30 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <Search className="w-5 h-5 text-[#38bdf8]" />
              <input
                type="text"
                autoFocus
                placeholder="Gõ để tìm nhanh trang hoặc tác vụ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-white text-sm focus:outline-none w-full placeholder-[#475569]"
              />
              <button
                onClick={() => setCmdOpen(false)}
                className="p-1 rounded-lg text-[#64748b] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto divide-y divide-white/5">
              <div className="py-1">
                <div className="px-3 py-1.5 text-[10px] font-mono text-[#64748b] uppercase tracking-wider">
                  Điều Hướng Nhanh
                </div>
                {filteredNav.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setCmdOpen(false);
                    }}
                    className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl text-xs hover:bg-white/[0.06] text-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-[#38bdf8]" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#64748b] group-hover:text-white">
                      Đi đến ↵
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}