import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import {
  FileCode2,
  Plus,
  Search,
  Copy,
  Trash2,
  Edit3,
  Eye,
  Smartphone,
  Monitor,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  Image as ImageIcon,
  Type,
  Heading,
  MousePointerClick,
  Minus,
  Layers,
  ArrowUp,
  ArrowDown,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sliders,
  ShieldCheck,
  ExternalLink
} from "lucide-react";

const CATEGORIES = [
  { label: "Tất cả", value: "ALL" },
  { label: "Marketing", value: "MARKETING" },
  { label: "Bản Tin (Newsletter)", value: "NEWSLETTER" },
  { label: "Chào Mừng (Onboarding)", value: "ONBOARDING" },
  { label: "Giao Dịch (Transactional)", value: "TRANSACTIONAL" },
  { label: "Khác", value: "OTHER" }
];

const MERGE_TAGS = [
  { tag: "{{firstName}}", label: "Tên Khách" },
  { tag: "{{lastName}}", label: "Họ Khách" },
  { tag: "{{company}}", label: "Công Ty" },
  { tag: "{{email}}", label: "Email" },
  { tag: "{{unsubscribeUrl}}", label: "Link Hủy Đăng Ký" }
];

const DEFAULT_BLOCKS = [
  {
    id: "b-badge",
    type: "badge",
    text: "CHIẾN DỊCH ĐẶC QUYỀN",
    color: "#38bdf8",
    bgColor: "rgba(56, 189, 248, 0.12)",
    align: "center"
  },
  {
    id: "b-image",
    type: "image",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80",
    alt: "Banner Chiến Dịch",
    radius: 12,
    link: ""
  },
  {
    id: "b-heading",
    type: "heading",
    text: "Chào mừng {{firstName}} đến với kỷ nguyên mới!",
    size: 22,
    color: "#ffffff",
    align: "center"
  },
  {
    id: "b-text",
    type: "text",
    content:
      "Xin chào đại diện từ {{company}}, chúng tôi đã kích hoạt hệ sinh thái dành riêng cho bạn. Hãy bắt đầu kết nối và tăng trưởng tự động ngay hôm nay.",
    size: 14,
    color: "#94a3b8",
    align: "left"
  },
  {
    id: "b-card",
    type: "card",
    content: "⚡ Ưu đãi dành riêng: Trải nghiệm lưu lượng phát tán tin không giới hạn trong 30 ngày.",
    bgColor: "rgba(99, 102, 241, 0.08)",
    borderColor: "rgba(99, 102, 241, 0.25)",
    textColor: "#c7d2fe"
  },
  {
    id: "b-btn",
    type: "button",
    text: "Khám Phá Ngay →",
    link: "https://verdio.io",
    bgColor: "#6366f1",
    textColor: "#ffffff",
    align: "center",
    radius: 10
  },
  {
    id: "b-div",
    type: "divider",
    color: "#1e293b"
  },
  {
    id: "b-footer",
    type: "footer",
    text: "Thư này được gửi tự động đến {{email}}.",
    unsubText: "Hủy đăng ký nhận tin",
    color: "#64748b"
  }
];

const DEFAULT_STYLES = {
  containerBg: "#020617",
  cardBg: "#0b1329",
  borderColor: "#1e293b",
  radius: 16
};

// Trình biên dịch chuyển Blocks thành HTML
function compileBlocksToHtml(blocks, styles) {
  const blockHtmls = blocks
    .map((b) => {
      switch (b.type) {
        case "badge":
          return `
            <div style="text-align: ${b.align || "center"}; margin-bottom: 18px;">
              <span style="display: inline-block; padding: 4px 14px; background: ${b.bgColor}; border: 1px solid ${b.color}40; border-radius: 9999px; color: ${b.color}; font-size: 11px; font-weight: 700; letter-spacing: 1px;">
                ${b.text}
              </span>
            </div>`;
        case "image":
          const img = `<img src="${b.url}" alt="${b.alt || ""}" style="width: 100%; max-height: 280px; object-fit: cover; border-radius: ${b.radius || 12}px; display: block; border: 0;" />`;
          return `<div style="margin: 16px 0 24px 0;">${b.link ? `<a href="${b.link}" target="_blank">${img}</a>` : img}</div>`;
        case "heading":
          return `<h1 style="color: ${b.color}; font-size: ${b.size || 22}px; font-weight: 800; line-height: 1.35; margin: 0 0 14px 0; text-align: ${b.align || "center"};">${b.text}</h1>`;
        case "text":
          return `<p style="color: ${b.color}; font-size: ${b.size || 14}px; line-height: 1.6; margin: 0 0 18px 0; text-align: ${b.align || "left"};">${b.content}</p>`;
        case "card":
          return `<div style="background: ${b.bgColor}; border: 1px solid ${b.borderColor}; padding: 16px; border-radius: 12px; margin-bottom: 20px;"><p style="color: ${b.textColor}; font-size: 13px; line-height: 1.5; margin: 0;">${b.content}</p></div>`;
        case "button":
          return `<div style="text-align: ${b.align || "center"}; margin: 24px 0;"><a href="${b.link}" target="_blank" style="background: ${b.bgColor}; color: ${b.textColor}; padding: 12px 28px; border-radius: ${b.radius || 10}px; text-decoration: none; font-weight: 700; font-size: 13px; display: inline-block;">${b.text}</a></div>`;
        case "divider":
          return `<hr style="border: 0; border-top: 1px solid ${b.color}; margin: 24px 0 16px 0;" />`;
        case "footer":
          return `<p style="color: ${b.color}; font-size: 11px; text-align: center; margin: 0; line-height: 1.5;">${b.text}<br/>Nếu không muốn nhận thư, bạn có thể <a href="{{unsubscribeUrl}}" style="color: #38bdf8; text-decoration: underline;">${b.unsubText || "Hủy đăng ký"}</a>.</p>`;
        default:
          return "";
      }
    })
    .join("\n");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin: 0; padding: 24px; background-color: ${styles.containerBg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: ${styles.cardBg}; border: 1px solid ${styles.borderColor}; border-radius: ${styles.radius}px; padding: 32px;">
    ${blockHtmls}
  </div>
  <!-- VERDIO_BLOCKS_DATA: ${JSON.stringify({ blocks, styles })} -->
</body>
</html>`;
}

// 🖼️ COMPONENT BẢN XEM TRƯỚC THU NHỎ (LIVE MINI THUMBNAIL)
function TemplateThumbnail({ htmlContent, onPreview, onEdit }) {
  return (
    <div className="relative w-full h-52 bg-[#030712] overflow-hidden rounded-t-2xl border-b border-white/10 group cursor-pointer" onClick={onPreview}>
      {/* Top browser dots mockup */}
      <div className="absolute top-0 left-0 right-0 h-5 bg-[#0b1329]/90 border-b border-white/5 flex items-center px-3 gap-1.5 z-20">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
        <span className="text-[9px] font-mono text-[#64748b] ml-2 truncate">email-preview.html</span>
      </div>

      {/* Scaled-down Email Container */}
      <div className="w-[600px] h-[720px] origin-top-left transform scale-[0.52] sm:scale-[0.54] ml-3 mt-7 pointer-events-none select-none">
        <iframe
          title="mini-preview"
          srcDoc={htmlContent}
          className="w-full h-full border-none pointer-events-none"
          scrolling="no"
          tabIndex="-1"
        />
      </div>

      {/* Hiệu ứng bóng mờ chân thẻ */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0b1329] via-[#0b1329]/70 to-transparent pointer-events-none" />

      {/* Lớp phủ hành động nhanh khi rê chuột vào (Hover Quick Action Overlay) */}
      <div className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-3 z-30">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/15 shadow-xl transition-all"
        >
          <Eye className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>Xem Lớn</span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] text-white text-xs font-bold flex items-center gap-1.5 shadow-xl hover:opacity-90 transition-all"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Chỉnh Sửa</span>
        </button>
      </div>
    </div>
  );
}

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [submitting, setSubmitting] = useState(false);

  const [tplMeta, setTplMeta] = useState({
    name: "",
    subject: "",
    previewText: "",
    category: "MARKETING"
  });

  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [styles, setStyles] = useState(DEFAULT_STYLES);
  const [selectedBlockId, setSelectedBlockId] = useState(null);

  const [quickPreviewTpl, setQuickPreviewTpl] = useState(null);

  // 1. TẢI DỮ LIỆU
  const fetchTemplates = useCallback(async (page = 1) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = {
        page,
        limit: meta.limit,
        search: search.trim() || undefined,
        category: selectedCategory !== "ALL" ? selectedCategory : undefined
      };
      const res = await api.get("/templates", { params });
      const data = res.data?.data || [];
      const metaData = res.data?.meta || {
        page,
        limit: meta.limit,
        total: data.length,
        totalPages: Math.ceil(data.length / meta.limit) || 1
      };
      setTemplates(data);
      setMeta(metaData);
    } catch (err) {
      console.error("Lỗi tải templates:", err);
      setErrorMsg(err.response?.data?.message || "Không thể tải danh sách mẫu thư.");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, meta.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTemplates(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchTemplates]);

  // 2. MỞ TRÌNH THIẾT KẾ
  const handleOpenCreate = () => {
    setEditingId(null);
    setTplMeta({
      name: "",
      subject: "",
      previewText: "",
      category: "MARKETING"
    });
    setBlocks(DEFAULT_BLOCKS);
    setStyles(DEFAULT_STYLES);
    setSelectedBlockId(DEFAULT_BLOCKS[0].id);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (tpl) => {
    setEditingId(tpl._id || tpl.id);
    setTplMeta({
      name: tpl.name || "",
      subject: tpl.subject || "",
      previewText: tpl.previewText || "",
      category: tpl.category || "MARKETING"
    });

    const match = tpl.htmlContent?.match(/<!-- VERDIO_BLOCKS_DATA: (.*?) -->/);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        setBlocks(parsed.blocks || DEFAULT_BLOCKS);
        setStyles(parsed.styles || DEFAULT_STYLES);
        setSelectedBlockId(parsed.blocks?.[0]?.id || null);
      } catch (err) {
        setBlocks(DEFAULT_BLOCKS);
      }
    } else {
      setBlocks(DEFAULT_BLOCKS);
    }
    setIsEditorOpen(true);
  };

  // 3. THAO TÁC KHỐI
  const activeBlock = useMemo(() => {
    return blocks.find((b) => b.id === selectedBlockId);
  }, [blocks, selectedBlockId]);

  const updateActiveBlock = (fields) => {
    if (!selectedBlockId) return;
    setBlocks((prev) =>
      prev.map((b) => (b.id === selectedBlockId ? { ...b, ...fields } : b))
    );
  };

  const handleAddBlock = (type) => {
    const newId = `b-${Date.now()}`;
    let newBlock = null;

    switch (type) {
      case "badge":
        newBlock = { id: newId, type: "badge", text: "NEW ANNOUNCEMENT", color: "#38bdf8", bgColor: "rgba(56, 189, 248, 0.12)", align: "center" };
        break;
      case "heading":
        newBlock = { id: newId, type: "heading", text: "Tiêu Đề Điểm Nhấn Mới", size: 20, color: "#ffffff", align: "center" };
        break;
      case "text":
        newBlock = { id: newId, type: "text", content: "Nhập nội dung đoạn văn truyền tải thông điệp của bạn tại đây...", size: 14, color: "#94a3b8", align: "left" };
        break;
      case "image":
        newBlock = { id: newId, type: "image", url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000&auto=format&fit=crop&q=80", alt: "Hình ảnh", radius: 10, link: "" };
        break;
      case "button":
        newBlock = { id: newId, type: "button", text: "Bấm Vào Đây →", link: "https://", bgColor: "#38bdf8", textColor: "#020617", align: "center", radius: 8 };
        break;
      case "card":
        newBlock = { id: newId, type: "card", content: "⭐ Khung thông tin nổi bật với nền bo góc hiện đại.", bgColor: "rgba(255, 255, 255, 0.03)", borderColor: "rgba(255, 255, 255, 0.08)", textColor: "#cbd5e1" };
        break;
      case "divider":
        newBlock = { id: newId, type: "divider", color: "#1e293b" };
        break;
      default:
        break;
    }

    if (newBlock) {
      setBlocks((prev) => [...prev, newBlock]);
      setSelectedBlockId(newId);
    }
  };

  const handleMoveBlock = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const next = [...blocks];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setBlocks(next);
  };

  const handleDeleteBlock = (id) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  // 4. LƯU MẪU THƯ
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const generatedHtml = compileBlocksToHtml(blocks, styles);
      const payload = {
        name: tplMeta.name.trim(),
        subject: tplMeta.subject.trim(),
        previewText: tplMeta.previewText.trim(),
        category: tplMeta.category,
        htmlContent: generatedHtml
      };

      if (editingId) {
        await api.put(`/templates/${editingId}`, payload);
        setSuccessMsg("Cập nhật mẫu thiết kế thành công!");
      } else {
        await api.post("/templates", payload);
        setSuccessMsg("Tạo mẫu thiết kế mới thành công!");
      }
      setIsEditorOpen(false);
      fetchTemplates(meta.page);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Lỗi khi lưu mẫu thư.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClone = async (id, name) => {
    try {
      await api.post(`/templates/${id}/clone`);
      setSuccessMsg(`Đã nhân bản mẫu "${name}" thành công!`);
      fetchTemplates(meta.page);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Không thể nhân bản mẫu thư.");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa mẫu thư "${name}" không?`)) return;
    try {
      await api.delete(`/templates/${id}`);
      setTemplates((prev) => prev.filter((t) => (t._id || t.id) !== id));
      setSuccessMsg(`Đã xóa mẫu thư "${name}"`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Không thể xóa mẫu thư này.");
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-slate-300 relative">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <FileCode2 className="w-6 h-6 text-[#38bdf8]" />
              Mẫu Gửi Tin (Email Designer)
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8] text-[10px] font-mono font-bold">
              VISUAL STUDIO
            </span>
          </div>
          <p className="text-xs text-[#94a3b8]">
            Thư viện mẫu email tương tác cao với bản xem trước hình ảnh trực quan và trình biên tập không cần code
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTemplates(meta.page)}
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
            <span>Thiết Kế Mẫu Mới</span>
          </button>
        </div>
      </div>

      {/* Messages */}
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
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="hover:text-white">✕</button>
        </div>
      )}

      {/* FILTER & SEARCH */}
      <div className="p-4 rounded-2xl bg-[#0b1329]/70 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên mẫu, tiêu đề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#020617]/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.value
                  ? "bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 font-bold"
                  : "bg-white/[0.02] text-[#94a3b8] hover:text-white border border-transparent"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🖼️ LƯỚI DANH SÁCH THẺ MẪU THƯ CÓ BẢN XEM TRƯỚC TRỰC QUAN (LIVE PREVIEWS) */}
      {/* ========================================================================= */}
      {loading && templates.length === 0 ? (
        <div className="py-20 text-center text-[#64748b] bg-[#0b1329]/30 rounded-2xl border border-white/5">
          <RefreshCw className="w-6 h-6 animate-spin text-[#38bdf8] mx-auto mb-3" />
          <p className="text-xs font-mono">Đang tải danh sách mẫu thiết kế...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="py-20 text-center text-[#64748b] bg-[#0b1329]/30 rounded-2xl border border-white/5 space-y-3">
          <FolderOpen className="w-10 h-10 text-[#475569] mx-auto" />
          <p className="text-sm text-white font-medium">Chưa có mẫu thư nào trong danh mục này.</p>
          <p className="text-xs text-[#94a3b8]">Bấm "Thiết Kế Mẫu Mới" để bắt đầu tạo mẫu email đầu tiên của bạn.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => {
            const id = tpl._id || tpl.id;
            return (
              <div
                key={id}
                className="bg-[#0b1329]/70 border border-white/10 hover:border-[#38bdf8]/40 rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 group flex flex-col justify-between shadow-xl hover:shadow-[0_10px_35px_rgba(56,189,248,0.1)]"
              >
                {/* 1. KHUNG THUMBNAIL XEM TRƯỚC THỰC TẾ (Bản thu nhỏ) */}
                <TemplateThumbnail
                  htmlContent={tpl.htmlContent}
                  onPreview={() => setQuickPreviewTpl(tpl)}
                  onEdit={() => handleOpenEdit(tpl)}
                />

                {/* 2. THÔNG TIN MẪU THƯ */}
                <div className="p-4 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20">
                      {tpl.category || "MARKETING"}
                    </span>
                    <span className="text-[10px] font-mono text-[#64748b]">
                      {new Date(tpl.updatedAt || tpl.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>

                  <div>
                    <h3
                      onClick={() => handleOpenEdit(tpl)}
                      className="text-sm font-bold text-white group-hover:text-[#38bdf8] transition-colors truncate cursor-pointer"
                    >
                      {tpl.name}
                    </h3>
                    <p className="text-xs text-[#94a3b8] mt-0.5 line-clamp-1">
                      <span className="text-[#64748b]">Tiêu đề:</span> {tpl.subject}
                    </p>
                  </div>
                </div>

                {/* 3. CHÂN THẺ TÁC VỤ */}
                <div className="p-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setQuickPreviewTpl(tpl)}
                    className="flex-1 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-[11px] font-medium transition-all flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Xem Chi Tiết</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(tpl)}
                    className="p-2 rounded-xl text-[#94a3b8] hover:text-white hover:bg-white/[0.05] transition-all"
                    title="Chỉnh sửa giao diện"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleClone(id, tpl.name)}
                    className="p-2 rounded-xl text-[#94a3b8] hover:text-[#38bdf8] hover:bg-[#38bdf8]/10 transition-all"
                    title="Nhân bản mẫu này"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(id, tpl.name)}
                    className="p-2 rounded-xl text-[#94a3b8] hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Xóa mẫu"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================= */}
      {/* 🚀 MODAL TRÌNH THIẾT KẾ TRỰC QUAN NO-CODE (VISUAL EMAIL STUDIO)  */}
      {/* ================================================================= */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#010409]/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-7xl h-[94vh] bg-[#0b1329] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="h-14 px-6 border-b border-white/10 flex items-center justify-between bg-[#060b18]/90 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      {editingId ? "Tùy Chỉnh Giao Diện Thư" : "Trình Thiết Kế Email No-Code"}
                    </h2>
                    <span className="text-[10px] text-[#38bdf8] font-mono">Visual Drag & Customizer Studio</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-[#020617] border border-white/10 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("desktop")}
                      className={`p-1.5 rounded transition-all ${
                        previewDevice === "desktop" ? "bg-white/15 text-white" : "text-[#64748b]"
                      }`}
                      title="Màn hình Desktop"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("mobile")}
                      className={`p-1.5 rounded transition-all ${
                        previewDevice === "mobile" ? "bg-white/15 text-white" : "text-[#64748b]"
                      }`}
                      title="Màn hình Mobile"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => setIsEditorOpen(false)}
                    className="p-2 rounded-xl text-[#64748b] hover:text-white hover:bg-white/5 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Form Metadata */}
              <div className="p-3 border-b border-white/10 bg-white/[0.01] grid grid-cols-1 md:grid-cols-4 gap-3 text-xs shrink-0">
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-semibold uppercase text-[9px]">Tên Mẫu (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Giới thiệu sản phẩm mới"
                    value={tplMeta.name}
                    onChange={(e) => setTplMeta({ ...tplMeta, name: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-1.5 text-white outline-none focus:border-[#38bdf8]"
                  />
                </div>
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-semibold uppercase text-[9px]">Tiêu Đề Email (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Tiêu đề người nhận thấy"
                    value={tplMeta.subject}
                    onChange={(e) => setTplMeta({ ...tplMeta, subject: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-1.5 text-white outline-none focus:border-[#38bdf8]"
                  />
                </div>
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-semibold uppercase text-[9px]">Phân Loại</label>
                  <select
                    value={tplMeta.category}
                    onChange={(e) => setTplMeta({ ...tplMeta, category: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-1.5 text-white outline-none focus:border-[#38bdf8]"
                  >
                    <option value="MARKETING">MARKETING</option>
                    <option value="NEWSLETTER">NEWSLETTER</option>
                    <option value="ONBOARDING">ONBOARDING</option>
                    <option value="TRANSACTIONAL">TRANSACTIONAL</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#94a3b8] mb-1 font-semibold uppercase text-[9px]">Đoạn Xem Trước (Preheader)</label>
                  <input
                    type="text"
                    placeholder="Mô tả ngắn trước khi bấm mở thư"
                    value={tplMeta.previewText}
                    onChange={(e) => setTplMeta({ ...tplMeta, previewText: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-1.5 text-white outline-none focus:border-[#38bdf8]"
                  />
                </div>
              </div>

              {/* KHU VỰC THIẾT KẾ (3 CỘT) */}
              <div className="flex-1 flex overflow-hidden">
                {/* 1. THANH THÊM KHỐI */}
                <div className="w-56 border-r border-white/10 bg-[#060b18]/90 p-3 space-y-4 overflow-y-auto shrink-0 select-none">
                  <div>
                    <span className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider block mb-2 px-1">
                      Thêm Khối Mới
                    </span>
                    <div className="space-y-1.5">
                      {[
                        { type: "badge", label: "Huy Hiệu (Badge)", icon: ShieldCheck },
                        { type: "heading", label: "Tiêu Đề (Heading)", icon: Heading },
                        { type: "text", label: "Đoạn Văn (Text)", icon: Type },
                        { type: "image", label: "Ảnh / Banner", icon: ImageIcon },
                        { type: "button", label: "Nút Bấm (Button)", icon: MousePointerClick },
                        { type: "card", label: "Khung Tin (Box)", icon: Layers },
                        { type: "divider", label: "Đường Kẻ (Divider)", icon: Minus }
                      ].map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => handleAddBlock(item.type)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-[#38bdf8]/15 border border-white/5 hover:border-[#38bdf8]/30 text-xs text-[#cbd5e1] hover:text-[#38bdf8] transition-all text-left"
                        >
                          <item.icon className="w-3.5 h-3.5 text-[#38bdf8]" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 space-y-3">
                    <span className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider block px-1">
                      Tùy Biến Nền Email
                    </span>
                    <div>
                      <label className="text-[10px] text-[#94a3b8] block mb-1">Màu Hộp Thư</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={styles.cardBg}
                          onChange={(e) => setStyles({ ...styles, cardBg: e.target.value })}
                          className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                        />
                        <span className="text-xs font-mono text-white">{styles.cardBg}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#94a3b8] block mb-1">Màu Nền Ngoài</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={styles.containerBg}
                          onChange={(e) => setStyles({ ...styles, containerBg: e.target.value })}
                          className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                        />
                        <span className="text-xs font-mono text-white">{styles.containerBg}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. CANVAS HIỂN THỊ TRỰC QUAN */}
                <div
                  className="flex-1 overflow-y-auto p-6 flex justify-center items-start transition-colors"
                  style={{ backgroundColor: styles.containerBg }}
                >
                  <div
                    className={`transition-all duration-300 rounded-2xl border shadow-2xl p-8 relative space-y-3 ${
                      previewDevice === "mobile" ? "w-[380px]" : "w-full max-w-[620px]"
                    }`}
                    style={{
                      backgroundColor: styles.cardBg,
                      borderColor: styles.borderColor,
                      borderRadius: `${styles.radius}px`
                    }}
                  >
                    {blocks.map((b, idx) => {
                      const isSelected = b.id === selectedBlockId;
                      return (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBlockId(b.id)}
                          className={`relative group rounded-xl transition-all cursor-pointer p-2.5 ${
                            isSelected
                              ? "ring-2 ring-[#38bdf8] bg-white/[0.03]"
                              : "hover:bg-white/[0.02]"
                          }`}
                        >
                          <div
                            className={`absolute right-2 -top-3.5 z-20 flex items-center gap-1 bg-[#020617] border border-white/20 rounded-lg p-1 shadow-lg transition-opacity ${
                              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleMoveBlock(idx, -1)}
                              disabled={idx === 0}
                              className="p-1 hover:text-[#38bdf8] disabled:opacity-20 text-[#94a3b8]"
                              title="Lên trên"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveBlock(idx, 1)}
                              disabled={idx === blocks.length - 1}
                              className="p-1 hover:text-[#38bdf8] disabled:opacity-20 text-[#94a3b8]"
                              title="Xuống dưới"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBlock(b.id)}
                              className="p-1 hover:text-red-400 text-[#94a3b8]"
                              title="Xóa khối này"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {b.type === "badge" && (
                            <div style={{ textAlign: b.align || "center" }}>
                              <span
                                style={{
                                  backgroundColor: b.bgColor,
                                  color: b.color,
                                  border: `1px solid ${b.color}40`
                                }}
                                className="inline-block px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wider"
                              >
                                {b.text}
                              </span>
                            </div>
                          )}

                          {b.type === "heading" && (
                            <h1
                              style={{
                                color: b.color,
                                fontSize: `${b.size}px`,
                                textAlign: b.align || "center"
                              }}
                              className="font-extrabold leading-tight m-0"
                            >
                              {b.text}
                            </h1>
                          )}

                          {b.type === "text" && (
                            <p
                              style={{
                                color: b.color,
                                fontSize: `${b.size}px`,
                                textAlign: b.align || "left"
                              }}
                              className="leading-relaxed m-0 whitespace-pre-line"
                            >
                              {b.content}
                            </p>
                          )}

                          {b.type === "image" && (
                            <div className="w-full">
                              <img
                                src={b.url}
                                alt={b.alt}
                                style={{ borderRadius: `${b.radius}px` }}
                                className="w-full max-h-72 object-cover block shadow-md"
                              />
                            </div>
                          )}

                          {b.type === "button" && (
                            <div style={{ textAlign: b.align || "center" }} className="py-2">
                              <span
                                style={{
                                  backgroundColor: b.bgColor,
                                  color: b.textColor,
                                  borderRadius: `${b.radius}px`
                                }}
                                className="inline-block px-7 py-3 font-bold text-xs shadow-lg"
                              >
                                {b.text}
                              </span>
                            </div>
                          )}

                          {b.type === "card" && (
                            <div
                              style={{
                                backgroundColor: b.bgColor,
                                borderColor: b.borderColor,
                                color: b.textColor
                              }}
                              className="p-4 rounded-xl border text-xs leading-relaxed"
                            >
                              {b.content}
                            </div>
                          )}

                          {b.type === "divider" && (
                            <hr style={{ borderColor: b.color }} className="border-t my-2" />
                          )}

                          {b.type === "footer" && (
                            <div style={{ color: b.color }} className="text-[11px] text-center space-y-1">
                              <p className="m-0">{b.text}</p>
                              <span className="text-[#38bdf8] underline">{b.unsubText}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. CỘT THUỘC TÍNH KHỐI */}
                <div className="w-80 border-l border-white/10 bg-[#060b18]/90 p-4 space-y-4 overflow-y-auto shrink-0">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#38bdf8]" /> Thuộc Tính Khối
                    </span>
                    {activeBlock && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-[#38bdf8]">
                        {activeBlock.type.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {!activeBlock ? (
                    <div className="py-12 text-center text-xs text-[#64748b]">
                      Bấm vào khối bất kỳ ở khung giữa để chỉnh sửa văn bản, màu sắc hoặc hình ảnh.
                    </div>
                  ) : (
                    <div className="space-y-4 text-xs">
                      {["heading", "text", "badge"].includes(activeBlock.type) && (
                        <div>
                          <label className="text-[10px] text-[#94a3b8] uppercase font-mono block mb-1.5">
                            + Chèn Biến Khách Hàng:
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {MERGE_TAGS.map((m) => (
                              <button
                                key={m.tag}
                                type="button"
                                onClick={() => {
                                  if (activeBlock.type === "text") {
                                    updateActiveBlock({ content: activeBlock.content + " " + m.tag });
                                  } else {
                                    updateActiveBlock({ text: activeBlock.text + " " + m.tag });
                                  }
                                }}
                                className="px-2 py-1 rounded bg-white/[0.04] hover:bg-[#38bdf8]/15 border border-white/10 text-[10px] text-[#cbd5e1] hover:text-[#38bdf8]"
                              >
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {(activeBlock.type === "heading" || activeBlock.type === "badge") && (
                        <div>
                          <label className="text-[#94a3b8] block mb-1 font-semibold">Nội Dung Chữ</label>
                          <input
                            type="text"
                            value={activeBlock.text}
                            onChange={(e) => updateActiveBlock({ text: e.target.value })}
                            className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#38bdf8]"
                          />
                        </div>
                      )}

                      {activeBlock.type === "text" && (
                        <div>
                          <label className="text-[#94a3b8] block mb-1 font-semibold">Nội Dung Đoạn Văn</label>
                          <textarea
                            rows="4"
                            value={activeBlock.content}
                            onChange={(e) => updateActiveBlock({ content: e.target.value })}
                            className="w-full bg-[#020617] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#38bdf8] text-xs leading-relaxed"
                          />
                        </div>
                      )}

                      {activeBlock.type === "image" && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[#94a3b8] block mb-1 font-semibold">Đường Dẫn Ảnh (Image URL)</label>
                            <input
                              type="text"
                              value={activeBlock.url}
                              onChange={(e) => updateActiveBlock({ url: e.target.value })}
                              placeholder="https://link-anh-cua-ban.jpg"
                              className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#38bdf8]"
                            />
                          </div>
                          <div>
                            <label className="text-[#94a3b8] block mb-1 font-semibold">Liên Kết Khi Bấm Vào Ảnh (Tùy chọn)</label>
                            <input
                              type="text"
                              value={activeBlock.link || ""}
                              onChange={(e) => updateActiveBlock({ link: e.target.value })}
                              placeholder="https://trang-dich-chien-dich.com"
                              className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#38bdf8]"
                            />
                          </div>
                          <div>
                            <label className="text-[#94a3b8] block mb-1 font-semibold">Bo Góc Ảnh ({activeBlock.radius || 12}px)</label>
                            <input
                              type="range"
                              min="0"
                              max="30"
                              value={activeBlock.radius || 12}
                              onChange={(e) => updateActiveBlock({ radius: Number(e.target.value) })}
                              className="w-full cursor-pointer accent-[#38bdf8]"
                            />
                          </div>
                        </div>
                      )}

                      {activeBlock.type === "button" && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[#94a3b8] block mb-1 font-semibold">Chữ Nút Bấm</label>
                            <input
                              type="text"
                              value={activeBlock.text}
                              onChange={(e) => updateActiveBlock({ text: e.target.value })}
                              className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#38bdf8]"
                            />
                          </div>
                          <div>
                            <label className="text-[#94a3b8] block mb-1 font-semibold">Đường Dẫn Đích (URL)</label>
                            <input
                              type="text"
                              value={activeBlock.link}
                              onChange={(e) => updateActiveBlock({ link: e.target.value })}
                              placeholder="https://trang-dich.com"
                              className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#38bdf8]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-[#94a3b8] block mb-1">Màu Nút</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={activeBlock.bgColor}
                                  onChange={(e) => updateActiveBlock({ bgColor: e.target.value })}
                                  className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
                                />
                                <span className="text-[10px] font-mono text-white">{activeBlock.bgColor}</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] text-[#94a3b8] block mb-1">Màu Chữ</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={activeBlock.textColor}
                                  onChange={(e) => updateActiveBlock({ textColor: e.target.value })}
                                  className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
                                />
                                <span className="text-[10px] font-mono text-white">{activeBlock.textColor}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {["heading", "text", "button", "badge"].includes(activeBlock.type) && (
                        <div>
                          <label className="text-[#94a3b8] block mb-1 font-semibold">Căn Lề</label>
                          <div className="grid grid-cols-3 gap-1 bg-[#020617] border border-white/10 rounded-xl p-1">
                            {[
                              { align: "left", icon: AlignLeft },
                              { align: "center", icon: AlignCenter },
                              { align: "right", icon: AlignRight }
                            ].map((item) => (
                              <button
                                key={item.align}
                                type="button"
                                onClick={() => updateActiveBlock({ align: item.align })}
                                className={`py-1.5 rounded-lg flex items-center justify-center transition-all ${
                                  activeBlock.align === item.align ? "bg-white/15 text-[#38bdf8]" : "text-[#64748b]"
                                }`}
                              >
                                <item.icon className="w-3.5 h-3.5" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {["heading", "text", "badge"].includes(activeBlock.type) && (
                        <div>
                          <label className="text-[#94a3b8] block mb-1 font-semibold">Màu Chữ</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={activeBlock.color}
                              onChange={(e) => updateActiveBlock({ color: e.target.value })}
                              className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                            />
                            <span className="text-xs font-mono text-white">{activeBlock.color}</span>
                          </div>
                        </div>
                      )}

                      {activeBlock.type === "card" && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[#94a3b8] block mb-1 font-semibold">Nội Dung Khung</label>
                            <textarea
                              rows="3"
                              value={activeBlock.content}
                              onChange={(e) => updateActiveBlock({ content: e.target.value })}
                              className="w-full bg-[#020617] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#38bdf8]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#94a3b8] block mb-1">Màu Nền Khung</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={activeBlock.bgColor.startsWith("#") ? activeBlock.bgColor : "#1e1b4b"}
                                onChange={(e) => updateActiveBlock({ bgColor: e.target.value })}
                                className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                              />
                              <span className="text-xs font-mono text-white">{activeBlock.bgColor}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="h-16 px-6 border-t border-white/10 bg-[#060b18] flex items-center justify-between shrink-0">
                <span className="text-xs text-[#64748b]">
                  * Email được tự động biên dịch sang định dạng chuẩn Gmail, Outlook & Apple Mail khi lưu.
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 rounded-xl hover:bg-white/5 text-xs text-[#94a3b8]"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="button"
                    disabled={submitting || !tplMeta.name || !tplMeta.subject}
                    onClick={handleSaveTemplate}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                  >
                    {submitting ? "Đang Lưu..." : editingId ? "Lưu Thiết Kế" : "Tạo Mẫu Thư"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL QUICK PREVIEW ĐƠN LẺ */}
      <AnimatePresence>
        {quickPreviewTpl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010409]/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl h-[84vh] bg-[#0b1329] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#060b18]">
                <div>
                  <h3 className="text-sm font-bold text-white">{quickPreviewTpl.name}</h3>
                  <p className="text-xs text-[#94a3b8]">{quickPreviewTpl.subject}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const t = quickPreviewTpl;
                      setQuickPreviewTpl(null);
                      handleOpenEdit(t);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#38bdf8] text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Mở Biên Tập</span>
                  </button>
                  <button onClick={() => setQuickPreviewTpl(null)} className="p-1.5 rounded-lg text-[#64748b] hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-4 bg-[#020617] overflow-hidden flex justify-center">
                <iframe
                  title="Quick View"
                  srcDoc={quickPreviewTpl.htmlContent}
                  className="w-full h-full max-w-xl border border-white/10 rounded-xl bg-transparent"
                  sandbox="allow-same-origin"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}