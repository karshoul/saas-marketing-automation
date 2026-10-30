import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import {
  Users,
  UserCheck,
  UserPlus,
  Award,
  Target,
  UserMinus,
  Search,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Sparkles,
  PieChart as PieIcon,
  Landmark,
  RefreshCw,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  Mail,
  Phone,
  Building2,
  Tag,
  SlidersHorizontal,
  ExternalLink
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip
} from "recharts";

export default function Contacts() {
  // ==========================================
  // STATE QUẢN LÝ DỮ LIỆU TỪ BACKEND
  // ==========================================
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [meta, setMeta] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });

  // ==========================================
  // MODAL & DRAWER STATE
  // ==========================================
  const [selectedContact, setSelectedContact] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // REF DÙNG CHO INPUT CHỌN FILE EXCEL/CSV
  const fileInputRef = useRef(null);

  // FORM TẠO MỚI HỒ SƠ KHÁCH HÀNG CRM
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    company: "",
    title: "",
    phone: "",
    country: "Vietnam",
    segment: "LEADS",
    status: "SUBSCRIBED",
    tags: ""
  });

  const [rawImportText, setRawImportText] = useState("");

  // ==========================================
  // 1. TẢI DỮ LIỆU TỪ BACKEND THEO WORKSPACE
  // ==========================================
  const fetchContacts = useCallback(async (page = 1) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = {
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        segment: segmentFilter || undefined
      };

      const res = await api.get("/contacts", { params });
      const data = res.data?.data || [];
      const metaData = res.data?.meta || {
        page,
        limit: pageSize,
        total: data.length,
        totalPages: Math.ceil(data.length / pageSize) || 1
      };

      setContacts(data);
      setMeta(metaData);
    } catch (err) {
      console.error("Lỗi tải contacts:", err);
      setErrorMsg(err.response?.data?.message || "Không thể tải danh sách liên hệ từ máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, segmentFilter, pageSize]);

  // Debounce tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchContacts]);

  // ==========================================
  // 2. TÍNH TOÁN KPI VÀ BIỂU ĐỒ REALTIME
  // ==========================================
  const kpiStats = useMemo(() => {
    const total = meta.total || contacts.length;
    const activeSubs = contacts.filter((c) => c.status === "SUBSCRIBED").length;
    const unsubscribed = contacts.filter((c) => c.status === "UNSUBSCRIBED").length;
    const vipCount = contacts.filter((c) => c.segment === "VIP").length;
    const leadsCount = contacts.filter((c) => c.segment === "LEADS").length;
    const enterpriseCount = contacts.filter((c) => c.segment === "ENTERPRISE").length;

    return [
      { label: "Tổng Liên Hệ", value: total.toLocaleString(), growth: "Optimal", icon: Users, color: "text-[#38bdf8]" },
      { label: "Đã Đăng Ký", value: activeSubs.toLocaleString(), growth: "Active", icon: UserCheck, color: "text-emerald-400" },
      { label: "Đối Tác VIP", value: vipCount.toLocaleString(), growth: "Tier 1", icon: Award, color: "text-[#dffe64]" },
      { label: "Khách Tiềm Năng", value: leadsCount.toLocaleString(), growth: "Growing", icon: Target, color: "text-amber-400" },
      { label: "Doanh Nghiệp", value: enterpriseCount.toLocaleString(), growth: "Sync", icon: Landmark, color: "text-[#818cf8]" },
      { label: "Hủy Đăng Ký", value: unsubscribed.toLocaleString(), growth: "Managed", icon: UserMinus, color: "text-red-400" }
    ];
  }, [meta.total, contacts]);

  const segmentChartData = useMemo(() => {
    const counts = { VIP: 0, ENTERPRISE: 0, LEADS: 0, CUSTOMERS: 0, INACTIVE: 0 };
    contacts.forEach((c) => {
      const seg = c.segment || "LEADS";
      if (counts[seg] !== undefined) counts[seg]++;
    });

    return [
      { name: "VIP", value: counts.VIP || 0, color: "#dffe64" },
      { name: "Enterprise", value: counts.ENTERPRISE || 0, color: "#818cf8" },
      { name: "Leads", value: counts.LEADS || 0, color: "#38bdf8" },
      { name: "Customers", value: counts.CUSTOMERS || 0, color: "#10b981" },
      { name: "Inactive", value: counts.INACTIVE || 0, color: "#f43f5e" }
    ];
  }, [contacts]);

  // ==========================================
  // 3. EXPORT / IMPORT FILE EXCEL
  // ==========================================
  const handleExportExcel = async () => {
    setExporting(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const response = await api.get("/contacts/export", {
        responseType: "blob"
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Danh_Ba_VERDIO_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccessMsg("Đã xuất danh bạ ra file Excel thành công!");
    } catch (err) {
      console.error("Lỗi xuất Excel:", err);
      setErrorMsg("Không thể xuất file Excel danh bạ.");
    } finally {
      setExporting(false);
    }
  };

  const handleImportExcelFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const res = await api.post("/contacts/import-excel", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setSuccessMsg(res.data?.message || "Nạp danh bạ từ file Excel thành công!");
      fetchContacts(1);
    } catch (err) {
      console.error("Lỗi import Excel:", err);
      setErrorMsg(err.response?.data?.message || "Lỗi khi tải file Excel lên.");
    } finally {
      setSubmitting(false);
      if (e.target) e.target.value = "";
    }
  };

  // ==========================================
  // 4. THÊM MỚI, IMPORT TEXT & XÓA
  // ==========================================
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        company: formData.company.trim(),
        title: formData.title.trim(),
        phone: formData.phone.trim(),
        country: formData.country.trim(),
        segment: formData.segment,
        status: formData.status,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : []
      };

      await api.post("/contacts", payload);
      setSuccessMsg(`Thêm liên hệ ${payload.email} thành công!`);
      setIsCreateOpen(false);
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        company: "",
        title: "",
        phone: "",
        country: "Vietnam",
        segment: "LEADS",
        status: "SUBSCRIBED",
        tags: ""
      });
      fetchContacts(1);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Lỗi khi thêm liên hệ.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportText = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const lines = rawImportText.split("\n").map((l) => l.trim()).filter(Boolean);
      const contactsList = lines
        .map((line) => {
          const p = line.split(",").map((s) => s.trim());
          return {
            email: p[0]?.toLowerCase(),
            firstName: p[1] || "",
            lastName: p[2] || "",
            phone: p[3] || "",
            company: p[4] || "",
            tags: p[5] ? p[5].split("|").map((t) => t.trim()) : [],
            status: "SUBSCRIBED",
            segment: "LEADS"
          };
        })
        .filter((c) => c.email && c.email.includes("@"));

      if (contactsList.length === 0) {
        throw new Error("Không tìm thấy dòng dữ liệu email hợp lệ nào.");
      }

      await api.post("/contacts/import", { contacts: contactsList });
      setSuccessMsg(`Import thành công ${contactsList.length} liên hệ vào Workspace!`);
      setIsImportOpen(false);
      setRawImportText("");
      fetchContacts(1);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Lỗi import danh bạ.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Xóa vĩnh viễn liên hệ "${email}" khỏi không gian làm việc này?`)) return;

    try {
      await api.delete(`/contacts/${id}`);
      setContacts((prev) => prev.filter((c) => (c._id || c.id) !== id));
      if (selectedContact && (selectedContact._id || selectedContact.id) === id) {
        setSelectedContact(null);
      }
      setSuccessMsg(`Đã xóa liên hệ ${email}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Không thể xóa liên hệ này.");
    }
  };

  return (
    <div className="space-y-8 font-sans select-none text-slate-300 relative animate-in fade-in duration-300">
      {/* INPUT FILE ẨN CHỌN FILE EXCEL */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx, .xls, .csv"
        onChange={handleImportExcelFile}
        className="hidden"
      />

      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Users className="w-6 h-6 text-[#38bdf8]" />
              Quản Lý Danh Bạ & Phân Khúc (Contacts)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8] text-[10px] font-mono font-bold">
              CRM DIRECTORY
            </span>
          </div>
          <p className="text-xs text-[#94a3b8]">
            Quản trị hồ sơ khách hàng, phân hạng nhóm tương tác và đồng bộ danh bạ đa kênh cho workspace
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
            title="Tải file Excel danh bạ về máy"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? "Đang xuất..." : "Tải Excel"}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={submitting}
            className="px-3.5 py-2 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 hover:border-[#38bdf8]/50 text-[#38bdf8] text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
            title="Upload file Excel/CSV từ máy tính"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{submitting ? "Nạp file..." : "Upload Excel"}</span>
          </button>

          <button
            onClick={() => setIsImportOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4 text-[#818cf8]" />
            <span>Import Text</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] hover:from-[#4f46e5] hover:to-[#0284c7] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm Liên Hệ</span>
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

      {/* ================= PHẦN 1 – KPI STATS CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiStats.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              className="bg-[#0b1329]/70 border border-white/10 backdrop-blur-xl p-4 rounded-2xl flex flex-col justify-between shadow-xl transition-all duration-300 hover:border-[#38bdf8]/40"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono font-bold text-[#64748b] uppercase tracking-wider">
                  {kpi.label}
                </span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className="flex justify-between items-end mt-3">
                <span className="text-xl font-bold text-white font-mono leading-none">{kpi.value}</span>
                <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {kpi.growth}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= PHẦN 2 – AUDIENCE ANALYTICS & INSIGHTS ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Biểu đồ phân khúc */}
        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0b1329]/70 border border-white/10 p-5 rounded-2xl backdrop-blur-xl shadow-2xl">
          <div className="space-y-2 flex flex-col justify-between h-44">
            <span className="text-[10px] font-mono font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
              <PieIcon className="w-3.5 h-3.5 text-[#dffe64]" /> Tỷ Lệ Phân Khúc Thật (Segments Ratio)
            </span>
            <div className="h-32 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={segmentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={46}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {segmentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontFamily: "monospace"
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-bold font-mono text-white leading-none">{meta.total}</span>
                <span className="text-[8px] text-[#64748b] uppercase font-mono">Hồ Sơ</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-5 font-mono text-xs">
            <span className="text-[#64748b] font-bold uppercase tracking-wider mb-1">// Workspace Metadata</span>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-[#94a3b8]">Tổng Danh Bạ:</span>
              <span className="text-emerald-400 font-bold">{meta.total} liên hệ</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-[#94a3b8]">Bộ Lọc Trạng Thái:</span>
              <span className="text-[#38bdf8] font-bold">{statusFilter || "TẤT CẢ"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#94a3b8]">Trang Hiện Tại:</span>
              <span className="text-[#dffe64] font-bold">Trang {meta.page} / {meta.totalPages}</span>
            </div>
          </div>
        </div>

        {/* Thông tin Hub */}
        <div className="xl:col-span-4 bg-gradient-to-br from-[#0b1329] via-[#0e1b38] to-[#0b1329] border border-white/10 p-5 rounded-2xl backdrop-blur-xl shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-3 z-10">
            <span className="text-[10px] font-mono font-bold text-[#38bdf8] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" /> Cô Lập Dữ Liệu Multi-Tenant
            </span>
            <ul className="space-y-2 font-mono text-xs text-[#94a3b8] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span> Dữ liệu được bảo mật bằng ranh giới Tenant ID độc lập.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#38bdf8] font-bold">✦</span> Tự động ghi nhận điểm tương tác (Engagement Score).
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#dffe64] font-bold">i</span> Hỗ trợ khử trùng lặp theo Email khi Import.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ================= PHẦN 3 – BẢNG DANH BẠ & THAO TÁC ================= */}
      <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl p-5 w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748b]" />
              <input
                type="text"
                placeholder="Tìm email, tên, công ty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[#020617] border border-white/10 rounded-xl py-1.5 pl-9 pr-4 text-xs font-medium text-white outline-none w-52 focus:w-64 transition-all focus:border-[#38bdf8]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#020617] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-[#cbd5e1] outline-none focus:border-[#38bdf8]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="SUBSCRIBED">SUBSCRIBED</option>
              <option value="UNSUBSCRIBED">UNSUBSCRIBED</option>
              <option value="BOUNCED">BOUNCED</option>
            </select>

            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              className="bg-[#020617] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-[#cbd5e1] outline-none focus:border-[#38bdf8]"
            >
              <option value="">Tất cả phân khúc</option>
              <option value="VIP">VIP</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
              <option value="LEADS">LEADS</option>
              <option value="CUSTOMERS">CUSTOMERS</option>
            </select>

            <button
              onClick={() => fetchContacts(meta.page)}
              className="p-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-[#94a3b8] hover:text-white transition-all"
              title="Tải lại"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#38bdf8]" : ""}`} />
            </button>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-[#94a3b8] bg-white/[0.02]">
                <th className="py-3.5 px-4 font-bold">Họ & Tên / Email</th>
                <th className="py-3.5 px-4 font-bold">Công Ty / Chức Danh</th>
                <th className="py-3.5 px-4 font-bold">Trạng Thái</th>
                <th className="py-3.5 px-4 font-bold">Phân Khúc</th>
                <th className="py-3.5 px-4 font-bold">Điểm AI</th>
                <th className="py-3.5 px-4 font-bold">Thẻ Nhãn (Tags)</th>
                <th className="py-3.5 px-4 text-right font-bold">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {loading && contacts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#64748b]">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#38bdf8] inline mr-2" />
                    Đang truy vấn dữ liệu khách hàng từ MongoDB Atlas...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#64748b]">
                    Workspace này chưa có liên hệ nào. Hãy bấm "Thêm Liên Hệ" hoặc "Upload Excel".
                  </td>
                </tr>
              ) : (
                contacts.map((c) => {
                  const id = c._id || c.id;
                  const fullName =
                    [c.firstName, c.lastName].filter(Boolean).join(" ") ||
                    c.email.split("@")[0];
                  return (
                    <tr
                      key={id}
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => setSelectedContact(c)}
                    >
                      <td className="py-3.5 px-4 font-sans font-bold text-white group-hover:text-[#38bdf8] transition-colors">
                        <div>
                          <div className="text-sm">{fullName}</div>
                          <span className="text-[11px] text-[#64748b] font-mono block mt-0.5 font-normal">
                            {c.email}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#cbd5e1] font-sans">
                        <div className="font-semibold">{c.company || "—"}</div>
                        <span className="text-[10px] text-[#64748b] block mt-0.5">{c.title || "Thành viên"}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            c.status === "SUBSCRIBED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : c.status === "UNSUBSCRIBED"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            c.segment === "VIP"
                              ? "bg-[#dffe64]/10 text-[#dffe64] border-[#dffe64]/20"
                              : "bg-white/5 text-[#94a3b8] border-white/10"
                          }`}
                        >
                          {c.segment || "LEADS"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        {c.engagementScore ?? 50} pts
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {c.tags && c.tags.length > 0 ? (
                            c.tags.slice(0, 2).map((t, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.2 rounded text-[9px] bg-white/5 text-[#38bdf8] border border-white/10"
                              >
                                #{t}
                              </span>
                            ))
                          ) : (
                            <span className="text-[#64748b] text-[10px]">—</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDelete(id, c.email)}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg text-[#64748b] hover:text-red-400 transition-colors"
                          title="Xóa liên hệ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PHÂN TRANG */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-2 border-t border-white/10 text-xs font-mono text-[#94a3b8]">
          <div className="flex items-center gap-2">
            <span>Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-[#020617] border border-white/10 rounded px-2 py-1 text-white outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="ml-2">Hiển thị {contacts.length} / {meta.total} liên hệ</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={meta.page <= 1 || loading}
              onClick={() => fetchContacts(meta.page - 1)}
              className="p-1.5 bg-white/[0.02] border border-white/10 rounded-lg hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-white/5 border border-white/10 text-[#38bdf8] rounded-lg font-bold">
              {meta.page} / {meta.totalPages || 1}
            </span>
            <button
              disabled={meta.page >= meta.totalPages || loading}
              onClick={() => fetchContacts(meta.page + 1)}
              className="p-1.5 bg-white/[0.02] border border-white/10 rounded-lg hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= DRAWER CHI TIẾT HỒ SƠ ================= */}
      <AnimatePresence>
        {selectedContact && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedContact(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed top-3 right-3 bottom-3 w-96 bg-[#08110F]/95 border border-white/15 backdrop-blur-3xl rounded-[24px] shadow-[0_0_60px_rgba(0,0,0,0.8)] z-50 p-5 flex flex-col justify-between overflow-hidden font-mono"
            >
              <div className="space-y-5 overflow-y-auto pr-1 flex-1">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">// IDENTITY DOSSIER</span>
                  <button
                    onClick={() => setSelectedContact(null)}
                    className="p-1 bg-white/5 border border-white/10 rounded-lg text-[#94a3b8] hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3.5 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6366f1] to-[#38bdf8] text-white font-sans font-bold text-base flex items-center justify-center shadow-lg shrink-0">
                    {selectedContact.email?.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-sans font-bold text-white truncate">
                      {[selectedContact.firstName, selectedContact.lastName].filter(Boolean).join(" ") || "Chưa đặt tên"}
                    </h4>
                    <span className="text-[11px] text-[#94a3b8] block truncate mt-0.5">{selectedContact.email}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#dffe64]/10 border border-[#dffe64]/20 text-[#dffe64] tracking-wide inline-block mt-2">
                      {selectedContact.segment || "LEADS"}
                    </span>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-[#64748b]">Công Ty:</span>
                    <span className="text-white font-bold">{selectedContact.company || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-[#64748b]">Chức Danh:</span>
                    <span className="text-[#cbd5e1]">{selectedContact.title || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-[#64748b]">Số Điện Thoại:</span>
                    <span className="text-white font-mono">{selectedContact.phone || "—"}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-[#64748b]">Điểm Tương Tác:</span>
                    <span className="text-emerald-400 font-bold">{selectedContact.engagementScore ?? 50} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Trạng Thái:</span>
                    <span className="text-emerald-400 font-bold">{selectedContact.status}</span>
                  </div>
                </div>

                {selectedContact.tags && selectedContact.tags.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider block">// Thẻ Nhãn Đã Gắn</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedContact.tags.map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-[#38bdf8]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={() => handleDelete(selectedContact._id || selectedContact.id, selectedContact.email)}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold uppercase py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Xóa Liên Hệ
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ================= MODAL THÊM MỚI 1 CONTACT ================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010409]/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0b1329] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#38bdf8]" /> Thêm Hồ Sơ Khách Hàng Mới
              </h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-[#64748b] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1">Email (*)</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2 text-white outline-none focus:border-[#38bdf8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#cbd5e1] font-semibold mb-1">Họ (First Name)</label>
                  <input
                    type="text"
                    placeholder="Nguyễn"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2 text-white outline-none focus:border-[#38bdf8]"
                  />
                </div>
                <div>
                  <label className="block text-[#cbd5e1] font-semibold mb-1">Tên (Last Name)</label>
                  <input
                    type="text"
                    placeholder="Văn A"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2 text-white outline-none focus:border-[#38bdf8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#cbd5e1] font-semibold mb-1">Công Ty</label>
                  <input
                    type="text"
                    placeholder="Verdio Corp"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2 text-white outline-none focus:border-[#38bdf8]"
                  />
                </div>
                <div>
                  <label className="block text-[#cbd5e1] font-semibold mb-1">Chức Danh</label>
                  <input
                    type="text"
                    placeholder="Marketing Manager"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2 text-white outline-none focus:border-[#38bdf8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#cbd5e1] font-semibold mb-1">Phân Khúc</label>
                  <select
                    value={formData.segment}
                    onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#38bdf8]"
                  >
                    <option value="LEADS">LEADS</option>
                    <option value="VIP">VIP</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                    <option value="CUSTOMERS">CUSTOMERS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#cbd5e1] font-semibold mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    placeholder="0901234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2 text-white outline-none focus:border-[#38bdf8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1">Thẻ Nhãn Tags (cách nhau bởi dấu phẩy)</label>
                <input
                  type="text"
                  placeholder="VIP_2026, SAAS, TECH"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2 text-white outline-none focus:border-[#38bdf8]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-[#94a3b8]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] text-white font-bold uppercase text-xs disabled:opacity-50"
                >
                  {submitting ? "Đang lưu..." : "Lưu Hồ Sơ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL IMPORT DÁN TEXT THỦ CÔNG ================= */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010409]/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0b1329] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#38bdf8]" /> Import Khách Hàng Hàng Loạt (Text)
              </h2>
              <button onClick={() => setIsImportOpen(false)} className="text-[#64748b] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Dán dữ liệu danh bạ mỗi dòng một khách hàng theo cấu trúc sau:
              <br />
              <code className="text-[#38bdf8] font-mono text-[11px]">email, firstName, lastName, phone, company, tag1|tag2</code>
            </p>

            <form onSubmit={handleImportText} className="space-y-4">
              <textarea
                rows="6"
                required
                placeholder={`developer@google.com, Nam, Nguyễn, 0911223344, Google, VIP|TECH\nceo@linear.app, Alex, Rivera, 0988776655, Linear, SAAS`}
                value={rawImportText}
                onChange={(e) => setRawImportText(e.target.value)}
                className="w-full bg-[#020617] border border-white/10 rounded-xl p-3 text-xs text-white font-mono placeholder-[#475569] focus:outline-none focus:border-[#38bdf8]"
              />

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-[#94a3b8] text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {submitting ? "Đang đẩy vào MongoDB..." : "Bắt Đầu Import"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}