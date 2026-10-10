import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import {
  GitFork,
  Zap,
  Clock,
  Mail,
  Tag,
  Users,
  Play,
  Pause,
  Trash2,
  Edit3,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Check,
  X,
  ArrowDown,
  ArrowUp,
  Sparkles,
  Cpu,
  Layers,
  Activity,
  SlidersHorizontal,
  ChevronRight
} from "lucide-react";

const TRIGGER_TYPES = [
  {
    type: "CONTACT_CREATED",
    label: "Khách Hàng Mới Được Tạo",
    desc: "Tự động kích hoạt ngay khi một liên hệ mới được thêm vào danh bạ qua form hoặc import CSV"
  },
  {
    type: "SEGMENT_JOINED",
    label: "Khách Gia Nhập Phân Khúc",
    desc: "Kích hoạt khi khách hàng được cập nhật vào phân khúc chỉ định (ví dụ: nhóm VIP)"
  },
  {
    type: "TAG_ADDED",
    label: "Khách Được Gắn Thẻ Nhãn",
    desc: "Kích hoạt khi khách hàng được gán thêm một thẻ nhãn cụ thể"
  }
];

export default function Automations() {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ==========================================
  // VISUAL BUILDER STATE
  // ==========================================
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [templates, setTemplates] = useState([]);

  const [builderData, setBuilderData] = useState({
    name: "",
    description: "",
    trigger: {
      type: "CONTACT_CREATED",
      config: { segment: "ALL", tag: "" }
    },
    steps: []
  });

  // ==========================================
  // 1. TẢI DANH SÁCH TỪ BACKEND
  // ==========================================
  const fetchAutomations = useCallback(async (page = 1) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = {
        page,
        limit: meta.limit,
        search: search.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined
      };
      const res = await api.get("/automations", { params });
      const data = res.data?.data || [];
      const metaData = res.data?.meta || {
        page,
        limit: meta.limit,
        total: data.length,
        totalPages: Math.ceil(data.length / meta.limit) || 1
      };
      setAutomations(data);
      setMeta(metaData);
    } catch (err) {
      console.error("Lỗi tải kịch bản:", err);
      setErrorMsg(err.response?.data?.message || "Không thể tải danh sách kịch bản.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, meta.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAutomations(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchAutomations]);

  // Tải danh sách Template để dùng cho bước Gửi Email
  const fetchTemplates = async () => {
    try {
      const res = await api.get("/templates?limit=50");
      setTemplates(res.data?.data || []);
    } catch (err) {
      console.error("Lỗi tải templates:", err);
    }
  };

  // ==========================================
  // 2. MỞ TRÌNH DỰNG WORKFLOW
  // ==========================================
  const handleOpenCreate = () => {
    setEditingId(null);
    setBuilderData({
      name: "",
      description: "",
      trigger: {
        type: "CONTACT_CREATED",
        config: { segment: "ALL", tag: "" }
      },
      steps: [
        {
          id: `step-${Date.now()}-1`,
          type: "SEND_EMAIL",
          config: {
            templateId: "",
            delayValue: 1,
            delayUnit: "HOURS",
            tag: "",
            segment: "LEADS"
          }
        }
      ]
    });
    fetchTemplates();
    setIsBuilderOpen(true);
  };

  const handleOpenEdit = (auto) => {
    setEditingId(auto._id || auto.id);
    setBuilderData({
      name: auto.name || "",
      description: auto.description || "",
      trigger: auto.trigger || {
        type: "CONTACT_CREATED",
        config: { segment: "ALL", tag: "" }
      },
      steps: (auto.steps || []).map((s) => ({
        id: s.id || `step-${Math.random()}`,
        type: s.type,
        config: {
          templateId: s.config?.templateId?._id || s.config?.templateId || "",
          delayValue: s.config?.delayValue || 1,
          delayUnit: s.config?.delayUnit || "HOURS",
          tag: s.config?.tag || "",
          segment: s.config?.segment || "LEADS"
        }
      }))
    });
    fetchTemplates();
    setIsBuilderOpen(true);
  };

  // ==========================================
  // 3. THAO TÁC TRÊN NODE BƯỚC (STEP ACTIONS)
  // ==========================================
  const handleAddStep = (type) => {
    const newStep = {
      id: `step-${Date.now()}`,
      type,
      config: {
        templateId: templates[0]?._id || "",
        delayValue: 1,
        delayUnit: "DAYS",
        tag: "ONBOARDED",
        segment: "CUSTOMERS"
      }
    };
    setBuilderData((prev) => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const handleUpdateStepConfig = (stepId, newConfig) => {
    setBuilderData((prev) => ({
      ...prev,
      steps: prev.steps.map((s) =>
        s.id === stepId ? { ...s, config: { ...s.config, ...newConfig } } : s
      )
    }));
  };

  const handleMoveStep = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= builderData.steps.length) return;
    const nextSteps = [...builderData.steps];
    const temp = nextSteps[idx];
    nextSteps[idx] = nextSteps[targetIdx];
    nextSteps[targetIdx] = temp;
    setBuilderData((prev) => ({ ...prev, steps: nextSteps }));
  };

  const handleDeleteStep = (stepId) => {
    setBuilderData((prev) => ({
      ...prev,
      steps: prev.steps.filter((s) => s.id !== stepId)
    }));
  };

  // ==========================================
  // 4. LƯU & CHUYỂN ĐỔI TRẠNG THÁI
  // ==========================================
  const handleSaveWorkflow = async (activate = false) => {
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        name: builderData.name.trim(),
        description: builderData.description.trim(),
        trigger: builderData.trigger,
        steps: builderData.steps
      };

      if (editingId) {
        await api.put(`/automations/${editingId}`, payload);
        if (activate) {
          await api.patch(`/automations/${editingId}/toggle-status`);
        }
        setSuccessMsg(`Cập nhật kịch bản "${payload.name}" thành công!`);
      } else {
        const res = await api.post("/automations", payload);
        const createdId = res.data?.data?._id || res.data?.data?.id;
        if (activate && createdId) {
          await api.patch(`/automations/${createdId}/toggle-status`);
        }
        setSuccessMsg(`Tạo kịch bản tự động "${payload.name}" thành công!`);
      }

      setIsBuilderOpen(false);
      fetchAutomations(meta.page);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Không thể lưu kịch bản.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, name, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.patch(`/automations/${id}/toggle-status`);
      const updated = res.data?.data;
      setSuccessMsg(`Kịch bản "${name}" hiện đang: ${updated?.status}`);
      fetchAutomations(meta.page);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Không thể thay đổi trạng thái kịch bản.");
    }
  };

  const handleDeleteAutomation = async (id, name, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Xác nhận xóa vĩnh viễn kịch bản "${name}"?`)) return;

    try {
      await api.delete(`/automations/${id}`);
      setAutomations((prev) => prev.filter((a) => (a._id || a.id) !== id));
      setSuccessMsg(`Đã xóa kịch bản "${name}"`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Không thể xóa kịch bản này.");
    }
  };

  // KPI Metrics
  const activeCount = useMemo(() => automations.filter((a) => a.status === "ACTIVE").length, [automations]);
  const totalEntered = useMemo(() => automations.reduce((acc, a) => acc + (a.stats?.totalEntered || 0), 0), [automations]);
  const totalCompleted = useMemo(() => automations.reduce((acc, a) => acc + (a.stats?.totalCompleted || 0), 0), [automations]);

  return (
    <div className="space-y-6 font-sans select-none text-slate-300 relative">
      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <GitFork className="w-6 h-6 text-[#38bdf8]" />
              Kịch Bản Tự Động (Automations)
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8] text-[10px] font-mono font-bold">
              EVENT-DRIVEN ENGINE
            </span>
          </div>
          <p className="text-xs text-[#94a3b8]">
            Thiết lập chuỗi phễu chăm sóc khách hàng tự động theo sự kiện, thời gian chờ và điều kiện phân khúc
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAutomations(meta.page)}
            className="p-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-[#94a3b8] hover:text-white transition-all"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#38bdf8]" : ""}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] hover:from-[#4f46e5] hover:to-[#0284c7] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Kịch Bản Mới</span>
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

      {/* ================= THẺ KPI TELEMETRY ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0b1329]/70 border border-white/10 p-4 rounded-2xl backdrop-blur-xl">
          <div className="flex justify-between items-start text-slate-500 text-[10px] font-mono uppercase tracking-wider">
            <span>Tổng Kịch Bản</span>
            <Layers className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div className="mt-3 text-2xl font-mono font-bold text-white leading-none">
            {meta.total}
          </div>
        </div>

        <div className="bg-[#0b1329]/70 border border-white/10 p-4 rounded-2xl backdrop-blur-xl">
          <div className="flex justify-between items-start text-slate-500 text-[10px] font-mono uppercase tracking-wider">
            <span>Đang Chạy Tự Động</span>
            <Activity className="w-4 h-4 text-[#10b981]" />
          </div>
          <div className="mt-3 text-2xl font-mono font-bold text-emerald-400 leading-none">
            {activeCount} <span className="text-xs text-slate-500 font-normal">luồng</span>
          </div>
        </div>

        <div className="bg-[#0b1329]/70 border border-white/10 p-4 rounded-2xl backdrop-blur-xl">
          <div className="flex justify-between items-start text-slate-500 text-[10px] font-mono uppercase tracking-wider">
            <span>Đã Vào Phễu</span>
            <Users className="w-4 h-4 text-[#dffe64]" />
          </div>
          <div className="mt-3 text-2xl font-mono font-bold text-[#dffe64] leading-none">
            {totalEntered.toLocaleString()}
          </div>
        </div>

        <div className="bg-[#0b1329]/70 border border-white/10 p-4 rounded-2xl backdrop-blur-xl">
          <div className="flex justify-between items-start text-slate-500 text-[10px] font-mono uppercase tracking-wider">
            <span>Đã Hoàn Tất Chuỗi</span>
            <CheckCircle2 className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div className="mt-3 text-2xl font-mono font-bold text-[#38bdf8] leading-none">
            {totalCompleted.toLocaleString()}
          </div>
        </div>
      </div>

      {/* ================= SEARCH & STATUS FILTER ================= */}
      <div className="p-4 rounded-2xl bg-[#0b1329]/70 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên kịch bản..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#020617]/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none text-xs">
          {[
            { value: "ALL", label: "Tất Cả" },
            { value: "ACTIVE", label: "Đang Kích Hoạt" },
            { value: "PAUSED", label: "Tạm Dừng" },
            { value: "DRAFT", label: "Bản Nháp" }
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

      {/* ================= DANH SÁCH THẺ KỊCH BẢN ================= */}
      {loading && automations.length === 0 ? (
        <div className="py-20 text-center text-[#64748b] bg-[#0b1329]/40 rounded-2xl border border-white/5">
          <RefreshCw className="w-6 h-6 animate-spin text-[#38bdf8] mx-auto mb-3" />
          <p className="text-xs font-mono">Đang tải danh sách kịch bản tự động hóa...</p>
        </div>
      ) : automations.length === 0 ? (
        <div className="py-20 text-center text-[#64748b] bg-[#0b1329]/40 rounded-2xl border border-white/5 space-y-3">
          <GitFork className="w-10 h-10 text-[#475569] mx-auto" />
          <p className="text-sm text-white font-medium">Chưa có kịch bản tự động hóa nào.</p>
          <p className="text-xs text-[#94a3b8]">Bấm "Tạo Kịch Bản Mới" để xây dựng phễu email marketing đầu tiên.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {automations.map((auto) => {
            const id = auto._id || auto.id;
            const stepCount = auto.steps?.length || 0;
            const isActive = auto.status === "ACTIVE";

            return (
              <div
                key={id}
                className="bg-[#0b1329]/75 border border-white/10 hover:border-[#38bdf8]/40 rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 group flex flex-col justify-between shadow-xl"
              >
                {/* Header Card */}
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider font-mono ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : auto.status === "PAUSED"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-white/5 text-[#94a3b8] border border-white/10"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive
                            ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]"
                            : auto.status === "PAUSED"
                            ? "bg-amber-400"
                            : "bg-slate-400"
                        }`}
                      />
                      {auto.status}
                    </span>

                    <span className="text-[10px] font-mono text-[#64748b]">
                      {new Date(auto.updatedAt || auto.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>

                  <div>
                    <h3
                      onClick={() => handleOpenEdit(auto)}
                      className="text-sm font-bold text-white group-hover:text-[#38bdf8] transition-colors truncate cursor-pointer"
                    >
                      {auto.name}
                    </h3>
                    <p className="text-xs text-[#94a3b8] mt-1 line-clamp-2">
                      {auto.description || "Kịch bản tự động hóa điều phối sự kiện tiếp thị."}
                    </p>
                  </div>

                  {/* Trigger Banner */}
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-[#38bdf8] font-mono text-[10px] font-bold">
                      <Zap className="w-3 h-3" />
                      <span>TRIGGER: {auto.trigger?.type}</span>
                    </div>
                    <div className="text-[11px] text-[#64748b]">
                      Chuỗi gồm: <span className="text-white font-bold">{stepCount} bước</span> hành động
                    </div>
                  </div>

                  {/* Thống kê Vào/Ra Phễu */}
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-center text-xs">
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[9px] text-[#64748b] block uppercase">Đã Vào</span>
                      <span className="font-bold text-white mt-0.5 block">{auto.stats?.totalEntered || 0}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[9px] text-[#64748b] block uppercase">Hoàn Tất</span>
                      <span className="font-bold text-emerald-400 mt-0.5 block">{auto.stats?.totalCompleted || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenEdit(auto)}
                    className="flex-1 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Sửa Chuỗi Luồng</span>
                  </button>

                  <button
                    onClick={(e) => handleToggleStatus(id, auto.name, e)}
                    className={`p-2 rounded-xl transition-all ${
                      isActive
                        ? "text-amber-400 hover:bg-amber-500/10 border border-amber-500/20"
                        : "text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20"
                    }`}
                    title={isActive ? "Tạm dừng kịch bản" : "Kích hoạt chạy tự động"}
                  >
                    {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={(e) => handleDeleteAutomation(id, auto.name, e)}
                    disabled={isActive}
                    className="p-2 rounded-xl text-[#64748b] hover:text-red-400 hover:bg-red-500/10 disabled:opacity-20 transition-all"
                    title="Xóa kịch bản"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 MODAL TRÌNH DỰNG WORKFLOW TRỰC QUAN (VISUAL FLOW CANVAS STUDIO)          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isBuilderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#010409]/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-5xl h-[92vh] bg-[#0b1329] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Studio Header */}
              <div className="h-14 px-6 border-b border-white/10 bg-[#060b18] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
                    <GitFork className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      {editingId ? "Hiệu Chỉnh Chuỗi Tự Động Hóa" : "Thiết Kế Kịch Bản Mới"}
                    </h2>
                    <span className="text-[10px] text-[#38bdf8] font-mono">Visual Event Workflow Studio</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsBuilderOpen(false)}
                  className="p-2 rounded-xl text-[#64748b] hover:text-white hover:bg-white/5 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Thông tin cơ bản kịch bản */}
              <div className="p-4 border-b border-white/10 bg-white/[0.01] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs shrink-0">
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-semibold uppercase text-[9px]">Tên Kịch Bản (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Phễu Chào Mừng & Onboarding 7 Ngày"
                    value={builderData.name}
                    onChange={(e) => setBuilderData({ ...builderData, name: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#38bdf8]"
                  />
                </div>
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-semibold uppercase text-[9px]">Mô Tả Kịch Bản</label>
                  <input
                    type="text"
                    placeholder="Ghi chú mục tiêu chuyển đổi của phễu..."
                    value={builderData.description}
                    onChange={(e) => setBuilderData({ ...builderData, description: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#38bdf8]"
                  />
                </div>
              </div>

              {/* KHU VỰC SƠ ĐỒ CHUỖI NODE TRỰC QUAN (FLOW CANVAS) */}
              <div className="flex-1 overflow-y-auto p-6 bg-[#030712] flex flex-col items-center space-y-4">
                {/* 1. TRIGGER NODE (ĐIỂM XUẤT PHÁT) */}
                <div className="w-full max-w-xl bg-gradient-to-r from-[#6366f1]/15 to-[#38bdf8]/15 border border-[#38bdf8]/40 rounded-2xl p-4 shadow-[0_0_30px_rgba(56,189,248,0.15)] relative">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-[#38bdf8]/20 text-[#38bdf8]">
                        <Zap className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        // BỘ KÍCH HOẠT (TRIGGER)
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] font-bold">
                      START NODE
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <select
                      value={builderData.trigger.type}
                      onChange={(e) =>
                        setBuilderData({
                          ...builderData,
                          trigger: { ...builderData.trigger, type: e.target.value }
                        })
                      }
                      className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#38bdf8] cursor-pointer"
                    >
                      {TRIGGER_TYPES.map((t) => (
                        <option key={t.type} value={t.type}>
                          {t.label}
                        </option>
                      ))}
                    </select>

                    <p className="text-[11px] text-[#94a3b8] italic">
                      * {TRIGGER_TYPES.find((t) => t.type === builderData.trigger.type)?.desc}
                    </p>
                  </div>
                </div>

                {/* Dây nối phát sáng từ Trigger xuống các bước */}
                <div className="w-0.5 h-6 bg-gradient-to-b from-[#38bdf8] to-white/20 relative">
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                </div>

                {/* 2. CÁC BƯỚC HÀNH ĐỘNG (ACTION STEPS) */}
                {builderData.steps.map((step, idx) => (
                  <React.Fragment key={step.id}>
                    <div className="w-full max-w-xl bg-[#0b1329]/90 border border-white/10 hover:border-white/25 rounded-2xl p-4 shadow-xl relative transition-all group">
                      {/* Step Header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-lg ${
                              step.type === "SEND_EMAIL"
                                ? "bg-[#38bdf8]/20 text-[#38bdf8]"
                                : step.type === "DELAY"
                                ? "bg-amber-500/20 text-amber-400"
                                : step.type === "ADD_TAG"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-indigo-500/20 text-indigo-400"
                            }`}
                          >
                            {step.type === "SEND_EMAIL" && <Mail className="w-4 h-4" />}
                            {step.type === "DELAY" && <Clock className="w-4 h-4" />}
                            {step.type === "ADD_TAG" && <Tag className="w-4 h-4" />}
                            {step.type === "UPDATE_SEGMENT" && <Users className="w-4 h-4" />}
                          </span>

                          <div>
                            <span className="text-xs font-bold text-white">
                              Bước {idx + 1}:{" "}
                              {step.type === "SEND_EMAIL"
                                ? "Tự Động Gửi Email"
                                : step.type === "DELAY"
                                ? "Tạm Dừng Chờ (Delay)"
                                : step.type === "ADD_TAG"
                                ? "Gắn Thẻ Nhận Diện"
                                : "Chuyển Phân Khúc"}
                            </span>
                            <span className="text-[10px] text-[#64748b] block font-mono">ID: {step.id}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveStep(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-white/10 text-[#64748b] hover:text-white disabled:opacity-20"
                            title="Lên trên"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveStep(idx, 1)}
                            disabled={idx === builderData.steps.length - 1}
                            className="p-1 rounded hover:bg-white/10 text-[#64748b] hover:text-white disabled:opacity-20"
                            title="Xuống dưới"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStep(step.id)}
                            className="p-1 rounded hover:bg-red-500/10 text-[#64748b] hover:text-red-400"
                            title="Xóa bước này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Step Configuration Body */}
                      <div className="mt-3 text-xs space-y-2">
                        {step.type === "SEND_EMAIL" && (
                          <div>
                            <label className="block text-[#94a3b8] mb-1 font-semibold text-[10px] uppercase">
                              Chọn Mẫu Email Gửi Cho Khách:
                            </label>
                            <select
                              value={step.config.templateId}
                              onChange={(e) => handleUpdateStepConfig(step.id, { templateId: e.target.value })}
                              className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#38bdf8] cursor-pointer"
                            >
                              <option value="">-- Chọn từ kho mẫu thư của bạn --</option>
                              {templates.map((tpl) => (
                                <option key={tpl._id || tpl.id} value={tpl._id || tpl.id}>
                                  {tpl.name} ({tpl.subject})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {step.type === "DELAY" && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[#94a3b8] mb-1 font-semibold text-[10px] uppercase">
                                Thời Gian Chờ:
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={step.config.delayValue}
                                onChange={(e) =>
                                  handleUpdateStepConfig(step.id, { delayValue: Number(e.target.value) })
                                }
                                className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#38bdf8]"
                              />
                            </div>
                            <div>
                              <label className="block text-[#94a3b8] mb-1 font-semibold text-[10px] uppercase">
                                Đơn Vị:
                              </label>
                              <select
                                value={step.config.delayUnit}
                                onChange={(e) => handleUpdateStepConfig(step.id, { delayUnit: e.target.value })}
                                className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#38bdf8] cursor-pointer"
                              >
                                <option value="MINUTES">Phút (Minutes)</option>
                                <option value="HOURS">Giờ (Hours)</option>
                                <option value="DAYS">Ngày (Days)</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {step.type === "ADD_TAG" && (
                          <div>
                            <label className="block text-[#94a3b8] mb-1 font-semibold text-[10px] uppercase">
                              Tên Thẻ Nhãn Cần Gán:
                            </label>
                            <input
                              type="text"
                              placeholder="Ví dụ: ONBOARDED, VIP_PROSPECT"
                              value={step.config.tag}
                              onChange={(e) => handleUpdateStepConfig(step.id, { tag: e.target.value })}
                              className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#38bdf8]"
                            />
                          </div>
                        )}

                        {step.type === "UPDATE_SEGMENT" && (
                          <div>
                            <label className="block text-[#94a3b8] mb-1 font-semibold text-[10px] uppercase">
                              Chuyển Sang Phân Khúc Mới:
                            </label>
                            <select
                              value={step.config.segment}
                              onChange={(e) => handleUpdateStepConfig(step.id, { segment: e.target.value })}
                              className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#38bdf8] cursor-pointer"
                            >
                              <option value="LEADS">LEADS (Tiềm năng)</option>
                              <option value="CUSTOMERS">CUSTOMERS (Khách hàng)</option>
                              <option value="VIP">VIP (Khách đặc quyền)</option>
                              <option value="ENTERPRISE">ENTERPRISE (Doanh nghiệp)</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dây nối giữa các bước */}
                    {idx < builderData.steps.length - 1 && (
                      <div className="w-0.5 h-6 bg-gradient-to-b from-[#38bdf8]/60 to-white/20 relative">
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                      </div>
                    )}
                  </React.Fragment>
                ))}

                {/* 3. THANH THÊM BƯỚC MỚI */}
                <div className="w-full max-w-xl pt-4 border-t border-white/10 flex flex-col items-center space-y-2 select-none">
                  <span className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider">
                    + Thêm Bước Hành Động Tiếp Theo
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {[
                      { type: "SEND_EMAIL", label: "Gửi Email", icon: Mail },
                      { type: "DELAY", label: "Hẹn Giờ Chờ", icon: Clock },
                      { type: "ADD_TAG", label: "Gắn Thẻ Nhãn", icon: Tag },
                      { type: "UPDATE_SEGMENT", label: "Chuyển Nhóm", icon: Users }
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => handleAddStep(item.type)}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-[#38bdf8]/15 border border-white/10 hover:border-[#38bdf8]/30 text-xs text-[#cbd5e1] hover:text-[#38bdf8] transition-all flex items-center gap-1.5"
                      >
                        <item.icon className="w-3.5 h-3.5 text-[#38bdf8]" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Studio Footer */}
              <div className="h-16 px-6 border-t border-white/10 bg-[#060b18] flex items-center justify-between shrink-0">
                <span className="text-xs text-[#64748b]">
                  * Các bước sẽ được thực thi tự động tuần tự từ trên xuống dưới.
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBuilderOpen(false)}
                    className="px-4 py-2 rounded-xl hover:bg-white/5 text-xs text-[#94a3b8]"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="button"
                    disabled={submitting || !builderData.name}
                    onClick={() => handleSaveWorkflow(false)}
                    className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs font-semibold"
                  >
                    Lưu Bản Nháp
                  </button>
                  <button
                    type="button"
                    disabled={submitting || !builderData.name || builderData.steps.length === 0}
                    onClick={() => handleSaveWorkflow(true)}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-[#38bdf8] text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{submitting ? "Đang Lưu..." : "Kích Hoạt Ngay"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}