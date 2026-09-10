import React, { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import {
  Users,
  UserPlus,
  Search,
  Upload,
  Trash2,
  RefreshCw,
  Tag,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet
} from "lucide-react";

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form đơn lẻ
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    tags: "",
    status: "SUBSCRIBED"
  });

  // Dữ liệu import hàng loạt (chuỗi CSV/JSON)
  const [rawImportText, setRawImportText] = useState("");

  // ==========================================
  // 1. TẢI DỮ LIỆU TỪ BACKEND
  // ==========================================
  const fetchContacts = useCallback(async (page = 1) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = {
        page,
        limit: meta.limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined
      };
      const res = await api.get("/contacts", { params });

      // Cấu trúc trả về qua hàm helper success(res, msg, data, code, meta)
      const data = res.data?.data || [];
      const metaData = res.data?.meta || {
        page,
        limit: meta.limit,
        total: data.length,
        totalPages: Math.ceil(data.length / meta.limit) || 1
      };

      setContacts(data);
      setMeta(metaData);
    } catch (err) {
      console.error("Lỗi tải contacts:", err);
      setErrorMsg(err.response?.data?.message || "Không thể tải danh sách liên hệ từ máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, meta.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  // ==========================================
  // 2. THÊM MỚI 1 CONTACT
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
        phone: formData.phone.trim(),
        status: formData.status,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : []
      };

      await api.post("/contacts", payload);
      setSuccessMsg("Thêm liên hệ mới thành công!");
      setIsCreateOpen(false);
      setFormData({ email: "", firstName: "", lastName: "", phone: "", tags: "", status: "SUBSCRIBED" });
      fetchContacts(meta.page);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Lỗi khi thêm liên hệ mới.");
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // 3. IMPORT HÀNG LOẠT (BULK UPSERT)
  // ==========================================
  const handleImport = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Hỗ trợ format từng dòng: email,firstName,lastName,phone,tag1|tag2
      const lines = rawImportText.split("\n").map((l) => l.trim()).filter(Boolean);
      const contactsList = lines.map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        return {
          email: parts[0]?.toLowerCase(),
          firstName: parts[1] || "",
          lastName: parts[2] || "",
          phone: parts[3] || "",
          tags: parts[4] ? parts[4].split("|").map((t) => t.trim()) : [],
          status: "SUBSCRIBED"
        };
      }).filter((c) => c.email && c.email.includes("@"));

      if (contactsList.length === 0) {
        throw new Error("Không tìm thấy dòng dữ liệu email hợp lệ nào.");
      }

      await api.post("/contacts/import", { contacts: contactsList });
      setSuccessMsg(`Đã gửi yêu cầu import ${contactsList.length} liên hệ thành công!`);
      setIsImportOpen(false);
      setRawImportText("");
      fetchContacts(1);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Lỗi import danh bạ.");
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // 4. XÓA CONTACT
  // ==========================================
  const handleDelete = async (id, email) => {
    if (!window.confirm(`Bạn có chắc muốn xóa liên hệ "${email}" không?`)) return;

    try {
      await api.delete(`/contacts/${id}`);
      setContacts((prev) => prev.filter((c) => (c._id || c.id) !== id));
      setSuccessMsg(`Đã xóa liên hệ ${email}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Không thể xóa liên hệ này.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ================= HEADER ACTIONS ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Users className="w-6 h-6 text-[#38bdf8]" />
              Danh Bạ Khách Hàng
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#6366f1]/20 border border-[#6366f1]/40 text-[#818cf8] text-[10px] font-mono font-bold">
              MULTI-TENANT DB
            </span>
          </div>
          <p className="text-xs text-[#94a3b8]">
            Quản lý tập trung hồ sơ khách hàng, phân khúc thẻ nhãn và điểm tương tác
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImportOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 text-xs text-white font-medium flex items-center gap-2 transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Import CSV</span>
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

      {/* Thông báo Message */}
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
            placeholder="Tìm theo email, tên, số điện thoại..."
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
            <option value="SUBSCRIBED">Đã đăng ký (Subscribed)</option>
            <option value="UNSUBSCRIBED">Đã hủy (Unsubscribed)</option>
            <option value="BOUNCED">Bị trả về (Bounced)</option>
          </select>

          <button
            onClick={() => fetchContacts(meta.page)}
            className="p-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs text-[#94a3b8] hover:text-white transition-all"
            title="Tải lại"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#38bdf8]" : ""}`} />
          </button>
        </div>
      </div>

      {/* ================= CONTACTS DATA TABLE ================= */}
      <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase font-mono tracking-wider text-[#94a3b8] bg-white/[0.02]">
                <th className="py-3.5 px-6">Khách Hàng</th>
                <th className="py-3.5 px-4">Số Điện Thoại</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4">Thẻ Nhãn (Tags)</th>
                <th className="py-3.5 px-4">Điểm Tương Tác</th>
                <th className="py-3.5 px-6 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-[#64748b]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#38bdf8]" />
                      <span>Đang tải dữ liệu từ MongoDB...</span>
                    </div>
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-[#64748b]">
                    Không tìm thấy khách hàng nào phù hợp.
                  </td>
                </tr>
              ) : (
                contacts.map((c) => {
                  const id = c._id || c.id;
                  const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ") || "Chưa đặt tên";
                  return (
                    <tr key={id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#6366f1]/15 border border-[#6366f1]/30 flex items-center justify-center font-bold text-[11px] text-[#38bdf8]">
                            {c.email?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-[#38bdf8] transition-colors">
                              {fullName}
                            </div>
                            <div className="text-[11px] font-mono text-[#64748b] flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {c.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[#94a3b8]">
                        {c.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#64748b]" />
                            {c.phone}
                          </span>
                        ) : (
                          <span className="text-[#475569]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            c.status === "SUBSCRIBED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : c.status === "UNSUBSCRIBED"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              c.status === "SUBSCRIBED"
                                ? "bg-emerald-400"
                                : c.status === "UNSUBSCRIBED"
                                ? "bg-amber-400"
                                : "bg-red-400"
                            }`}
                          />
                          {c.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {c.tags && c.tags.length > 0 ? (
                            c.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] border border-white/10 text-[#cbd5e1]"
                              >
                                #{tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-[#475569] text-[11px]">—</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-white font-bold">{c.engagementScore ?? 0}</span>
                        <span className="text-[#64748b] text-[10px] ml-1">pts</span>
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => handleDelete(id, c.email)}
                          className="p-1.5 rounded-lg text-[#64748b] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Xóa khách hàng"
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

        {/* Pagination Bar */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-[#94a3b8] bg-white/[0.01]">
          <div>
            Trang <span className="text-white font-bold font-mono">{meta.page}</span> /{" "}
            <span className="font-mono">{meta.totalPages}</span> (Tổng: {meta.total} khách hàng)
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={meta.page <= 1 || loading}
              onClick={() => fetchContacts(meta.page - 1)}
              className="p-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={meta.page >= meta.totalPages || loading}
              onClick={() => fetchContacts(meta.page + 1)}
              className="p-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL THÊM MỚI 1 CONTACT ================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010409]/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0b1329] border border-white/15 rounded-2xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/10">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#38bdf8]" />
                Thêm Khách Hàng Mới
              </h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-[#64748b] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1">Email (*)</label>
                <input
                  type="email"
                  required
                  placeholder="customer@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8]"
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
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8]"
                  />
                </div>
                <div>
                  <label className="block text-[#cbd5e1] font-semibold mb-1">Tên (Last Name)</label>
                  <input
                    type="text"
                    placeholder="Văn A"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1">Số Điện Thoại</label>
                <input
                  type="text"
                  placeholder="0901234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8]"
                />
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1">Thẻ Nhãn (cách nhau bằng dấu phẩy)</label>
                <input
                  type="text"
                  placeholder="VIP, KHACH_MOI, TET_2026"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8]"
                />
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1">Trạng Thái Đăng Ký</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#38bdf8]"
                >
                  <option value="SUBSCRIBED">SUBSCRIBED (Cho phép nhận tin)</option>
                  <option value="UNSUBSCRIBED">UNSUBSCRIBED (Đã hủy)</option>
                  <option value="BOUNCED">BOUNCED (Lỗi hòm thư)</option>
                </select>
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
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] text-white font-semibold disabled:opacity-50"
                >
                  {submitting ? "Đang lưu..." : "Lưu Khách Hàng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL IMPORT HÀNG LOẠT ================= */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010409]/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0b1329] border border-white/15 rounded-2xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#38bdf8]" />
                Import Khách Hàng Hàng Loạt
              </h2>
              <button onClick={() => setIsImportOpen(false)} className="text-[#64748b] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#94a3b8] mb-3">
              Dán dữ liệu danh bạ mỗi dòng một khách hàng theo cấu trúc sau:
              <br />
              <code className="text-[#38bdf8] font-mono">email, firstName, lastName, phone, tag1|tag2</code>
            </p>

            <form onSubmit={handleImport} className="space-y-4">
              <textarea
                rows="6"
                required
                placeholder={`user1@gmail.com, Nam, Nguyễn, 0911223344, VIP|KHACH_MOI\nuser2@company.com, Lan, Trần, 0988776655, NEWSLETTER`}
                value={rawImportText}
                onChange={(e) => setRawImportText(e.target.value)}
                className="w-full bg-[#020617] border border-white/10 rounded-xl p-3 text-xs text-white font-mono placeholder-[#475569] focus:outline-none focus:border-[#38bdf8]"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2 rounded-xl hover:bg-white/5 text-[#94a3b8] text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] text-white text-xs font-semibold disabled:opacity-50"
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