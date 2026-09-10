import React from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  ShieldAlert,
  Building2,
  Cpu,
  FlaskConical,
  ArrowLeft,
  Activity,
  Terminal,
  LogOut
} from "lucide-react";

const ADMIN_NAV = [
  { label: "Quản Lý Cụm Tenants", path: "/admin/tenants", icon: Building2 },
  { label: "Hạ Tầng Queue & Worker", path: "/admin/queue-monitor", icon: Cpu, badge: "P(t)" },
  { label: "Thí Nghiệm Benchmark", path: "/admin/benchmark", icon: FlaskConical, badge: "Ablation" }
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020617] text-[#f8fafc] flex font-sans antialiased selection:bg-amber-400/30 selection:text-amber-300">
      {/* ================= ADMIN SIDEBAR ================= */}
      <aside className="w-64 border-r border-amber-500/20 bg-[#070b14]/90 backdrop-blur-2xl flex flex-col justify-between fixed top-0 bottom-0 left-0 z-40">
        <div>
          {/* Platform Console Header */}
          <div className="p-4 border-b border-amber-500/20 bg-amber-500/[0.03]">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center font-bold text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                <ShieldAlert className="w-5 h-5 text-black" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold tracking-wider text-amber-400">
                  VERDIO ENGINE
                </div>
                <div className="text-[10px] text-[#94a3b8] font-mono">
                  SUPERADMIN CONSOLE
                </div>
              </div>
            </div>

            <Link
              to="/dashboard"
              className="mt-3 flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-xs text-[#94a3b8] hover:text-white transition-all group"
            >
              <div className="flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5 text-[#38bdf8] group-hover:-translate-x-0.5 transition-transform" />
                <span>Về Tenant Portal</span>
              </div>
              <span className="text-[9px] font-mono text-[#64748b]">ESC</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono tracking-widest text-amber-400/70 uppercase">
              Quản Trị Nền Tảng
            </div>
            {ADMIN_NAV.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    active
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                      : "text-[#94a3b8] hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        active ? "text-amber-400" : "text-[#64748b] group-hover:text-white"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Console Footer */}
        <div className="p-3 border-t border-white/10 space-y-2">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-300 flex items-center gap-2">
            <Terminal className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span className="truncate">Root Session Active</span>
          </div>

          <button
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4" />
              <span>Thoát Root</span>
            </div>
            <span className="text-[10px] font-mono text-red-400/60">KILL</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT VIEWPORT ================= */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <header className="h-16 border-b border-amber-500/20 bg-[#070b14]/80 backdrop-blur-2xl px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
              CLUSTER ROOT PRIVILEGES
            </span>
            <span className="text-xs text-[#94a3b8] font-mono">
              Host: Redis-BullMQ Master Cluster
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>NODE HEALTH: 100% OK</span>
          </div>
        </header>

        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}