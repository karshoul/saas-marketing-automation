import React, { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import {
  Cpu,
  RefreshCw,
  Zap,
  Activity,
  Server,
  Layers,
  Clock,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Search,
  Building2
} from "lucide-react";

export default function QueueMonitor() {
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("ALL");
  const [tenantsList, setTenantsList] = useState([]);
  const [jobSearch, setJobSearch] = useState("");

  const [queueData, setQueueData] = useState({
    counts: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, total: 0 },
    scaler: { currentConcurrency: 2, minConcurrency: 2, maxConcurrency: 20 },
    liveJobs: []
  });

  // Simulator State để kiểm tra công thức P(t)
  const [simSla, setSimSla] = useState(5);
  const [simTier, setSimTier] = useState("ENTERPRISE");
  const [simWait, setSimWait] = useState(0);

  // 1. Tải danh sách Tenants cho dropdown lọc của SuperAdmin
  const fetchTenants = useCallback(async () => {
    try {
      const res = await api.get("/admin/tenants");
      const list = res.data?.data?.tenants || res.data?.tenants || [];
      setTenantsList(list);
    } catch (err) {
      console.error("Lỗi tải danh sách tenant cho queue filter:", err);
    }
  }, []);

  // 2. Tải chỉ số thực tế từ Backend
  const fetchQueueStats = useCallback(async () => {
    try {
      const params = selectedTenant !== "ALL" ? { tenantId: selectedTenant } : {};
      const res = await api.get("/queue/stats", { params });
      if (res.data?.data) {
        setQueueData(res.data.data);
      }
      setErrorMsg("");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Không thể kết nối đến Redis Queue Stream.");
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    fetchQueueStats();
    if (!autoRefresh) return;
    const interval = setInterval(fetchQueueStats, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchQueueStats]);

  // Mô phỏng công thức P(t) theo Adaptive Scheduler
  const calculateSimPriority = () => {
    if (simSla <= 5) return 1;
    let tierWeight = 0;
    if (simTier === "ENTERPRISE") tierWeight = 10;
    else if (simTier === "PRO") tierWeight = 5;

    const alpha = 0.1;
    const agingBoost = Math.floor(simWait * alpha);
    const slaScore = Math.floor(simSla / 5);
    const rawP = slaScore - tierWeight - agingBoost;
    return Math.max(1, Math.min(100, rawP));
  };

  const { counts, scaler, liveJobs } = queueData;
  const concurrencyPercent = Math.round((scaler.currentConcurrency / scaler.maxConcurrency) * 100);

  // Lọc tác vụ hiển thị theo từ khóa tìm kiếm
  const filteredJobs = (liveJobs || []).filter((job) => {
    const q = jobSearch.toLowerCase();
    const matchId = (job.id || "").toString().toLowerCase().includes(q);
    const matchTo = (job.to || "").toLowerCase().includes(q);
    const matchTenant = (job.tenantName || "").toLowerCase().includes(q);
    return matchId || matchTo || matchTenant;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Cpu className="w-6 h-6 text-[#38bdf8]" />
              Trạm Giám Sát Hàng Đợi & Worker
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
              BULLMQ + REDIS
            </span>
          </div>
          <p className="text-xs text-[#94a3b8]">
            Quan sát thời gian thực cơ chế Adaptive Priority $P(t)$ và bộ tự động co giãn luồng WorkerScaler
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-[#94a3b8] cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded accent-[#38bdf8]"
            />
            <span>Tự động làm mới (3s)</span>
          </label>

          <button
            onClick={fetchQueueStats}
            className="p-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs text-white transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#38bdf8]" : ""}`} />
            <span>Cập nhật</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg} (Đang hiển thị số liệu bộ đệm cục bộ)</span>
        </div>
      )}

      {/* BỘ LỌC MULTI-TENANT DÀNH CHO SUPERADMIN */}
      <div className="p-4 rounded-2xl bg-[#0b1329]/70 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-[#38bdf8]" />
          <span className="text-xs font-semibold text-white whitespace-nowrap">Chế độ xem:</span>
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="bg-[#020617] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#38bdf8] w-full md:w-64 cursor-pointer"
          >
            <option value="ALL">🌐 Toàn sàn (Cluster-Wide All Tenants)</option>
            {tenantsList.map((t) => (
              <option key={t._id || t.id} value={t._id || t.id}>
                🏢 {t.name} ({t.slug})
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo Job ID, Người nhận, Workspace..."
            value={jobSearch}
            onChange={(e) => setJobSearch(e.target.value)}
            className="w-full bg-[#020617] border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8]"
          />
        </div>
      </div>

      {/* 4 THẺ TRẠNG THÁI TELEMETRY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl group hover:border-amber-400/40 transition-all">
          <div className="flex justify-between items-start text-[#94a3b8] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Đang Chờ (Waiting)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-amber-400 mb-1">
            {counts.waiting.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#94a3b8] font-mono">
            Đang xếp hàng theo $P(t)$
          </div>
        </div>

        <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl group hover:border-[#38bdf8]/40 transition-all">
          <div className="flex justify-between items-start text-[#94a3b8] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Đang Thực Thi (Active)</span>
            <Activity className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div className="text-3xl font-mono font-bold text-[#38bdf8] mb-1">
            {counts.active.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono">
            Phân bổ trên {scaler.currentConcurrency} luồng
          </div>
        </div>

        <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl group hover:border-emerald-400/40 transition-all">
          <div className="flex justify-between items-start text-[#94a3b8] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Hoàn Thành (Completed)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-emerald-400 mb-1">
            {counts.completed.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#94a3b8] font-mono">
            Đã gửi và lưu DB
          </div>
        </div>

        <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl group hover:border-red-400/40 transition-all">
          <div className="flex justify-between items-start text-[#94a3b8] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Thất Bại (Failed)</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-red-400 mb-1">
            {counts.failed.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#94a3b8] font-mono">
            Tự động Retry 3 lần
          </div>
        </div>
      </div>

      {/* BỘ TỰ ĐỘNG CO GIÃN LUỒNG */}
      <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-[#818cf8]" />
              Bộ Tự Động Co Giãn Luồng (WorkerScaler Loop)
            </h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Tự động điều chỉnh số luồng Worker concurrency trong khoảng [{scaler.minConcurrency}..{scaler.maxConcurrency}] dựa trên định mức ~10 jobs/s
            </p>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-[#cbd5e1]">
              Concurrency Hiện Tại: <span className="text-white font-bold text-sm text-[#38bdf8]">{scaler.currentConcurrency}</span> / {scaler.maxConcurrency}
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] font-mono text-[#94a3b8] mb-1.5">
            <span>Tải luồng: {concurrencyPercent}%</span>
            <span>Min: {scaler.minConcurrency} threads ─── Max: {scaler.maxConcurrency} threads</span>
          </div>
          <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6366f1] via-[#38bdf8] to-emerald-400 transition-all duration-700 shadow-[0_0_15px_rgba(56,189,248,0.5)]"
              style={{ width: `${Math.max(10, concurrencyPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* CÔNG THỨC P(t) & BẢNG REDIS JOBS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột Trái: Bộ mô phỏng toán học */}
        <div className="lg:col-span-1 bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Sliders className="w-4 h-4 text-[#38bdf8]" />
            Thử Nghiệm Công Thức $P(t)$
          </div>
          <p className="text-xs text-[#94a3b8]">
            Kiểm chứng logic ưu tiên: SLA càng gấp, gói cước càng cao hoặc chờ càng lâu thì điểm P càng nhỏ.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[#cbd5e1] mb-1">Thời Hạn Cam Kết SLA</label>
              <select
                value={simSla}
                onChange={(e) => setSimSla(Number(e.target.value))}
                className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#38bdf8]"
              >
                <option value={5}>OTP / Khẩn Cấp (SLA ≤ 5s)</option>
                <option value={15}>Transactional / Đơn Hàng (SLA ≤ 15s)</option>
                <option value={60}>Marketing Bulk / Bản Tin (SLA ≤ 60s)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#cbd5e1] mb-1">Gói Cước Khách Hàng (Tier)</label>
              <select
                value={simTier}
                onChange={(e) => setSimTier(e.target.value)}
                className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#38bdf8]"
              >
                <option value="ENTERPRISE">ENTERPRISE (Trọng số W = 10)</option>
                <option value="PRO">PRO (Trọng số W = 5)</option>
                <option value="FREE">FREE (Trọng số W = 0)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-[#cbd5e1] mb-1">
                <span>Thời Gian Chờ Trong Hàng (Aging)</span>
                <span className="font-mono text-[#38bdf8] font-bold">{simWait}s</span>
              </div>
              <input
                type="range"
                min={0}
                max={120}
                step={5}
                value={simWait}
                onChange={(e) => setSimWait(Number(e.target.value))}
                className="w-full accent-[#38bdf8]"
              />
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#94a3b8]">Điểm Ưu Tiên Kết Quả:</span>
              <span className="text-xl font-mono font-bold text-white px-3 py-1 rounded-xl bg-[#6366f1]/20 border border-[#6366f1]/40 text-[#38bdf8]">
                P = {calculateSimPriority()}
              </span>
            </div>
          </div>
        </div>

        {/* Cột Phải: Bảng Jobs thực tế trong Redis */}
        <div className="lg:col-span-2 bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#38bdf8]" />
              Các Tác Vụ Đang Xếp Hàng Trong Redis ({filteredJobs.length} jobs)
            </h3>
            <span className="text-xs font-mono text-[#94a3b8]">Top 15 Jobs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-[#94a3b8]">
                  <th className="pb-3">Mã Job</th>
                  <th className="pb-3">Doanh Nghiệp</th>
                  <th className="pb-3">Người Nhận</th>
                  <th className="pb-3">Trạng Thái</th>
                  <th className="pb-3">SLA</th>
                  <th className="pb-3">Priority P(t)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-[#64748b]">
                      Hàng đợi hiện tại đang rỗng. Hãy thử bấm "Trigger" ở trang Chiến Dịch!
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 text-[#cbd5e1] font-bold">#{job.id}</td>
                      <td className="py-3 text-white font-sans">{job.tenantName || "Mặc định"}</td>
                      <td className="py-3 text-[#94a3b8]">{job.to || "—"}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          job.state === "active"
                            ? "bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30"
                            : "bg-amber-400/10 text-amber-400 border border-amber-400/30"
                        }`}>
                          {(job.state || "waiting").toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-emerald-400">{job.slaSeconds || 60}s</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded bg-[#6366f1]/20 text-[#818cf8] font-bold border border-[#6366f1]/30">
                          P = {job.priority ?? 10}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}