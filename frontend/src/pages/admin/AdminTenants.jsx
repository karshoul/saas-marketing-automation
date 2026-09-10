import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import {
  Building2,
  Search,
  RefreshCw,
  Lock,
  Unlock,
  Sliders,
  Send,
  Users,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";

export default function AdminTenants() {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [search, setSearch] = useState("");
  const [globalStats, setGlobalStats] = useState({ totalSent: 0, totalCapacity: 0 });
  const [editingTenant, setEditingTenant] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("PRO");
  const [customQuota, setCustomQuota] = useState(50000);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/tenants", { params: { search } });
      const data = res.data?.data || res.data;
      setTenants(data.tenants || []);
      setGlobalStats(data.globalStats || { totalSent: 0, totalCapacity: 0 });
    } catch (err) {
      console.error("Lỗi tải danh sách tenant:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Cập nhật trạng thái Khóa / Mở khóa
  const handleToggleStatus = async (tenant) => {
    const nextStatus = tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await api.put(`/admin/tenants/${tenant._id}/status`, { status: nextStatus });
      fetchTenants();
    } catch {
      alert("Không thể cập nhật trạng thái tenant.");
    }
  };

  // Cập nhật gói cước thủ công
  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!editingTenant) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/tenants/${editingTenant._id}/plan`, {
        plan: selectedPlan,
        customQuota: Number(customQuota)
      });
      setMsg(`Đã cập nhật gói ${selectedPlan} cho ${editingTenant.name}!`);
      setEditingTenant(null);
      fetchTenants();
      setTimeout(() => setMsg(""), 3000);
    } catch {
      alert("Lỗi điều chỉnh gói cước.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-amber-400" />
            Quản Trị Cụm Doanh Nghiệp (Tenants)
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Giám sát mức tiêu thụ hạn ngạch, phân bổ tài nguyên và kiểm soát truy cập toàn hệ sinh thái
          </p>
        </div>

        <button
          onClick={fetchTenants}
          disabled={loading}
          className="p-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs text-white transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
          <span>Làm mới cụm</span>
        </button>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* GLOBAL STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-[#0b1329]/70 border border-white/10 backdrop-blur-xl">
          <div className="text-xs font-mono uppercase text-[#94a3b8] mb-1">Tổng Số Doanh Nghiệp</div>
          <div className="text-2xl font-bold font-mono text-white">{tenants.length}</div>
          <div className="text-[11px] text-emerald-400 font-mono mt-1">Multi-tenant isolated</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0b1329]/70 border border-white/10 backdrop-blur-xl">
          <div className="text-xs font-mono uppercase text-[#94a3b8] mb-1">Email Tiêu Thụ Toàn Cụm</div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {globalStats.totalSent?.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-[#94a3b8] font-mono mt-1">Trong chu kỳ hiện tại</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0b1329]/70 border border-white/10 backdrop-blur-xl">
          <div className="text-xs font-mono uppercase text-[#94a3b8] mb-1">Tổng Dung Lượng Cấp Phát</div>
          <div className="text-2xl font-bold font-mono text-[#38bdf8]">
            {globalStats.totalCapacity?.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-[#94a3b8] font-mono mt-1">Hạn ngạch cam kết SLA</div>
        </div>
      </div>

      {/* SEARCH & TABLE */}
      <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên workspace hoặc slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#020617] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-[#94a3b8] bg-white/[0.02]">
                <th className="py-3 px-4">Tên Workspace</th>
                <th className="py-3 px-4">Gói Cước</th>
                <th className="py-3 px-4">Đã Dùng / Hạn Quota</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {tenants.map((t) => {
                const plan = (t.plan || t.subscriptionPlan || "FREE").toUpperCase();
                const sent = t.usage?.emailsSentThisMonth || 0;
                const limit = t.quotas?.monthlyEmailLimit || (plan === "PRO" ? 50000 : plan === "ENTERPRISE" ? 500000 : 3000);
                const isSuspended = t.status === "SUSPENDED";

                return (
                  <tr key={t._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-sans font-semibold text-white">{t.name}</div>
                      <div className="text-[10px] text-[#64748b]">slug: {t.slug} • id: {t._id}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        plan === "ENTERPRISE"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : plan === "PRO"
                          ? "bg-[#6366f1]/10 text-[#818cf8] border border-[#6366f1]/30"
                          : "bg-white/5 text-[#94a3b8] border border-white/10"
                      }`}>
                        {plan}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-white">
                      <span>{sent.toLocaleString()}</span> / <span className="text-[#38bdf8]">{limit.toLocaleString()}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isSuspended
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? "bg-red-400" : "bg-emerald-400 animate-pulse"}`} />
                        {isSuspended ? "SUSPENDED" : "ACTIVE"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingTenant(t);
                            setSelectedPlan(plan);
                            setCustomQuota(limit);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-amber-300 text-[11px] font-sans transition-all flex items-center gap-1"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Chỉnh Gói</span>
                        </button>

                        <button
                          onClick={() => handleToggleStatus(t)}
                          className={`p-1 rounded-lg transition-all ${
                            isSuspended
                              ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          }`}
                          title={isSuspended ? "Mở khóa tenant" : "Khóa tenant"}
                        >
                          {isSuspended ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ĐIỀU CHỈNH GÓI & QUOTA THỦ CÔNG */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010409]/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0b1329] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                Cấp Quyền: {editingTenant.name}
              </h3>
              <button onClick={() => setEditingTenant(null)} className="text-[#64748b] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1.5">Chọn Cấp Độ Gói Cước</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => {
                    const p = e.target.value;
                    setSelectedPlan(p);
                    setCustomQuota(p === "PRO" ? 50000 : p === "ENTERPRISE" ? 500000 : 3000);
                  }}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="FREE">FREE STARTER (3,000 emails)</option>
                  <option value="PRO">PRO AUTOMATION (50,000 emails)</option>
                  <option value="ENTERPRISE">ENTERPRISE ULTRA (500,000 emails)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1.5">Hạn Mức Email Tùy Chỉnh (Quota)</label>
                <input
                  type="number"
                  value={customQuota}
                  onChange={(e) => setCustomQuota(e.target.value)}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] text-[#94a3b8] hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {actionLoading ? "Đang lưu..." : "Xác Nhận Cấp"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}