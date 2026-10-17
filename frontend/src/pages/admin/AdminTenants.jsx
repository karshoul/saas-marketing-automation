import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import {
  Building2,
  Search,
  RefreshCw,
  Lock,
  Unlock,
  Sliders,
  Trash2,
  Zap,
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

  // STATE DÀNH CHO KIỂM THỬ GỬI OTP KHẨN CẤP
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("889900");
  const [otpLoading, setOtpLoading] = useState(false);

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

  // Khóa / Mở khóa Tenant
  const handleToggleStatus = async (tenant) => {
    const tenantId = tenant._id || tenant.id;
    if (!tenantId) {
      alert("Không tìm thấy ID của workspace này.");
      return;
    }
    const nextStatus = tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    try {
      await api.put(`/admin/tenants/${tenantId}/status`, { status: nextStatus });
      setMsg(`Đã ${nextStatus === "SUSPENDED" ? "khóa" : "mở khóa"} workspace ${tenant.name} thành công!`);
      fetchTenants();
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      try {
        await api.patch(`/admin/tenants/${tenantId}/status`, { status: nextStatus });
        setMsg(`Đã ${nextStatus === "SUSPENDED" ? "khóa" : "mở khóa"} workspace ${tenant.name} thành công!`);
        fetchTenants();
        setTimeout(() => setMsg(""), 3000);
      } catch (innerErr) {
        console.error("Lỗi cập nhật trạng thái tenant:", innerErr);
        alert(innerErr.response?.data?.message || "Không thể cập nhật trạng thái tenant.");
      }
    }
  };

  // Xóa hẳn Workspace khỏi hệ thống
  const handleDeleteTenant = async (tenant) => {
    const tenantId = tenant._id || tenant.id;
    if (!tenantId) return alert("Không tìm thấy ID workspace.");

    if (!window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XÓA Workspace "${tenant.name}" không?\nHành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      await api.delete(`/admin/tenants/${tenantId}`);
      setMsg(`Đã xóa thành công workspace ${tenant.name}!`);
      fetchTenants();
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error("Lỗi xóa tenant:", err);
      alert(err.response?.data?.message || "Không thể xóa workspace này.");
    }
  };

  // Cập nhật Gói Cước & Quota
  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!editingTenant) return;

    const tenantId = editingTenant._id || editingTenant.id;
    if (!tenantId) {
      alert("Không tìm thấy ID workspace để cập nhật gói.");
      return;
    }

    setActionLoading(true);
    try {
      await api.put(`/admin/tenants/${tenantId}/plan`, {
        plan: selectedPlan,
        customQuota: Number(customQuota)
      });
      setMsg(`Đã cập nhật gói ${selectedPlan} cho ${editingTenant.name}!`);
      setEditingTenant(null);
      fetchTenants();
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error("Lỗi điều chỉnh gói cước:", err);
      alert(err.response?.data?.message || "Lỗi điều chỉnh gói cước.");
    } finally {
      setActionLoading(false);
    }
  };

  // Phát hành mã OTP khẩn cấp (SLA <= 5s)
  const handleSendOtpTest = async (e) => {
    e.preventDefault();
    if (!otpEmail) return alert("Vui lòng nhập Email nhận OTP!");

    setOtpLoading(true);
    try {
      const res = await api.post("/admin/send-otp", {
        toEmail: otpEmail,
        otpCode: otpCode
      });
      setMsg(res.data?.message || `Đã phát hành mã OTP [${otpCode}] tới ${otpEmail}!`);
      setShowOtpModal(false);
      setOtpEmail("");
      setTimeout(() => setMsg(""), 4000);
    } catch (err) {
      console.error("Lỗi gửi OTP:", err);
      alert(err.response?.data?.message || "Không thể phát hành mã OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans">
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

        {/* NÚT BẤM THAO TÁC CỤM */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOtpModal(true)}
            className="p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs text-amber-300 font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Test Gửi OTP (SLA 5s)</span>
          </button>

          <button
            onClick={fetchTenants}
            disabled={loading}
            className="p-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs text-white transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            <span>Làm mới cụm</span>
          </button>
        </div>
      </div>

      {/* SỐ THỐNG KÊ TỔNG CỤM */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-[#0b1329]/70 border border-white/10 backdrop-blur-xl">
          <div className="text-xs font-mono uppercase text-[#94a3b8] mb-1">Tổng Số Doanh Nghiệp</div>
          <div className="text-2xl font-bold font-mono text-white">{tenants.length}</div>
          <div className="text-[11px] text-emerald-400 font-mono mt-1">Multi-tenant isolated</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0b1329]/70 border border-white/10 backdrop-blur-xl">
          <div className="text-xs font-mono uppercase text-[#94a3b8] mb-1">Email Tiêu Thụ Toàn Cụm</div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {(globalStats.totalSent || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#94a3b8] font-mono mt-1">Trong chu kỳ hiện tại</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0b1329]/70 border border-white/10 backdrop-blur-xl">
          <div className="text-xs font-mono uppercase text-[#94a3b8] mb-1">Tổng Dung Lượng Cấp Phát</div>
          <div className="text-2xl font-bold font-mono text-[#38bdf8]">
            {(globalStats.totalCapacity || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#94a3b8] font-mono mt-1">Hạn ngạch cam kết SLA</div>
        </div>
      </div>

      {/* THÔNG BÁO TẠM THỜI */}
      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg("")} className="cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* BẢNG QUẢN LÝ TENANTS */}
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
                const tenantId = t._id || t.id;
                const plan = (t.plan || t.subscriptionPlan || "FREE").toUpperCase();
                const sent = t.usage?.emailsSentThisMonth || 0;
                const limit = t.quotas?.monthlyEmailLimit || (plan === "PRO" ? 50000 : plan === "ENTERPRISE" ? 500000 : 3000);
                const isSuspended = t.status === "SUSPENDED";

                return (
                  <tr key={tenantId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-sans font-semibold text-white">{t.name}</div>
                      <div className="text-[10px] text-[#64748b]">slug: {t.slug} | id: {tenantId}</div>
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
                          className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-amber-300 text-[11px] font-sans transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Chỉnh Gói</span>
                        </button>

                        <button
                          onClick={() => handleToggleStatus(t)}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            isSuspended
                              ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                          }`}
                          title={isSuspended ? "Mở khóa tenant" : "Khóa tenant"}
                        >
                          {isSuspended ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => handleDeleteTenant(t)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                          title="Xóa hẳn Workspace"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODAL CẤP QUYỀN / ĐỔI GÓI CƯỚC */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010409]/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0b1329] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                Cấp Quyền: {editingTenant.name}
              </h3>
              <button onClick={() => setEditingTenant(null)} className="text-[#64748b] hover:text-white cursor-pointer">
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
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
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
                  className="px-4 py-2 rounded-xl bg-white/[0.04] text-[#94a3b8] hover:text-white cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Đang lưu..." : "Xác Nhận Cấp"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THỬ NGHIỆM GỬI OTP KHẨN CẤP */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010409]/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0b1329] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                Kiểm Thử Gửi OTP Khẩn Cấp (Priority Queue)
              </h3>
              <button onClick={() => setShowOtpModal(false)} className="text-[#64748b] hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendOtpTest} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1.5">Email Nhận OTP</label>
                <input
                  type="email"
                  required
                  placeholder="nhap-email-nhan@gmail.com"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-[#475569] focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1.5">Mã OTP Thử Nghiệm</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold text-center tracking-widest text-lg focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
                ⚡ Email sẽ được chèn lên đầu hàng đợi BullMQ với <b>Priority = 1</b> và cam kết phát tán trong <b>3 - 5 giây</b>.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] text-[#94a3b8] hover:text-white cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  {otpLoading ? "Đang phát..." : "Phát Thư OTP Tức Thì"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}