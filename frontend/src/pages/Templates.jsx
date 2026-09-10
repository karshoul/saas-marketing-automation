import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  FileCode2,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Edit3,
  Copy,
  Send,
  Sparkles,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertCircle,
  X,
  Code2
} from "lucide-react";

const BUILTIN_PRESETS = [
  {
    name: "OTP Khẩn Cấp (SLA ≤ 5s)",
    subject: "Mã xác thực OTP của bạn là {{otpCode}}",
    category: "TRANSACTIONAL",
    contentHtml: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
  <h2 style="color: #0f172a; margin-bottom: 8px;">Xác thực bảo mật VERDIO</h2>
  <p style="color: #475569; font-size: 14px;">Xin chào {{firstName}}, mã bảo mật OTP của bạn có hiệu lực trong 5 phút:</p>
  <div style="background: #f8fafc; border: 2px dashed #6366f1; text-align: center; padding: 18px; border-radius: 8px; margin: 20px 0;">
    <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #4338ca;">{{otpCode}}</span>
  </div>
  <p style="color: #94a3b8; font-size: 12px;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua thư.</p>
</div>`
  },
  {
    name: "Chào Mừng Thành Viên Mới",
    subject: "Chào mừng {{firstName}} gia nhập nền tảng VERDIO!",
    category: "ONBOARDING",
    contentHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border-radius: 12px; background: #0b1329; color: #ffffff;">
  <h1 style="color: #38bdf8; font-size: 24px;">Xin chào {{firstName}}! 🚀</h1>
  <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">Chào mừng bạn đến với hệ thống Marketing Automation đa kênh. Tài khoản liên kết với hòm thư <b>{{email}}</b> của bạn đã được kích hoạt thành công.</p>
  <div style="margin: 25px 0;">
    <a href="https://verdio.io" style="background: linear-gradient(90deg, #6366f1, #38bdf8); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Truy Cập Bàn Điều Khiển</a>
  </div>
  <p style="color: #64748b; font-size: 12px;">Đội ngũ kỹ thuật VERDIO • Cần Thơ, Vietnam</p>
</div>`
  },
  {
    name: "Khuyến Mãi Flash Sale Đa Kênh",
    subject: "🔥 Giảm 40% cho thành viên VIP: {{firstName}}",
    category: "MARKETING",
    contentHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #fed7aa; border-radius: 12px; background: #fffaf5;">
  <span style="background: #ea580c; color: #ffffff; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold;">SPECIAL OFFER</span>
  <h2 style="color: #9a3412; margin: 15px 0 10px 0;">Ưu đãi độc quyền dành cho bạn!</h2>
  <p style="color: #431407; font-size: 14px; line-height: 1.5;">Chào {{firstName}}, áp dụng ngay mã giảm giá để tối ưu hóa chi phí chiến dịch tiếp theo của bạn.</p>
  <div style="margin: 20px 0; text-align: center;">
    <a href="https://verdio.io" style="background: #ea580c; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Nhận Khuyến Mãi Ngay</a>
  </div>
</div>`
  }
];

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Editor Drawer/Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState("desktop"); // desktop | mobile
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    category: "MARKETING",
    contentHtml: BUILTIN_PRESETS[1].contentHtml
  });

  // Tải danh sách Template từ Backend
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.get("/templates", {
        params: {
          category: categoryFilter || undefined,
          search: search.trim() || undefined
        }
      });
      const data = res.data?.data || [];
      // Nếu DB chưa có bản ghi nào, hiển thị preset mẫu
      setTemplates(data.length > 0 ? data : BUILTIN_PRESETS);
    } catch {
      // Fallback an toàn nếu backend chưa mở route
      setTemplates(BUILTIN_PRESETS);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchTemplates, 300);
    return () => clearTimeout(timer);
  }, [fetchTemplates]);

  // Thao tác Lưu Template
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    try {
      if (editingId) {
        await api.put(`/templates/${editingId}`, formData);
        setSuccessMsg("Cập nhật mẫu tin thành công!");
      } else {
        await api.post("/templates", formData);
        setSuccessMsg("Lưu mẫu tin mới thành công!");
      }
      setIsEditorOpen(false);
      setEditingId(null);
      fetchTemplates();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Lỗi khi lưu mẫu tin.");
    } finally {
      setSubmitting(false);
    }
  };

  // Nút chèn biến nhanh
  const insertVariable = (variable) => {
    setFormData((prev) => ({
      ...prev,
      contentHtml: prev.contentHtml + ` {{${variable}}} `
    }));
  };

  // Dùng mẫu này để bắn chiến dịch ngay
  const handleUseInCampaign = (tpl) => {
    // Lưu vào session storage để trang Campaigns tự động đọc và điền sẵn
    sessionStorage.setItem("campaign_preset_subject", tpl.subject);
    sessionStorage.setItem("campaign_preset_html", tpl.contentHtml);
    navigate("/campaigns");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <FileCode2 className="w-6 h-6 text-[#38bdf8]" />
              Studio Mẫu Gửi Tin (Templates)
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#6366f1]/20 border border-[#6366f1]/40 text-[#818cf8] text-[10px] font-mono font-bold">
              HTML ENGINE
            </span>
          </div>
          <p className="text-xs text-[#94a3b8]">
            Thiết kế mẫu email responsive, chèn biến cá nhân hóa và đồng bộ trực tiếp sang chiến dịch gửi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                name: "Mẫu Tin Mới",
                subject: "Tiêu đề thư...",
                category: "MARKETING",
                contentHtml: BUILTIN_PRESETS[0].contentHtml
              });
              setIsEditorOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] hover:from-[#4f46e5] hover:to-[#0284c7] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Mẫu Mới</span>
          </button>
        </div>
      </div>

      {/* Thông báo Messages */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")}><X className="w-4 h-4" /></button>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ================= FILTER & SEARCH BAR ================= */}
      <div className="p-4 rounded-2xl bg-[#0b1329]/70 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên mẫu, chủ đề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#020617]/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#020617]/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#38bdf8] transition-all"
          >
            <option value="">Tất cả phân loại</option>
            <option value="MARKETING">MARKETING (Tiếp thị)</option>
            <option value="TRANSACTIONAL">TRANSACTIONAL (Giao dịch / OTP)</option>
            <option value="ONBOARDING">ONBOARDING (Chào mừng)</option>
          </select>
        </div>
      </div>

      {/* ================= TEMPLATES GRID CATALOG ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl, idx) => {
          const id = tpl._id || tpl.id || `preset-${idx}`;
          return (
            <div
              key={id}
              className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between group hover:border-[#38bdf8]/40 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#6366f1]/20 text-[#818cf8] border border-[#6366f1]/30">
                    {tpl.category || "MARKETING"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingId(tpl._id || null);
                        setFormData({
                          name: tpl.name,
                          subject: tpl.subject,
                          category: tpl.category || "MARKETING",
                          contentHtml: tpl.contentHtml
                        });
                        setIsEditorOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors"
                      title="Chỉnh sửa mã HTML"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-[#38bdf8] transition-colors line-clamp-1">
                  {tpl.name}
                </h3>
                <p className="text-xs text-[#94a3b8] font-mono mt-1 mb-4 line-clamp-1">
                  {tpl.subject}
                </p>

                {/* Khung xem trước nhỏ */}
                <div className="w-full h-36 rounded-xl bg-white/5 border border-white/10 p-3 overflow-hidden text-[10px] text-[#cbd5e1] font-mono opacity-80 pointer-events-none select-none">
                  {tpl.contentHtml.replace(/<[^>]*>?/gm, "").slice(0, 180)}...
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                <button
                  onClick={() => {
                    setFormData({
                      name: tpl.name,
                      subject: tpl.subject,
                      category: tpl.category || "MARKETING",
                      contentHtml: tpl.contentHtml
                    });
                    setIsEditorOpen(true);
                  }}
                  className="text-xs text-[#94a3b8] hover:text-white flex items-center gap-1 font-medium"
                >
                  <Eye className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Xem & Chỉnh</span>
                </button>

                <button
                  onClick={() => handleUseInCampaign(tpl)}
                  className="px-3 py-1.5 rounded-xl bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/30 text-[#38bdf8] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                >
                  <Send className="w-3 h-3" />
                  <span>Dùng Cho Chiến Dịch</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= DUAL-PANE TEMPLATE STUDIO (MODAL SOẠN THẢO) ================= */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010409]/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-6xl h-[90vh] bg-[#0b1329] border border-white/15 rounded-2xl flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Topbar Modal */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <Code2 className="w-5 h-5 text-[#38bdf8]" />
                <h2 className="text-sm font-bold text-white">
                  {editingId ? "Chỉnh Sửa Mẫu Tin" : "Thiết Kế Mẫu Tin HTML"}
                </h2>
              </div>

              {/* Bộ chuyển đổi thiết bị Desktop / Mobile */}
              <div className="flex items-center gap-2 bg-white/[0.04] p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                    previewDevice === "desktop"
                      ? "bg-[#6366f1] text-white font-bold"
                      : "text-[#94a3b8] hover:text-white"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                    previewDevice === "mobile"
                      ? "bg-[#6366f1] text-white font-bold"
                      : "text-[#94a3b8] hover:text-white"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile
                </button>
              </div>

              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1 rounded-lg text-[#64748b] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Khung chia đôi màn hình (Dual-Pane) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/10 overflow-hidden">
              {/* PANE TRÁI: SOẠN THẢO CODE & THÔNG SỐ */}
              <form onSubmit={handleSaveTemplate} className="p-5 flex flex-col justify-between overflow-y-auto space-y-4 text-xs">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[#cbd5e1] font-semibold mb-1">Tên Mẫu Tin (*)</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-[#38bdf8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#cbd5e1] font-semibold mb-1">Tiêu Đề Thư Mặc Định (*)</label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-[#38bdf8]"
                    />
                  </div>

                  {/* Thanh chèn biến động */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[#cbd5e1] font-semibold">Chèn Nhanh Biến Cá Nhân Hóa:</span>
                      <span className="text-[10px] text-[#38bdf8] font-mono">Bấm để thêm vào nội dung</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {["firstName", "email", "phone", "otpCode"].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => insertVariable(v)}
                          className="px-2 py-1 rounded bg-white/[0.05] hover:bg-[#6366f1]/20 border border-white/10 text-[11px] font-mono text-[#38bdf8] transition-all"
                        >
                          +{`{{${v}}}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#cbd5e1] font-semibold mb-1">Mã Nguồn HTML (*)</label>
                    <textarea
                      rows="14"
                      required
                      value={formData.contentHtml}
                      onChange={(e) => setFormData({ ...formData, contentHtml: e.target.value })}
                      className="w-full bg-[#020617] border border-white/10 rounded-xl p-3 text-white font-mono text-[11px] focus:border-[#38bdf8]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 rounded-xl hover:bg-white/5 text-[#94a3b8]"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] text-white font-bold"
                  >
                    {submitting ? "Đang lưu..." : "Lưu Vào Danh Mục"}
                  </button>
                </div>
              </form>

              {/* PANE PHẢI: LIVE PREVIEW THEO THIẾT BỊ */}
              <div className="p-6 bg-[#020617] flex flex-col items-center justify-center overflow-y-auto">
                <div
                  className={`transition-all duration-300 bg-white rounded-xl shadow-2xl overflow-hidden ${
                    previewDevice === "mobile"
                      ? "w-[360px] h-[640px] border-[8px] border-[#1e293b] rounded-[36px]"
                      : "w-full max-w-[550px] min-h-[400px] border border-slate-200"
                  }`}
                >
                  {/* Thanh header giả lập của email client */}
                  <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 text-[11px] text-slate-600 font-sans">
                    <div className="truncate">
                      <b>Chủ đề:</b> {formData.subject.replace(/{{firstName}}/g, "Nguyễn Văn A")}
                    </div>
                  </div>
                  {/* Khung render HTML */}
                  <div
                    className="p-4 overflow-y-auto h-full text-slate-800"
                    dangerouslySetInnerHTML={{
                      __html: formData.contentHtml
                        .replace(/{{firstName}}/g, "Nguyễn Văn A")
                        .replace(/{{email}}/g, "nguyenvana@gmail.com")
                        .replace(/{{otpCode}}/g, "894210")
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}