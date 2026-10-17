import React, { useState, useEffect, useCallback, useRef } from "react";
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
  CreditCard,
  ChevronRight,
  Sparkles,
  Building2,
  Bell,
  Check,
  ShieldAlert
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Bàn Điều Khiển", path: "/dashboard", icon: LayoutDashboard, roles: ["OWNER", "ADMIN", "MEMBER"] },
  { label: "Danh Bạ & Phân Khúc", path: "/contacts", icon: Users, roles: ["OWNER", "ADMIN", "MEMBER"] },
  { label: "Mẫu Gửi Tin (Templates)", path: "/templates", icon: FileCode2, roles: ["OWNER", "ADMIN", "MEMBER"] },
  { label: "Chiến Dịch Gửi", path: "/campaigns", icon: Send, roles: ["OWNER", "ADMIN", "MEMBER"] },
  { label: "Kịch Bản Tự Động", path: "/automations", icon: GitFork, roles: ["OWNER", "ADMIN", "MEMBER"] },
  { label: "Gói Cước & Thanh Toán", path: "/billing", icon: CreditCard, roles: ["OWNER"] },
  // { label: "Trạm Hàng Đợi (Queue)", path: "/queue-monitor", icon: Cpu, badge: "P(t)", roles: ["OWNER", "ADMIN", "MEMBER"] },
  { label: "Báo Cáo & Telemetry", path: "/analytics", icon: BarChart3, roles: ["OWNER", "ADMIN", "MEMBER"] },
  { label: "Quản Lý Thành Viên", path: "/members", icon: Users, roles: ["OWNER", "ADMIN", "MEMBER"] },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [workspace, setWorkspace] = useState(() => {
    return localStorage.getItem("workspaceName") || "VERDIO Workspace";
  });

  const [currentWorkspaceId, setCurrentWorkspaceId] = useState(() => {
    return localStorage.getItem("workspaceId") || "";
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [userRole, setUserRole] = useState(() => {
    return (user?.role || "MEMBER").toUpperCase();
  });

  const [tenantInfo, setTenantInfo] = useState({
    plan: "FREE",
    emailsSent: 0,
    monthlyLimit: 3000
  });

  // State danh sách các Workspace tham gia & Dropdown Switcher
  const [myWorkspaces, setMyWorkspaces] = useState([]);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);

  // Command Palette (Cmd + K)
  const [cmdOpen, setCmdOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Notification / Invitations State (Cái chuông)
  const [invitations, setInvitations] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // 1. Tải danh sách tất cả các Workspace mà User đang tham gia
  const fetchMyWorkspaces = useCallback(async () => {
    try {
      const res = await api.get("/tenants/my-workspaces");
      const list = res.data?.data?.workspaces || res.data?.workspaces || [];
      setMyWorkspaces(list);
    } catch (err) {
      console.error("Lỗi tải danh sách Workspace:", err);
    }
  }, []);

  // 2. Tải danh sách lời mời chờ xác nhận
  const fetchInvitations = useCallback(async () => {
    try {
      const res = await api.get("/memberships/invitations/pending");
      setInvitations(res.data?.data || res.data || []);
    } catch (err) {
      if (err.response?.status !== 429) {
        console.error("Lỗi tải lời mời:", err);
      }
    }
  }, []);

  // 3. Lấy thông tin Quota & Role thực tế của Workspace hiện tại
  const fetchTenantQuota = useCallback(async () => {
    try {
      const res = await api.get("/tenants/me");
      const responseData = res.data?.data || res.data;
      const t = responseData.tenant || responseData;
      const actualRole = responseData.role || t?.role;

      if (t) {
        if (t.name) {
          setWorkspace(t.name);
          localStorage.setItem("workspaceName", t.name);
          const tId = t.id || t._id;
          if (tId) {
            setCurrentWorkspaceId(tId.toString());
            localStorage.setItem("workspaceId", tId.toString());
          }
        }
        
        const activePlan = t.plan || t.subscriptionPlan || "FREE";
        const limit = t.quotas?.monthlyEmailLimit 
          || (activePlan === "PRO" ? 50000 : activePlan === "ENTERPRISE" ? 500000 : 3000);
        
        setTenantInfo({
          plan: activePlan,
          emailsSent: t.usage?.emailsSentThisMonth || 0,
          monthlyLimit: limit
        });

        if (actualRole) {
          const upperRole = actualRole.toUpperCase();
          setUserRole(upperRole);
          const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
          currentUser.role = upperRole;
          localStorage.setItem("user", JSON.stringify(currentUser));
        }
      }
    } catch (err) {
      if (err.response?.status !== 429) {
        console.error("Lỗi lấy quota tenant:", err);
      }
    }
  }, []);

  useEffect(() => {
    fetchTenantQuota();
    fetchInvitations();
    fetchMyWorkspaces();

    const handleTenantUpdate = () => {
      fetchTenantQuota();
      fetchMyWorkspaces();
    };

    window.addEventListener("tenant_updated", handleTenantUpdate);
    return () => window.removeEventListener("tenant_updated", handleTenantUpdate);
  }, [fetchTenantQuota, fetchInvitations, fetchMyWorkspaces]);

  // Click ra ngoài tự đóng Dropdown Workspace
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowWorkspaceDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Chuyển đổi sang Workspace khác
  const handleSwitchWorkspace = (ws) => {
    const targetId = (ws.tenantId?._id || ws.tenantId || ws.id || ws._id).toString();
    const targetName = ws.name || ws.workspaceName || "Workspace";

    if (targetId === currentWorkspaceId) {
      setShowWorkspaceDropdown(false);
      return;
    }

    localStorage.setItem("workspaceId", targetId);
    localStorage.setItem("workspaceName", targetName);
    setShowWorkspaceDropdown(false);

    // Reload trang để toàn bộ ứng dụng cập nhật dữ liệu của Workspace mới
    window.location.reload();
  };

  // Phản hồi lời mời (Chấp nhận / Từ chối)
  const handleRespondInvitation = async (membershipId, action) => {
    try {
      await api.post(`/memberships/invitations/${membershipId}/respond`, { action });
      fetchInvitations();
      fetchMyWorkspaces();
      if (action === "ACCEPT") {
        window.location.reload();
      }
    } catch (err) {
      // Fallback nếu route là PATCH
      try {
        await api.patch(`/memberships/invitations/${membershipId}/respond`, { action });
        fetchInvitations();
        fetchMyWorkspaces();
        if (action === "ACCEPT") window.location.reload();
      } catch (innerErr) {
        alert(innerErr.response?.data?.message || "Không thể xử lý lời mời.");
      }
    }
  };

  // Phím tắt Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const filteredNav = NAV_ITEMS.filter((item) => {
    const matchesSearch = item.label.toLowerCase().includes(searchQuery.toLowerCase());
    const hasRole = item.roles.includes(userRole);
    return matchesSearch && hasRole;
  });

  const usagePercent = Math.min(
    100,
    Math.round((tenantInfo.emailsSent / (tenantInfo.monthlyLimit || 1)) * 100)
  );

  return (
    <div className="min-h-screen bg-[#020617] text-[#f8fafc] flex font-sans antialiased selection:bg-[#38bdf8]/30 selection:text-[#38bdf8]">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 border-r border-white/10 bg-[#060b18]/80 backdrop-blur-2xl flex flex-col justify-between fixed top-0 bottom-0 left-0 z-40">
        <div className="overflow-y-auto">
          {/* WORKSPACE SWITCHER SELECTOR */}
          <div className="p-4 border-b border-white/10 space-y-3 relative" ref={dropdownRef}>
            <div 
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/25 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#38bdf8] flex-shrink-0 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] text-sm">
                  {workspace.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white tracking-wide truncate">
                    {workspace}
                  </div>
                  <div className="text-[10px] text-[#38bdf8] font-mono tracking-wider flex items-center gap-1">
                    <span>{tenantInfo.plan}</span>
                    <span className="text-[9px] px-1 rounded bg-white/10 text-white font-bold">{userRole}</span>
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-[#94a3b8] flex-shrink-0 group-hover:text-white transition-transform duration-200 ${showWorkspaceDropdown ? "rotate-180 text-white" : ""}`} />
            </div>

            {/* 🔥 DROPDOWN CHUYỂN WORKSPACE MULTI-TENANT */}
            {showWorkspaceDropdown && (
              <div className="absolute left-4 right-4 top-[78px] bg-[#0b1329]/95 border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1.5 text-[9px] font-mono uppercase tracking-wider text-[#64748b]">
                  Không Gian Làm Việc ({myWorkspaces.length})
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1">
                  {myWorkspaces.length === 0 ? (
                    <div className="p-2 text-center text-xs text-[#64748b]">Không có Workspace nào.</div>
                  ) : (
                    myWorkspaces.map((ws) => {
                      const wsId = (ws.tenantId?._id || ws.tenantId || ws.id || ws._id).toString();
                      const isActive = wsId === currentWorkspaceId;
                      return (
                        <button
                          key={wsId}
                          onClick={() => handleSwitchWorkspace(ws)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                            isActive
                              ? "bg-[#6366f1]/20 border border-[#38bdf8]/30 text-white"
                              : "hover:bg-white/[0.05] text-[#94a3b8] hover:text-white border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0">
                              {ws.name ? ws.name.charAt(0).toUpperCase() : "W"}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-medium truncate">{ws.name}</div>
                              <span className="text-[9px] font-mono px-1 rounded bg-white/5 text-[#38bdf8]">
                                {ws.role || "MEMBER"}
                              </span>
                            </div>
                          </div>
                          {isActive && <Check className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {userRole === "OWNER" && (
              <Link
                to="/billing"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-[#6366f1]/15 to-[#38bdf8]/15 border border-[#38bdf8]/30 hover:border-[#38bdf8] transition-all text-xs group"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#38bdf8] animate-pulse" />
                  <span className="text-white font-semibold text-[11px]">Nâng Cấp Gói Cước</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#64748b] group-hover:text-[#38bdf8]" />
              </Link>
            )}

            <div className="px-1 pt-1">
              <div className="flex justify-between text-[10px] font-mono text-[#94a3b8] mb-1">
                <span>Hạn Mức Email</span>
                <span>{tenantInfo.emailsSent.toLocaleString()} / {tenantInfo.monthlyLimit.toLocaleString()}</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#38bdf8]" style={{ width: `${usagePercent}%` }} />
              </div>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono tracking-widest text-[#64748b] uppercase">
              Hệ Thống Phân Tán
            </div>
            {filteredNav.map((item) => {
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
                    <Icon className={`w-4 h-4 ${active ? "text-[#38bdf8]" : "text-[#64748b] group-hover:text-white"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#6366f1]/30 text-[#818cf8]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-white/10 space-y-2">
          {user && (
            <div className="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#6366f1]/20 border border-[#6366f1]/40 flex items-center justify-center text-[11px] font-bold text-[#38bdf8]">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-white truncate">{user.name || "Người dùng"}</div>
                <div className="text-[10px] text-[#64748b] truncate">{user.email}</div>
              </div>
            </div>
          )}

          {["OWNER", "ADMIN"].includes(userRole) && (
            <Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#94a3b8] hover:text-white hover:bg-white/[0.04]">
              <Settings className="w-4 h-4 text-[#64748b]" />
              <span>Cấu Hình Workspace</span>
            </Link>
          )}

          <button onClick={handleLogout} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-all">
            <div className="flex items-center gap-3"><LogOut className="w-4 h-4" /><span>Đăng Xuất</span></div>
            <span className="text-[10px] text-red-400/60 font-mono">JWT</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN VIEWPORT ================= */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/10 bg-[#020617]/70 backdrop-blur-2xl px-8 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 text-xs text-[#64748b] hover:text-[#94a3b8] transition-all w-80 justify-between"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#64748b]" />
              <span>Tìm chiến dịch, job ID, danh bạ...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-[#cbd5e1]">⌘K</kbd>
          </button>

          {/* RIGHT HEADER: NOTIFICATION BELL & CLUSTER STATUS */}
          <div className="flex items-center gap-4">
            {/* --- CÁI CHUÔNG THÔNG BÁO LỜI MỜI --- */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 text-[#94a3b8] hover:text-white transition-all"
                title="Lời mời tham gia Workspace"
              >
                <Bell className="w-4 h-4" />
                {invitations.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {invitations.length}
                  </span>
                )}
              </button>

              {/* Dropdown danh sách lời mời */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-[#0b1329] border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden p-3 space-y-3 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10 text-xs">
                    <span className="font-bold text-white">Lời Mời Workspace ({invitations.length})</span>
                    <button onClick={() => setShowNotifDropdown(false)} className="text-[#64748b] hover:text-white">✕</button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {invitations.length === 0 ? (
                      <div className="py-6 text-center text-xs text-[#64748b]">Không có lời mời nào đang chờ.</div>
                    ) : (
                      invitations.map((inv) => (
                        <div key={inv.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
                          <div>
                            <div className="font-bold text-white">{inv.workspaceName}</div>
                            <div className="text-[10px] text-[#94a3b8]">Vai trò: <span className="text-[#38bdf8] font-mono">{inv.role}</span></div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleRespondInvitation(inv.id, "ACCEPT")}
                              className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 font-bold transition-all text-[11px]"
                            >
                              Chấp Nhận
                            </button>
                            <button
                              onClick={() => handleRespondInvitation(inv.id, "REJECT")}
                              className="flex-1 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold transition-all text-[11px]"
                            >
                              Từ Chối
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" />
              BULLMQ CLUSTER: ACTIVE
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* ================= COMMAND PALETTE ================= */}
      {cmdOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-[#010409]/85 backdrop-blur-md">
          <div className="w-full max-w-xl bg-[#0b1329] border border-[#38bdf8]/30 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <Search className="w-5 h-5 text-[#38bdf8]" />
              <input
                type="text"
                autoFocus
                placeholder="Gõ để tìm nhanh trang hoặc tác vụ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-white text-sm focus:outline-none w-full"
              />
              <button onClick={() => setCmdOpen(false)} className="p-1 rounded-lg text-[#64748b] hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto divide-y divide-white/5">
              {filteredNav.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setCmdOpen(false); }}
                  className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl text-xs hover:bg-white/[0.06] text-white"
                >
                  <div className="flex items-center gap-3"><item.icon className="w-4 h-4 text-[#38bdf8]" /><span>{item.label}</span></div>
                  <span className="text-[10px] font-mono text-[#64748b]">Đi đến ↵</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}