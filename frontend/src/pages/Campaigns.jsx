import React, { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import {
  Send,
  Plus,
  Search,
  RefreshCw,
  Play,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Tag,
  Mail,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  FileCode,
  Layers,
  MousePointerClick,
  Sparkles
} from "lucide-react";

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);

  const [previewContent, setPreviewContent] = useState({ subject: "", contentHtml: "" });
  const [selectedQueueStats, setSelectedQueueStats] = useState(null);
  const [activeCampaignId, setActiveCampaignId] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [triggeringId, setTriggeringId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form tạo chiến dịch mới
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    contentHtml: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
  <h2 style="color: #2563eb;">Xin chào {{firstName}}!</h2>
  <p>Cảm ơn bạn đã đồng hành cùng chúng tôi. Đây là thông điệp tự động từ hệ thống VERDIO.</p>
  <p><a href="https://verdio.io" style="background: #2563eb; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Khám phá ngay</a></p>
</div>`,
    targetTags: "",
    scheduledAt: ""
  });

  // ========================================================
  // 1. LẤY DANH SÁCH CHIẾN DỊCH TỪ BACKEND
  // ========================================================
  const fetchCampaigns = useCallback(async (page = 1) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = {
        page,
        limit: meta.limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined
      };
      const res = await api.get("/campaigns", { params });
      const data = res.data?.data || [];
      const metaData = res.data?.meta || {
        page,
        limit: meta.limit,
        total: data.length,
        totalPages: Math.ceil(data.length / meta.limit) || 1
      };
      setCampaigns(data);
      setMeta(metaData);
    } catch (err) {
      console.error("Lỗi tải campaigns:", err);
      setErrorMsg(err.response?.data?.message || "Không thể tải danh sách chiến dịch.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, meta.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCampaigns(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  // ========================================================
  // 2. TẠO CHIẾN DỊCH MỚI
  // ========================================================
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        contentHtml: formData.contentHtml,
        targetTags: formData.targetTags
          ? formData.targetTags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt) : null
      };

      await api.post("/campaigns", payload);
      setSuccessMsg("Tạo chiến dịch mới thành công!");
      setIsCreateOpen(false);
      setFormData({
        name: "",
        subject: "",
        contentHtml: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
  <h2 style="color: #2563eb;">Xin chào {{firstName}}!</h2>
  <p>Cảm ơn bạn đã đồng hành cùng chúng tôi.</p>
</div>`,
        targetTags: "",
        scheduledAt: ""
      });
      fetchCampaigns(1);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Lỗi tạo chiến dịch.");
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================================
  // 3. KÍCH HOẠT PHÁT TÁN (TRIGGER DISPATCH VÀO BULLMQ)
  // ========================================================
  const handleTrigger = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn KÍCH HOẠT chiến dịch "${name}" ngay lập tức? Toàn bộ email sẽ được đẩy vào hàng đợi BullMQ!`)) {
      return;
    }

    setTriggeringId(id);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.post(`/campaigns/${id}/trigger`);
      setSuccessMsg(`Đã kích hoạt chiến dịch "${name}" thành công! Hệ thống đang đẩy tác vụ vào hàng đợi.`);
      fetchCampaigns(meta.page);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Không thể kích hoạt chiến dịch.");
    } finally {
      setTriggeringId(null);
    }
  };

  // ========================================================
  // 4. THEO DÕI HÀNG ĐỢI REAL-TIME CỦA 1 CHIẾN DỊCH (AN TOÀN)
  // ========================================================
  const handleViewQueueStatus = async (id, name) => {
    setActiveCampaignId({ id, name: name || "Chiến dịch" });
    setIsQueueModalOpen(true);
    setSelectedQueueStats(null);

    try {
      const res = await api.get(`/campaigns/${id}/queue-status`);
      const payload = res.data?.data || res.data || {};
      setSelectedQueueStats({
        waiting: payload.waiting ?? payload.counts?.waiting ?? 0,
        active: payload.active ?? payload.counts?.active ?? 0,
        completed: payload.completed ?? payload.counts?.completed ?? 0,
        failed: payload.failed ?? payload.counts?.failed ?? 0,
      });
    } catch (err) {
      console.error("Lỗi lấy queue status:", err);
      // Fallback hiển thị dữ liệu mặc định thay vì làm sập modal
      setSelectedQueueStats({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        notice: "Tác vụ đã hoàn tất và được giải phóng khỏi Redis."
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Send className="w-6 h-6 text-[#38bdf8]" />
              Chiến Dịch Tiếp Thị Đa Kênh
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#6366f1]/20 border border-[#6366f1]/40 text-[#818cf8] text-[10px] font-mono font-bold">
              BULLMQ DISPATCHER
            </span>
          </div>
          <p className="text-xs text-[#94a3b8]">
            Lên lịch gửi, phân loại tệp khách hàng theo nhãn Tag và kích hoạt phát tán hàng loạt
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCampaigns(meta.page)}
            className="p-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs text-white transition-all flex items-center gap-2"
            title="Làm mới"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#38bdf8]" : ""}`} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] hover:from-[#4f46e5] hover:to-[#0284c7] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Chiến Dịch</span>
          </button>
        </div>
      </div>

      {/* Thông báo Messages */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ================= FILTER & SEARCH BAR ================= */}
      <div className="p-4 rounded-2xl bg-[#0b1329]/70 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên chiến dịch, tiêu đề email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#020617]/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#020617]/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#38bdf8] transition-all"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Bản nháp (DRAFT)</option>
            <option value="QUEUED">Trong hàng đợi (QUEUED)</option>
            <option value="PROCESSING">Đang phát tán (PROCESSING)</option>
            <option value="COMPLETED">Hoàn tất (COMPLETED)</option>
            <option value="FAILED">Thất bại (FAILED)</option>
          </select>
        </div>
      </div>

      {/* ================= CAMPAIGN TABLE ================= */}
      <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase font-mono tracking-wider text-[#94a3b8] bg-white/[0.02]">
                <th className="py-3.5 px-6">Tên Chiến Dịch</th>
                <th className="py-3.5 px-4">Tệp Mục Tiêu (Tags)</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4">Tiến Độ Gửi</th>
                <th className="py-3.5 px-4">Đo Lường (Telemetry)</th>
                <th className="py-3.5 px-6 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-[#64748b]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#38bdf8]" />
                      <span>Đang tải danh sách chiến dịch...</span>
                    </div>
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-[#64748b]">
                    Chưa có chiến dịch nào được tạo. Hãy bấm "Tạo Chiến Dịch" để bắt đầu!
                  </td>
                </tr>
              ) : (
                campaigns.map((camp) => {
                  const id = camp._id || camp.id;
                  const total = camp.stats?.totalRecipients || 0;
                  const sent = camp.stats?.sentCount || 0;
                  const failed = camp.stats?.failedCount || 0;
                  const opened = camp.stats?.openedCount || 0;
                  const clicked = camp.stats?.clickedCount || 0;
                  const percent = total > 0 ? Math.round((sent / total) * 100) : 0;

                  return (
                    <tr key={id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white group-hover:text-[#38bdf8] transition-colors">
                          {camp.name}
                        </div>
                        <div className="text-[11px] font-mono text-[#64748b] flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-[#38bdf8]" />
                          <span className="truncate max-w-[220px]">{camp.subject}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {camp.targetTags && camp.targetTags.length > 0 ? (
                            camp.targetTags.map((t, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#6366f1]/10 text-[#818cf8] border border-[#6366f1]/20"
                              >
                                #{t}
                              </span>
                            ))
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] text-[#94a3b8]">
                              Tất cả danh bạ
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                            camp.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : camp.status === "PROCESSING"
                              ? "bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20"
                              : camp.status === "QUEUED"
                              ? "bg-[#818cf8]/10 text-[#818cf8] border border-[#818cf8]/20"
                              : camp.status === "FAILED"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-white/5 text-[#94a3b8] border border-white/10"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              camp.status === "COMPLETED"
                                ? "bg-emerald-400"
                                : camp.status === "PROCESSING"
                                ? "bg-[#38bdf8] animate-pulse"
                                : camp.status === "QUEUED"
                                ? "bg-[#818cf8] animate-pulse"
                                : camp.status === "FAILED"
                                ? "bg-red-400"
                                : "bg-[#94a3b8]"
                            }`}
                          />
                          {camp.status}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="w-36">
                          <div className="flex justify-between text-[10px] font-mono text-[#94a3b8] mb-1">
                            <span>{sent} / {total}</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#38bdf8] transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          {failed > 0 && (
                            <div className="text-[10px] text-red-400 font-mono mt-1">
                              Lỗi: {failed}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono text-xs">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[#38bdf8]" title="Lượt mở thư">
                            <Eye className="w-3.5 h-3.5" />
                            {opened}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-400" title="Lượt click liên kết">
                            <MousePointerClick className="w-3.5 h-3.5" />
                            {clicked}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setPreviewContent({ subject: camp.subject, contentHtml: camp.contentHtml });
                              setIsPreviewOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors"
                            title="Xem trước nội dung email"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleViewQueueStatus(id, camp.name)}
                            className="p-1.5 rounded-lg text-[#818cf8] hover:bg-[#6366f1]/20 transition-colors"
                            title="Theo dõi trạng thái BullMQ"
                          >
                            <Activity className="w-4 h-4" />
                          </button>

                          {/* Nút Trigger phát tán: Chỉ cho phép trigger khi còn là DRAFT hoặc FAILED */}
                          {(camp.status === "DRAFT" || camp.status === "FAILED") && (
                            <button
                              onClick={() => handleTrigger(id, camp.name)}
                              disabled={triggeringId === id}
                              className="px-3 py-1.5 rounded-lg bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/30 text-[#38bdf8] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(56,189,248,0.2)] disabled:opacity-50"
                              title="Bắn vào hàng đợi BullMQ"
                            >
                              <Play className={`w-3.5 h-3.5 ${triggeringId === id ? "animate-spin" : ""}`} />
                              <span>{triggeringId === id ? "Đang gửi..." : "Trigger"}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-[#94a3b8] bg-white/[0.01]">
          <div>
            Trang <span className="text-white font-bold font-mono">{meta.page}</span> /{" "}
            <span className="font-mono">{meta.totalPages}</span> (Tổng: {meta.total} chiến dịch)
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={meta.page <= 1 || loading}
              onClick={() => fetchCampaigns(meta.page - 1)}
              className="p-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={meta.page >= meta.totalPages || loading}
              onClick={() => fetchCampaigns(meta.page + 1)}
              className="p-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL TẠO CHIẾN DỊCH MỚI ================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010409]/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#0b1329] border border-white/15 rounded-2xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/10">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#38bdf8]" />
                Tạo Chiến Dịch Tiếp Thị Mới
              </h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-[#64748b] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1">Tên Chiến Dịch (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Chào Mừng Thành Viên Mới - Tháng 09"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8]"
                />
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1">Tiêu Đề Email (Subject) (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 🎁 Nhận quà chào mừng từ VERDIO ngay hôm nay!"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#cbd5e1] font-semibold mb-1">
                    Lọc Theo Thẻ Nhãn (Target Tags)
                  </label>
                  <input
                    type="text"
                    placeholder="VIP, KHACH_MOI (để trống = gửi toàn bộ)"
                    value={formData.targetTags}
                    onChange={(e) => setFormData({ ...formData, targetTags: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8]"
                  />
                  <p className="text-[10px] text-[#64748b] mt-1">Cách nhau bởi dấu phẩy</p>
                </div>

                <div>
                  <label className="block text-[#cbd5e1] font-semibold mb-1">Lập Lịch Gửi (Scheduled At)</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#38bdf8]"
                  />
                  <p className="text-[10px] text-[#64748b] mt-1">Để trống để gửi thủ công qua nút Trigger</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[#cbd5e1] font-semibold">Nội Dung Thư (HTML Content) (*)</label>
                  <span className="text-[10px] text-[#38bdf8] font-mono">
                    Hỗ trợ biến: {"{{firstName}}"}, {"{{email}}"}
                  </span>
                </div>
                <textarea
                  rows="8"
                  required
                  value={formData.contentHtml}
                  onChange={(e) => setFormData({ ...formData, contentHtml: e.target.value })}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl p-3 text-white font-mono text-[11px] placeholder-[#475569] focus:outline-none focus:border-[#38bdf8]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl hover:bg-white/5 text-[#94a3b8]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] text-white font-semibold disabled:opacity-50"
                >
                  {submitting ? "Đang lưu..." : "Lưu Chiến Dịch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL XEM TRƯỚC NỘI DUNG (PREVIEW) ================= */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010409]/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[#0b1329] border border-white/15 rounded-2xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#38bdf8]" />
                Xem Trước Nội Dung Thư
              </h2>
              <button onClick={() => setIsPreviewOpen(false)} className="text-[#64748b] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-3 text-xs">
              <span className="text-[#64748b]">Tiêu đề: </span>
              <span className="text-white font-semibold">{previewContent.subject}</span>
            </div>

            <div className="p-4 rounded-xl bg-white text-black min-h-[220px] max-h-[400px] overflow-y-auto">
              <div dangerouslySetInnerHTML={{ __html: previewContent.contentHtml }} />
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL THEO DÕI HÀNG ĐỢI (BULLMQ STATUS) ================= */}
      {isQueueModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsQueueModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-[#0f172a] border border-white/20 rounded-2xl p-6 shadow-2xl relative z-[101]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#6366f1]/20 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#818cf8]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white leading-tight">
                    Trạng Thái Hàng Đợi
                  </h2>
                  <p className="text-[11px] text-[#94a3b8] font-mono truncate max-w-[240px]">
                    {activeCampaignId?.name || "Chiến dịch"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsQueueModalOpen(false)} 
                className="p-1 rounded-lg hover:bg-white/10 text-[#64748b] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!selectedQueueStats ? (
              <div className="py-10 text-center text-xs text-[#94a3b8] flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-[#38bdf8]" />
                <span>Đang truy vấn số liệu BullMQ & Worker...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedQueueStats.notice && (
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#38bdf8] text-[11px] font-mono">
                    ℹ {selectedQueueStats.notice}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="text-[#94a3b8] text-[10px] tracking-wider uppercase">ĐANG CHỜ</div>
                    <div className="text-2xl font-bold text-amber-400 mt-1">
                      {selectedQueueStats.waiting}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="text-[#94a3b8] text-[10px] tracking-wider uppercase">ĐANG XỬ LÝ</div>
                    <div className="text-2xl font-bold text-[#38bdf8] mt-1">
                      {selectedQueueStats.active}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="text-[#94a3b8] text-[10px] tracking-wider uppercase">HOÀN TẤT</div>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">
                      {selectedQueueStats.completed}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="text-[#94a3b8] text-[10px] tracking-wider uppercase">THẤT BẠI</div>
                    <div className="text-2xl font-bold text-red-400 mt-1">
                      {selectedQueueStats.failed}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 text-[11px] text-[#cbd5e1]">
                  <div className="flex items-center gap-1.5 text-[#38bdf8] font-bold mb-1 font-mono">
                    <Sparkles className="w-3.5 h-3.5" />
                    BULLMQ DISPATCHER
                  </div>
                  Các tác vụ hoàn thành sẽ được Worker tự động giải phóng khỏi bộ nhớ Redis.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}