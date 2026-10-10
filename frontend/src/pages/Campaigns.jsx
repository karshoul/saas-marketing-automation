import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import {
  Send,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Play,
  Check,
  X,
  Eye,
  Trash2,
  Users,
  Layers,
  Sparkles,
  Cpu,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  FileCode2,
  Clock,
  ExternalLink,
  Flame,
  LayoutGrid,
  List,
  Hash,
  Activity,
  Calendar,
  MousePointer,
  MailCheck,
  BarChart3,
  Copy
} from "lucide-react";

const SEGMENT_OPTIONS = [
  { value: "ALL", label: "Toàn bộ danh bạ (Mọi liên hệ Subscribed)" },
  { value: "VIP", label: "Nhóm Khách VIP (Điểm tương tác cao)" },
  { value: "ENTERPRISE", label: "Khách hàng Doanh Nghiệp (Enterprise)" },
  { value: "LEADS", label: "Khách hàng Tiềm Năng (Leads mới)" },
  { value: "CUSTOMERS", label: "Khách Đã Mua Hàng (Customers)" }
];

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Drawer xem chi tiết chiến dịch
  const [inspectingCampaign, setInspectingCampaign] = useState(null);

  // Wizard state (Trình tạo 4 bước)
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const [wizardData, setWizardData] = useState({
    name: "",
    fromName: "",
    subject: "",
    targetSegment: "ALL",
    targetTags: "",
    templateId: "",
    contentHtml: ""
  });

  // Realtime Queue Monitor Modal
  const [monitoringCampaign, setMonitoringCampaign] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);
  const pollIntervalRef = useRef(null);

  // ==========================================
  // 1. TẢI DỮ LIỆU TỪ BACKEND
  // ==========================================
  const fetchCampaigns = useCallback(async (page = 1) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = {
        page,
        limit: meta.limit,
        search: search.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined
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
      console.error("Lỗi tải danh sách chiến dịch:", err);
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
  }, [fetchCampaigns]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await api.get("/templates?limit=50");
      setTemplates(res.data?.data || []);
    } catch (err) {
      console.error("Lỗi tải templates cho wizard:", err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleOpenWizard = () => {
    setWizardData({
      name: "",
      fromName: localStorage.getItem("workspaceName") || "VERDIO Team",
      subject: "",
      targetSegment: "ALL",
      targetTags: "",
      templateId: "",
      contentHtml: ""
    });
    setWizardStep(1);
    setIsWizardOpen(true);
    fetchTemplates();
  };

  const handleSelectTemplate = (tpl) => {
    setWizardData((prev) => ({
      ...prev,
      templateId: tpl._id || tpl.id,
      contentHtml: tpl.htmlContent || "",
      subject: prev.subject || tpl.subject || ""
    }));
  };

  // ==========================================
  // 2. KHỞI TẠO HOẶC PHÁT TÁN CHIẾN DỊCH
  // ==========================================
  const handleSaveCampaign = async (autoTrigger = false) => {
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        name: wizardData.name.trim(),
        fromName: wizardData.fromName.trim(),
        subject: wizardData.subject.trim(),
        targetSegment: wizardData.targetSegment,
        targetTags: wizardData.targetTags
          ? wizardData.targetTags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        templateId: wizardData.templateId || undefined,
        contentHtml: wizardData.contentHtml
      };

      const res = await api.post("/campaigns", payload);
      const newCampaign = res.data?.data || res.data;
      const campaignId = newCampaign?._id || newCampaign?.id;

      if (autoTrigger && campaignId) {
        await api.post(`/campaigns/${campaignId}/trigger`);
        setSuccessMsg(`Chiến dịch "${payload.name}" đã được đưa vào hàng đợi BullMQ!`);
      } else {
        setSuccessMsg(`Đã tạo chiến dịch bản nháp "${payload.name}" thành công!`);
      }

      setIsWizardOpen(false);
      fetchCampaigns(1);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Không thể khởi tạo chiến dịch.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerCampaign = async (id, name, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Kích hoạt phát tán email cho chiến dịch "${name}" ngay bây giờ?`)) return;

    try {
      await api.post(`/campaigns/${id}/trigger`);
      setSuccessMsg(`Đã đưa chiến dịch "${name}" vào cụm phân tán!`);
      fetchCampaigns(meta.page);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Không thể kích hoạt chiến dịch.");
    }
  };

  const handleDeleteCampaign = async (id, name, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Xác nhận xóa vĩnh viễn chiến dịch "${name}"?`)) return;

    try {
      await api.delete(`/campaigns/${id}`);
      setCampaigns((prev) => prev.filter((c) => (c._id || c.id) !== id));
      if (inspectingCampaign && (inspectingCampaign._id || inspectingCampaign.id) === id) {
        setInspectingCampaign(null);
      }
      setSuccessMsg(`Đã xóa chiến dịch "${name}"`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Không thể xóa chiến dịch.");
    }
  };

  // ==========================================
  // 3. THEO DÕI REAL-TIME BULLMQ TELEMETRY
  // ==========================================
  const fetchQueueStatus = async (cid) => {
    try {
      const res = await api.get(`/campaigns/${cid}/queue-status`);
      setQueueStatus(res.data?.data || res.data);
    } catch (err) {
      console.error("Lỗi queue:", err);
    }
  };

  const handleOpenQueueMonitor = (camp, e) => {
    if (e) e.stopPropagation();
    setMonitoringCampaign(camp);
    const cid = camp._id || camp.id;
    fetchQueueStatus(cid);

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(() => {
      fetchQueueStatus(cid);
    }, 2500);
  };

  const handleCloseQueueMonitor = () => {
    setMonitoringCampaign(null);
    setQueueStatus(null);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    fetchCampaigns(meta.page);
  };

  // Tính toán KPI
  const totalSent = useMemo(() => campaigns.reduce((acc, c) => acc + (c.stats?.sentCount || 0), 0), [campaigns]);
  const totalOpened = useMemo(() => campaigns.reduce((acc, c) => acc + (c.stats?.openedCount || 0), 0), [campaigns]);
  const activeProcessing = useMemo(() => campaigns.filter((c) => c.status === "PROCESSING" || c.status === "QUEUED").length, [campaigns]);
  const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;

  return (
    <div className="space-y-6 font-sans select-none text-slate-300 relative">
      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Send className="w-6 h-6 text-[#38bdf8]" />
              Chiến Dịch Gửi Tin (Campaigns)
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8] text-[10px] font-mono font-bold">
              BULLMQ DISPATCHER
            </span>
          </div>
          <p className="text-xs text-[#94a3b8]">
            Điều phối và giám sát luồng phát tán thư phân tán, tối ưu độ trễ SLA và phân tích tương tác người nhận
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle: Grid vs Table */}
          <div className="bg-[#020617] border border-white/10 rounded-xl p-0.5 flex items-center gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "grid" ? "bg-white/15 text-[#38bdf8] shadow-sm" : "text-[#64748b] hover:text-white"
              }`}
              title="Chế độ Thẻ Trực Quan (Card View)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "table" ? "bg-white/15 text-[#38bdf8] shadow-sm" : "text-[#64748b] hover:text-white"
              }`}
              title="Chế độ Bảng Đo Lường (Table View)"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => fetchCampaigns(meta.page)}
            className="p-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-[#94a3b8] hover:text-white transition-all"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#38bdf8]" : ""}`} />
          </button>

          <button
            onClick={handleOpenWizard}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] hover:from-[#4f46e5] hover:to-[#0284c7] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Chiến Dịch Mới</span>
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

      {/* ================= THẺ KPI CHIẾN DỊCH TỔNG QUAN ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0b1329]/70 border border-white/10 p-4 rounded-2xl backdrop-blur-xl">
          <div className="flex justify-between items-start text-slate-500 text-[10px] font-mono uppercase tracking-wider">
            <span>Tổng Chiến Dịch</span>
            <Layers className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div className="mt-3 text-2xl font-mono font-bold text-white leading-none">
            {meta.total}
          </div>
        </div>

        <div className="bg-[#0b1329]/70 border border-white/10 p-4 rounded-2xl backdrop-blur-xl">
          <div className="flex justify-between items-start text-slate-500 text-[10px] font-mono uppercase tracking-wider">
            <span>Email Đã Phát Tán</span>
            <Send className="w-4 h-4 text-[#00D98B]" />
          </div>
          <div className="mt-3 text-2xl font-mono font-bold text-emerald-400 leading-none">
            {totalSent.toLocaleString()}
          </div>
        </div>

        <div className="bg-[#0b1329]/70 border border-white/10 p-4 rounded-2xl backdrop-blur-xl">
          <div className="flex justify-between items-start text-slate-500 text-[10px] font-mono uppercase tracking-wider">
            <span>Đang Chạy Trong Queue</span>
            <Cpu className="w-4 h-4 text-[#dffe64]" />
          </div>
          <div className="mt-3 text-2xl font-mono font-bold text-[#dffe64] leading-none">
            {activeProcessing} <span className="text-xs text-slate-500 font-normal">luồng</span>
          </div>
        </div>

        <div className="bg-[#0b1329]/70 border border-white/10 p-4 rounded-2xl backdrop-blur-xl">
          <div className="flex justify-between items-start text-slate-500 text-[10px] font-mono uppercase tracking-wider">
            <span>Tỷ Lệ Mở Thư (Open Rate)</span>
            <Flame className="w-4 h-4 text-[#ec4899]" />
          </div>
          <div className="mt-3 text-2xl font-mono font-bold text-[#f472b6] leading-none">
            {avgOpenRate}%
          </div>
        </div>
      </div>

      {/* ================= SEARCH & STATUS FILTER ================= */}
      <div className="p-4 rounded-2xl bg-[#0b1329]/70 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên chiến dịch, mã ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#020617]/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none text-xs">
          {[
            { value: "ALL", label: "Tất Cả" },
            { value: "DRAFT", label: "Bản Nháp" },
            { value: "PROCESSING", label: "Đang Gửi" },
            { value: "COMPLETED", label: "Hoàn Thành" },
            { value: "FAILED", label: "Thất Bại" }
          ].map((st) => (
            <button
              key={st.value}
              onClick={() => setStatusFilter(st.value)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                statusFilter === st.value
                  ? "bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 font-bold"
                  : "bg-white/[0.02] text-[#94a3b8] hover:text-white border border-transparent"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🚀 HIỂN THỊ DỮ LIỆU: VIEWMODE 1 (GRID CARDS TRỰC QUAN)                   */}
      {/* ========================================================================= */}
      {viewMode === "grid" && (
        <>
          {loading && campaigns.length === 0 ? (
            <div className="py-20 text-center text-[#64748b] bg-[#0b1329]/40 rounded-2xl border border-white/5">
              <RefreshCw className="w-6 h-6 animate-spin text-[#38bdf8] mx-auto mb-3" />
              <p className="text-xs font-mono">Đang tải danh sách chiến dịch...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-20 text-center text-[#64748b] bg-[#0b1329]/40 rounded-2xl border border-white/5 space-y-3">
              <Send className="w-10 h-10 text-[#475569] mx-auto" />
              <p className="text-sm text-white font-medium">Chưa có chiến dịch nào được ghi nhận.</p>
              <p className="text-xs text-[#94a3b8]">Bấm "Tạo Chiến Dịch Mới" để phát động email marketing đầu tiên.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((camp) => {
                const id = camp._id || camp.id;
                const shortId = id ? id.toString().slice(-6).toUpperCase() : "CMP-X";
                const total = camp.stats?.totalRecipients || 0;
                const sent = camp.stats?.sentCount || 0;
                const opened = camp.stats?.openedCount || 0;
                const clicked = camp.stats?.clickedCount || 0;
                const percent = total > 0 ? Math.min(100, Math.round((sent / total) * 100)) : 0;
                const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;

                return (
                  <div
                    key={id}
                    onClick={() => setInspectingCampaign(camp)}
                    className="bg-[#0b1329]/75 border border-white/10 hover:border-[#38bdf8]/40 rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 group flex flex-col justify-between shadow-xl hover:shadow-[0_10px_35px_rgba(56,189,248,0.12)] cursor-pointer"
                  >
                    {/* Header Card với Mockup Mini Frame */}
                    <div className="relative h-44 bg-[#030712] overflow-hidden border-b border-white/10 group-hover:border-[#38bdf8]/30 transition-colors">
                      {/* Browser Header Bar */}
                      <div className="absolute top-0 inset-x-0 h-6 bg-[#060b18]/90 border-b border-white/5 flex items-center justify-between px-3 z-10">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                          <span className="text-[9px] font-mono text-[#64748b] ml-1 flex items-center gap-0.5">
                            <Hash className="w-2.5 h-2.5 text-[#38bdf8]" />
                            {shortId}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase font-mono ${
                            camp.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : camp.status === "PROCESSING" || camp.status === "QUEUED"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                              : camp.status === "FAILED"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-white/5 text-[#94a3b8] border border-white/10"
                          }`}
                        >
                          {camp.status}
                        </span>
                      </div>

                      {/* Mini Live Preview iframe */}
                      <div className="w-[600px] h-[550px] origin-top-left transform scale-[0.52] ml-3 mt-7 pointer-events-none select-none">
                        <iframe
                          title="mini-card-preview"
                          srcDoc={camp.contentHtml}
                          className="w-full h-full border-none pointer-events-none"
                          scrolling="no"
                          tabIndex="-1"
                        />
                      </div>

                      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#0b1329] via-[#0b1329]/80 to-transparent pointer-events-none" />
                    </div>

                    {/* Body Card */}
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-white group-hover:text-[#38bdf8] transition-colors truncate">
                            {camp.name}
                          </h3>
                          <span className="text-[10px] font-mono text-[#64748b] whitespace-nowrap">
                            {new Date(camp.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <p className="text-xs text-[#94a3b8] mt-0.5 line-clamp-1">
                          <span className="text-[#64748b]">Tiêu đề:</span> {camp.subject}
                        </p>
                      </div>

                      {/* Thông tin Phân khúc & Người gửi */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#94a3b8] bg-white/[0.02] border border-white/5 rounded-xl p-2">
                        <div className="flex items-center gap-1 truncate">
                          <Users className="w-3 h-3 text-[#38bdf8]" />
                          <span className="text-white font-bold">{camp.targetSegment || "ALL"}</span>
                          {camp.fromName && <span className="text-[#64748b]">({camp.fromName})</span>}
                        </div>
                        <span className="text-emerald-400 font-bold">{sent.toLocaleString()} gửi</span>
                      </div>

                      {/* Thanh Tiến Độ Phát Tán */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-[#64748b]">
                          <span>Tiến độ: {sent} / {total}</span>
                          <span className="text-[#38bdf8] font-bold">{percent}%</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              camp.status === "COMPLETED"
                                ? "bg-emerald-400"
                                : "bg-gradient-to-r from-[#6366f1] to-[#38bdf8]"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Tỷ lệ tương tác Opens & Clicks */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 font-mono text-center">
                        <div className="p-1.5 rounded-lg bg-white/[0.02]">
                          <span className="text-[9px] text-[#64748b] block uppercase">Lượt Mở (Opens)</span>
                          <span className="text-xs font-bold text-white">{opened} ({openRate}%)</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white/[0.02]">
                          <span className="text-[9px] text-[#64748b] block uppercase">Lượt Bấm (Clicks)</span>
                          <span className="text-xs font-bold text-[#38bdf8]">{clicked}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div
                      className="p-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setInspectingCampaign(camp)}
                        className="flex-1 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-[11px] font-medium transition-all flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#38bdf8]" />
                        <span>Chi Tiết</span>
                      </button>

                      {camp.status === "DRAFT" && (
                        <button
                          onClick={(e) => handleTriggerCampaign(id, camp.name, e)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] text-white text-[11px] font-bold flex items-center gap-1 hover:opacity-90 transition-all shadow-md"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Gửi</span>
                        </button>
                      )}

                      {(camp.status === "PROCESSING" || camp.status === "QUEUED" || camp.status === "COMPLETED") && (
                        <button
                          onClick={(e) => handleOpenQueueMonitor(camp, e)}
                          className="p-2 rounded-xl text-[#38bdf8] hover:bg-[#38bdf8]/10 transition-all"
                          title="Telemetry BullMQ"
                        >
                          <Cpu className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={(e) => handleDeleteCampaign(id, camp.name, e)}
                        disabled={camp.status === "PROCESSING"}
                        className="p-2 rounded-xl text-[#64748b] hover:text-red-400 hover:bg-red-500/10 disabled:opacity-20 transition-all"
                        title="Xóa chiến dịch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 🚀 HIỂN THỊ DỮ LIỆU: VIEWMODE 2 (BẢNG ĐO LƯỜNG TELEMETRY TABLE)          */}
      {/* ========================================================================= */}
      {viewMode === "table" && (
        <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase font-mono tracking-wider text-[#94a3b8] bg-white/[0.02]">
                  <th className="py-3.5 px-5">Mã ID & Chiến Dịch</th>
                  <th className="py-3.5 px-4">Đối Tượng Nhận</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4">Tiến Độ Phát Tán</th>
                  <th className="py-3.5 px-4">Tương Tác</th>
                  <th className="py-3.5 px-5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {loading && campaigns.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-[#64748b]">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#38bdf8] inline mr-2" />
                      Đang tải dữ liệu từ MongoDB Atlas...
                    </td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-[#64748b]">
                      Chưa có chiến dịch nào được ghi nhận.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((camp) => {
                    const id = camp._id || camp.id;
                    const shortId = id ? id.toString().slice(-6).toUpperCase() : "CMP-X";
                    const total = camp.stats?.totalRecipients || 0;
                    const sent = camp.stats?.sentCount || 0;
                    const opened = camp.stats?.openedCount || 0;
                    const clicked = camp.stats?.clickedCount || 0;
                    const percent = total > 0 ? Math.min(100, Math.round((sent / total) * 100)) : 0;

                    return (
                      <tr
                        key={id}
                        onClick={() => setInspectingCampaign(camp)}
                        className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-[#38bdf8] font-bold">
                              #{shortId}
                            </span>
                            <span className="font-sans font-bold text-white group-hover:text-[#38bdf8] transition-colors text-sm truncate">
                              {camp.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#64748b] truncate max-w-xs">
                            <span className="text-[#94a3b8]">Tiêu đề:</span> {camp.subject}
                          </div>
                          <div className="text-[10px] text-[#475569] mt-0.5">
                            {camp.fromName && <span>Gửi từ: {camp.fromName} • </span>}
                            {new Date(camp.createdAt).toLocaleDateString("vi-VN")}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-[11px]">
                          <span className="inline-block px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#cbd5e1] font-semibold">
                            {camp.targetSegment || "ALL"}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                              camp.status === "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : camp.status === "PROCESSING" || camp.status === "QUEUED"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                                : camp.status === "FAILED"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-white/5 text-[#94a3b8] border border-white/10"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                camp.status === "COMPLETED"
                                  ? "bg-emerald-400"
                                  : camp.status === "PROCESSING" || camp.status === "QUEUED"
                                  ? "bg-amber-400"
                                  : camp.status === "FAILED"
                                  ? "bg-red-400"
                                  : "bg-slate-400"
                              }`}
                            />
                            {camp.status}
                          </span>
                        </td>

                        <td className="py-4 px-4 min-w-[140px]">
                          <div className="flex justify-between text-[10px] text-[#94a3b8] mb-1">
                            <span>{sent} / {total}</span>
                            <span className="text-[#38bdf8] font-bold">{percent}%</span>
                          </div>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                camp.status === "COMPLETED"
                                  ? "bg-emerald-400"
                                  : "bg-gradient-to-r from-[#6366f1] to-[#38bdf8]"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </td>

                        <td className="py-4 px-4 text-[11px] text-[#94a3b8]">
                          <div className="flex items-center gap-3">
                            <div>
                              <span className="text-white font-bold">{opened}</span>
                              <span className="text-[10px] text-[#64748b] ml-1">opens</span>
                            </div>
                            <div>
                              <span className="text-[#38bdf8] font-bold">{clicked}</span>
                              <span className="text-[10px] text-[#64748b] ml-1">clicks</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {camp.status === "DRAFT" && (
                              <button
                                onClick={(e) => handleTriggerCampaign(id, camp.name, e)}
                                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] text-white text-[11px] font-bold flex items-center gap-1 hover:opacity-90 transition-all shadow-md"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Phát Tán</span>
                              </button>
                            )}

                            {(camp.status === "PROCESSING" || camp.status === "QUEUED" || camp.status === "COMPLETED") && (
                              <button
                                onClick={(e) => handleOpenQueueMonitor(camp, e)}
                                className="p-1.5 rounded-xl border border-white/10 hover:border-[#38bdf8]/40 text-[#38bdf8]"
                                title="Telemetry BullMQ"
                              >
                                <Cpu className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={(e) => handleDeleteCampaign(id, camp.name, e)}
                              disabled={camp.status === "PROCESSING"}
                              className="p-1.5 rounded-xl text-[#64748b] hover:text-red-400 hover:bg-red-500/10 disabled:opacity-20"
                              title="Xóa chiến dịch"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Phân trang */}
      <div className="p-4 rounded-2xl bg-[#0b1329]/70 border border-white/10 flex items-center justify-between text-xs text-[#94a3b8] font-mono">
        <div>
          Trang <span className="text-white font-bold">{meta.page}</span> / {meta.totalPages} (Tổng {meta.total} chiến dịch)
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={meta.page <= 1 || loading}
            onClick={() => fetchCampaigns(meta.page - 1)}
            className="p-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={meta.page >= meta.totalPages || loading}
            onClick={() => fetchCampaigns(meta.page + 1)}
            className="p-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🔍 DRAWER KHÁM PHÁ CHI TIẾT CHIẾN DỊCH (CAMPAIGN INSPECTOR DRAWER)         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {inspectingCampaign && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectingCampaign(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed top-3 right-3 bottom-3 w-full max-w-xl bg-[#08110F]/95 border border-white/15 backdrop-blur-3xl rounded-[24px] shadow-[0_0_60px_rgba(0,0,0,0.8)] z-50 p-6 flex flex-col justify-between overflow-hidden font-mono"
            >
              <div className="space-y-5 overflow-y-auto pr-1 flex-1">
                {/* Header Drawer */}
                <div className="flex justify-between items-start border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 border border-white/15 text-[#38bdf8] font-bold">
                        #{inspectingCampaign._id?.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">// CAMPAIGN DOSSIER</span>
                    </div>
                    <h2 className="text-base font-bold text-white font-sans">{inspectingCampaign.name}</h2>
                    <p className="text-xs text-[#94a3b8] mt-0.5">Tiêu đề: "{inspectingCampaign.subject}"</p>
                  </div>
                  <button
                    onClick={() => setInspectingCampaign(null)}
                    className="p-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 4 Thống kê Metrics */}
                <div className="grid grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <span className="text-[9px] text-[#64748b] uppercase block">Tổng Nhận</span>
                    <span className="text-base font-bold text-white mt-1 block">
                      {inspectingCampaign.stats?.totalRecipients || 0}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <span className="text-[9px] text-[#64748b] uppercase block">Đã Phát Tán</span>
                    <span className="text-base font-bold text-emerald-400 mt-1 block">
                      {inspectingCampaign.stats?.sentCount || 0}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <span className="text-[9px] text-[#64748b] uppercase block">Lượt Mở</span>
                    <span className="text-base font-bold text-[#dffe64] mt-1 block">
                      {inspectingCampaign.stats?.openedCount || 0}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <span className="text-[9px] text-[#64748b] uppercase block">Lượt Bấm</span>
                    <span className="text-base font-bold text-[#38bdf8] mt-1 block">
                      {inspectingCampaign.stats?.clickedCount || 0}
                    </span>
                  </div>
                </div>

                {/* Thông tin cấu hình chi tiết */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between pb-1.5 border-b border-white/5">
                    <span className="text-[#64748b]">Tên Người Gửi (From):</span>
                    <span className="text-white">{inspectingCampaign.fromName || "Mặc định hệ thống"}</span>
                  </div>
                  <div className="flex justify-between pb-1.5 border-b border-white/5">
                    <span className="text-[#64748b]">Phân Khúc Đích:</span>
                    <span className="text-[#38bdf8] font-bold">{inspectingCampaign.targetSegment || "ALL"}</span>
                  </div>
                  <div className="flex justify-between pb-1.5 border-b border-white/5">
                    <span className="text-[#64748b]">Thời Điểm Tạo:</span>
                    <span className="text-white">{new Date(inspectingCampaign.createdAt).toLocaleString("vi-VN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Trạng Thái Hiện Tại:</span>
                    <span className="text-emerald-400 font-bold">{inspectingCampaign.status}</span>
                  </div>
                </div>

                {/* Xem trước mẫu HTML thực tế */}
                <div className="space-y-2">
                  <span className="text-[10px] text-[#64748b] uppercase tracking-wider block">
                    // Bản Xem Trước Mẫu Email Thực Tế
                  </span>
                  <div className="h-72 border border-white/10 rounded-xl overflow-hidden bg-white">
                    <iframe
                      title="drawer-full-preview"
                      srcDoc={inspectingCampaign.contentHtml}
                      className="w-full h-full border-none"
                    />
                  </div>
                </div>
              </div>

              {/* Chân Drawer */}
              <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                {inspectingCampaign.status === "DRAFT" && (
                  <button
                    onClick={(e) => {
                      const id = inspectingCampaign._id || inspectingCampaign.id;
                      const name = inspectingCampaign.name;
                      setInspectingCampaign(null);
                      handleTriggerCampaign(id, name, e);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Phát Tán Ngay</span>
                  </button>
                )}

                {(inspectingCampaign.status === "PROCESSING" || inspectingCampaign.status === "QUEUED" || inspectingCampaign.status === "COMPLETED") && (
                  <button
                    onClick={(e) => {
                      const c = inspectingCampaign;
                      setInspectingCampaign(null);
                      handleOpenQueueMonitor(c, e);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#38bdf8] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-[#38bdf8]/30"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Xem Cụm Queue Realtime</span>
                  </button>
                )}

                <button
                  onClick={(e) => {
                    const id = inspectingCampaign._id || inspectingCampaign.id;
                    const name = inspectingCampaign.name;
                    handleDeleteCampaign(id, name, e);
                  }}
                  className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                  title="Xóa chiến dịch này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 🚀 MODAL CAMPAIGN WIZARD (TRÌNH TẠO 4 BƯỚC)                               */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isWizardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010409]/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-4xl bg-[#0b1329] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
            >
              <div className="p-5 border-b border-white/10 bg-[#060b18] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#38bdf8]" />
                    Khởi Tạo Chiến Dịch Email Mới
                  </h2>
                  <span className="text-[11px] text-[#64748b]">
                    Bước {wizardStep} / 4:{" "}
                    {wizardStep === 1
                      ? "Thông Tin Cơ Bản"
                      : wizardStep === 2
                      ? "Chọn Khán Giả Mục Tiêu"
                      : wizardStep === 3
                      ? "Chọn Mẫu Thư (Templates)"
                      : "Xác Nhận & Đưa Vào Hàng Đợi"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all ${
                        wizardStep === s
                          ? "bg-[#38bdf8] text-[#020617] ring-4 ring-[#38bdf8]/20"
                          : wizardStep > s
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-white/5 text-[#64748b]"
                      }`}
                    >
                      {wizardStep > s ? <Check className="w-3.5 h-3.5" /> : s}
                    </div>
                  ))}
                  <button onClick={() => setIsWizardOpen(false)} className="ml-4 text-[#64748b] hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
                {wizardStep === 1 && (
                  <div className="space-y-4 max-w-xl mx-auto">
                    <div>
                      <label className="block text-[#cbd5e1] font-semibold mb-1.5 uppercase text-[10px]">
                        Tên Chiến Dịch (*)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Flash Sale Mùa Thu 2026"
                        value={wizardData.name}
                        onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                        className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#38bdf8]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#cbd5e1] font-semibold mb-1.5 uppercase text-[10px]">
                        Tên Người Gửi Hiển Thị (From Name)
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: VERDIO VIP Customer Success"
                        value={wizardData.fromName}
                        onChange={(e) => setWizardData({ ...wizardData, fromName: e.target.value })}
                        className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#38bdf8]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#cbd5e1] font-semibold mb-1.5 uppercase text-[10px]">
                        Tiêu Đề Email Người Nhận Thấy (Subject) (*)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Ưu đãi độc quyền dành riêng cho {{firstName}}"
                        value={wizardData.subject}
                        onChange={(e) => setWizardData({ ...wizardData, subject: e.target.value })}
                        className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#38bdf8]"
                      />
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4 max-w-xl mx-auto">
                    <div>
                      <label className="block text-[#cbd5e1] font-semibold mb-2 uppercase text-[10px]">
                        Chọn Phân Khúc Nhận Thư (Target Segment)
                      </label>
                      <div className="space-y-2">
                        {SEGMENT_OPTIONS.map((seg) => (
                          <div
                            key={seg.value}
                            onClick={() => setWizardData({ ...wizardData, targetSegment: seg.value })}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              wizardData.targetSegment === seg.value
                                ? "bg-[#38bdf8]/10 border-[#38bdf8] text-white"
                                : "bg-white/[0.02] border-white/5 text-[#94a3b8] hover:bg-white/[0.04]"
                            }`}
                          >
                            <div>
                              <div className="font-bold text-xs">{seg.label}</div>
                              <span className="text-[10px] text-[#64748b] font-mono">Segment: {seg.value}</span>
                            </div>
                            {wizardData.targetSegment === seg.value && (
                              <Check className="w-4 h-4 text-[#38bdf8]" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#cbd5e1] font-semibold mb-1.5 uppercase text-[10px]">
                        Lọc Bổ Sung Theo Thẻ Nhãn (Tags - Tùy chọn)
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: VIP_2026, SAAS_DEMO"
                        value={wizardData.targetTags}
                        onChange={(e) => setWizardData({ ...wizardData, targetTags: e.target.value })}
                        className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#38bdf8]"
                      />
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[#cbd5e1] font-semibold uppercase text-[10px]">
                        Chọn một mẫu thiết kế từ kho thư viện của bạn
                      </span>
                      <span className="text-[11px] text-[#38bdf8]">
                        Đã chọn: {wizardData.templateId ? "1 Mẫu" : "Chưa chọn"}
                      </span>
                    </div>

                    {loadingTemplates ? (
                      <div className="py-16 text-center text-[#64748b]">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#38bdf8] mx-auto mb-2" />
                        <span>Đang tải kho mẫu thư...</span>
                      </div>
                    ) : templates.length === 0 ? (
                      <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                        <FileCode2 className="w-8 h-8 text-[#64748b] mx-auto" />
                        <p className="text-white font-medium">Kho mẫu thư của bạn đang trống.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-1">
                        {templates.map((tpl) => {
                          const id = tpl._id || tpl.id;
                          const isSelected = wizardData.templateId === id;
                          return (
                            <div
                              key={id}
                              onClick={() => handleSelectTemplate(tpl)}
                              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                                isSelected
                                  ? "bg-[#38bdf8]/15 border-[#38bdf8] shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                                  : "bg-white/[0.02] border-white/10 hover:border-white/20"
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/10 text-[#38bdf8]">
                                    {tpl.category || "MARKETING"}
                                  </span>
                                  {isSelected && <CheckCircle2 className="w-4 h-4 text-[#38bdf8]" />}
                                </div>
                                <h4 className="font-bold text-white text-xs truncate">{tpl.name}</h4>
                                <p className="text-[10px] text-[#64748b] line-clamp-1">{tpl.subject}</p>
                              </div>
                              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-[#94a3b8]">
                                <span>Gắn vào chiến dịch</span>
                                <ExternalLink className="w-3 h-3" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {wizardStep === 4 && (
                  <div className="space-y-4 max-w-xl mx-auto">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2.5 text-xs font-mono">
                      <div className="flex justify-between pb-2 border-b border-white/5">
                        <span className="text-[#64748b]">Tên Chiến Dịch:</span>
                        <span className="text-white font-bold">{wizardData.name}</span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-white/5">
                        <span className="text-[#64748b]">Người Gửi:</span>
                        <span className="text-[#38bdf8]">{wizardData.fromName}</span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-white/5">
                        <span className="text-[#64748b]">Tiêu Đề Thư:</span>
                        <span className="text-white">{wizardData.subject}</span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-white/5">
                        <span className="text-[#64748b]">Phân Khúc Nhận:</span>
                        <span className="text-emerald-400 font-bold">{wizardData.targetSegment}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#6366f1]/10 to-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-start gap-2.5 text-xs">
                      <Sparkles className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5" />
                      <div className="text-[#cbd5e1] leading-relaxed">
                        Hệ thống tự động gắn kèm <strong>Tracking Pixel 1x1</strong> và <strong>Click Redirectors</strong> để đo lường tỷ lệ chuyển đổi trực tiếp.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/10 bg-[#060b18] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))}
                  disabled={wizardStep === 1}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-[#94a3b8] disabled:opacity-20 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay Lại</span>
                </button>

                <div className="flex items-center gap-3">
                  {wizardStep < 4 ? (
                    <button
                      type="button"
                      disabled={
                        (wizardStep === 1 && (!wizardData.name || !wizardData.subject)) ||
                        (wizardStep === 3 && !wizardData.contentHtml)
                      }
                      onClick={() => setWizardStep((prev) => Math.min(4, prev + 1))}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-30"
                    >
                      <span>Tiếp Tục</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleSaveCampaign(false)}
                        className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs font-semibold"
                      >
                        Lưu Bản Nháp
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleSaveCampaign(true)}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-[#38bdf8] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{submitting ? "Đang đẩy vào Redis..." : "Phát Tán Ngay"}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 📡 MODAL GIÁM SÁT REAL-TIME QUEUE (BULLMQ HUD)                             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {monitoringCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010409]/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#0b1329] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-mono"
            >
              <div className="p-4 border-b border-white/10 bg-[#060b18] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    BullMQ Telemetry: {monitoringCampaign.name}
                  </h3>
                </div>
                <button onClick={handleCloseQueueMonitor} className="text-[#64748b] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5 text-xs">
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <span className="text-[10px] text-[#64748b] uppercase block">Đang Chờ (Waiting)</span>
                    <span className="text-lg font-bold text-amber-400 mt-1 block">
                      {queueStatus?.waiting ?? "—"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <span className="text-[10px] text-[#64748b] uppercase block">Đang Gửi (Active)</span>
                    <span className="text-lg font-bold text-[#38bdf8] mt-1 block">
                      {queueStatus?.active ?? "—"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <span className="text-[10px] text-[#64748b] uppercase block">Thành Công</span>
                    <span className="text-lg font-bold text-emerald-400 mt-1 block">
                      {queueStatus?.completed ?? "—"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <span className="text-[10px] text-[#64748b] uppercase block">Thất Bại</span>
                    <span className="text-lg font-bold text-red-400 mt-1 block">
                      {queueStatus?.failed ?? 0}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-around">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 uppercase">Lượt Mở (Opened)</span>
                    <div className="text-xl font-black text-white mt-0.5">
                      {queueStatus?.opened ?? 0}
                    </div>
                  </div>
                  <div className="w-[1px] h-8 bg-white/10" />
                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 uppercase">Lượt Click</span>
                    <div className="text-xl font-black text-[#38bdf8] mt-0.5">
                      {queueStatus?.clicked ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 border-t border-white/10 bg-[#060b18] text-right">
                <button
                  onClick={handleCloseQueueMonitor}
                  className="px-4 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs text-white"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}