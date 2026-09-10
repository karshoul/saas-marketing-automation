import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  Send,
  Users,
  Eye,
  MousePointerClick,
  TrendingUp,
  Plus,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CreditCard,
  Building2,
  ChevronRight
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [contactCount, setContactCount] = useState(0);

  // Chỉ số tổng hợp
  const [stats, setStats] = useState({
    sentMonth: 0,
    monthlyLimit: 3000,
    deliveryRate: "99.8%",
    openRate: "0.0%",
    clickRate: "0.0%"
  });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Lấy thông tin Tenant & Quota
      const tenantRes = await api.get("/tenants/me");
      const rawTenant = tenantRes.data?.data?.tenant || tenantRes.data?.tenant || tenantRes.data?.data;
      setTenant(rawTenant);

      const activePlan = (rawTenant?.plan || rawTenant?.subscriptionPlan || "FREE").toUpperCase();
      const fallbackLimits = { FREE: 3000, PRO: 50000, ENTERPRISE: 500000 };
      const limit = rawTenant?.quotas?.monthlyEmailLimit || fallbackLimits[activePlan] || 3000;
      const sentMonth = rawTenant?.usage?.emailsSentThisMonth || 0;

      // 2. Lấy danh sách Campaign gần đây
      const campRes = await api.get("/campaigns", { params: { limit: 5 } });
      const campList = campRes.data?.data || [];
      setCampaigns(campList);

      // Tính toán tỷ lệ tương tác tổng
      let totalSent = 0;
      let totalOpened = 0;
      let totalClicked = 0;
      campList.forEach((c) => {
        totalSent += c.stats?.sentCount || 0;
        totalOpened += c.stats?.openedCount || 0;
        totalClicked += c.stats?.clickedCount || 0;
      });

      const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) + "%" : "0.0%";
      const clickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) + "%" : "0.0%";

      // 3. Lấy số lượng Contact hiện có
      try {
        const contactRes = await api.get("/contacts", { params: { limit: 1 } });
        const meta = contactRes.data?.meta;
        if (meta?.total !== undefined) {
          setContactCount(meta.total);
        }
      } catch {
        // Ignored
      }

      setStats({
        sentMonth,
        monthlyLimit: limit,
        deliveryRate: "99.8%",
        openRate,
        clickRate
      });
    } catch (err) {
      console.error("Lỗi tải dữ liệu Dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const quotaPercent = Math.min(
    100,
    Math.round((stats.sentMonth / (stats.monthlyLimit || 1)) * 100)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ================= HEADER HERO ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Bàn Điều Khiển Không Gian
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SẴN SÀNG PHÁT TÁN
            </span>
          </div>
          <p className="text-xs text-[#94a3b8]">
            Tổng quan hiệu suất truyền thông, hạn mức gửi thư và tình trạng tương tác khách hàng
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs text-[#94a3b8] hover:text-white transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#38bdf8]" : ""}`} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={() => navigate("/campaigns")}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] hover:from-[#4f46e5] hover:to-[#0284c7] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Chiến Dịch Mới</span>
          </button>
        </div>
      </div>

      {/* ================= 4 BUSINESS KPI METRICS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Hạn mức gửi thư */}
        <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl group hover:border-[#38bdf8]/40 transition-all">
          <div className="flex justify-between items-start text-[#94a3b8] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Hạn Mức Đã Dùng</span>
            <Send className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div className="text-2xl font-mono font-bold text-white mb-2">
            {stats.sentMonth.toLocaleString()}{" "}
            <span className="text-xs text-[#64748b] font-normal">
              / {stats.monthlyLimit.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6366f1] to-[#38bdf8] transition-all duration-500"
              style={{ width: `${quotaPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-[#94a3b8] font-mono mt-2 flex justify-between">
            <span>Tiêu thụ: {quotaPercent}%</span>
            <Link to="/billing" className="text-[#38bdf8] hover:underline flex items-center gap-0.5">
              Nâng gói <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Tỷ lệ phân phối */}
        <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl group hover:border-emerald-400/40 transition-all">
          <div className="flex justify-between items-start text-[#94a3b8] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Tỷ Lệ Giao Thư</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mb-1">
            {stats.deliveryRate}
          </div>
          <div className="text-[11px] text-[#94a3b8] font-mono">
            Hòm thư bảo mật & uy tín cao
          </div>
        </div>

        {/* Card 3: Tỷ lệ mở thư */}
        <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl group hover:border-[#6366f1]/40 transition-all">
          <div className="flex justify-between items-start text-[#94a3b8] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Tỷ Lệ Mở (Open Rate)</span>
            <Eye className="w-4 h-4 text-[#818cf8]" />
          </div>
          <div className="text-2xl font-mono font-bold text-white mb-1">
            {stats.openRate}
          </div>
          <div className="text-[11px] text-[#94a3b8] font-mono">
            Đo lường từ Tracking Pixel
          </div>
        </div>

        {/* Card 4: Quy mô danh bạ */}
        <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl group hover:border-amber-400/40 transition-all">
          <div className="flex justify-between items-start text-[#94a3b8] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Quy Mô Danh Bạ</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white mb-1">
            {contactCount.toLocaleString()} <span className="text-xs text-[#94a3b8] font-normal">hồ sơ</span>
          </div>
          <div className="text-[11px] text-[#94a3b8] font-mono">
            Khách hàng đã xác thực
          </div>
        </div>
      </div>

      {/* ================= MIDDLE SECTION: QUICK SHORTCUTS & BANNER ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Banner Gói Cước Hiện Tại */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-r from-[#0b1329] via-[#0e1b38] to-[#0b1329] border border-white/10 backdrop-blur-xl flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-2 z-10">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#6366f1]/20 text-[#818cf8] border border-[#6366f1]/40">
                GÓI DOANH NGHIỆP
              </span>
              <span className="text-xs text-[#94a3b8] font-mono">Workspace: {tenant?.name || "Verdio"}</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Cụm Hạ Tầng {tenant?.plan || "ENTERPRISE"} Đang Hoạt Động
            </h2>
            <p className="text-xs text-[#94a3b8] max-w-xl leading-relaxed">
              Bạn đang được cấp phát băng thông gửi thư tốc độ cao, khả năng kích hoạt chiến dịch hỏa tốc và hỗ trợ kết nối cổng relay SMTP chuyên dụng.
            </p>
          </div>

          <div className="pt-5 border-t border-white/10 flex flex-wrap items-center gap-3 z-10 mt-4">
            <Link
              to="/campaigns"
              className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Quản Lý Chiến Dịch</span>
            </Link>

            <Link
              to="/contacts"
              className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import Khách Hàng</span>
            </Link>

            <Link
              to="/billing"
              className="px-3.5 py-2 rounded-xl bg-[#6366f1]/20 hover:bg-[#6366f1]/30 border border-[#6366f1]/40 text-xs font-semibold text-[#818cf8] transition-all flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Chi Tiết Gói & Quotas</span>
            </Link>
          </div>
        </div>

        {/* Lối tắt tạo nhanh */}
        <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Thao Tác Nhanh</h3>
            <p className="text-xs text-[#94a3b8] mb-4">Các tác vụ thường nhật</p>

            <div className="space-y-2.5">
              <button
                onClick={() => navigate("/templates")}
                className="w-full p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 text-left flex items-center justify-between transition-all group"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-[#38bdf8] transition-colors">
                    Studio Mẫu Email
                  </div>
                  <div className="text-[10px] text-[#64748b]">Soạn mẫu HTML xem trước Mobile</div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#64748b] group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => navigate("/automations")}
                className="w-full p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 text-left flex items-center justify-between transition-all group"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-[#38bdf8] transition-colors">
                    Kịch Bản Tự Động
                  </div>
                  <div className="text-[10px] text-[#64748b]">Thiết lập luồng Trigger & Delay</div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#64748b] group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => navigate("/analytics")}
                className="w-full p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 text-left flex items-center justify-between transition-all group"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-[#38bdf8] transition-colors">
                    Phễu Báo Cáo Chuyển Đổi
                  </div>
                  <div className="text-[10px] text-[#64748b]">Xem thống kê lượt mở và click link</div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#64748b] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RECENT CAMPAIGNS TABLE ================= */}
      <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Chiến Dịch Gần Đây</h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">Tiến độ phát tán và kết quả gửi thực tế</p>
          </div>
          <Link
            to="/campaigns"
            className="text-xs text-[#38bdf8] hover:underline flex items-center gap-1"
          >
            <span>Xem tất cả</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-[#94a3b8] bg-white/[0.02]">
                <th className="py-3 px-4">Tên Chiến Dịch</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4">Tiến Độ Gửi</th>
                <th className="py-3 px-4">Tỷ Lệ Mở</th>
                <th className="py-3 px-4 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-[#64748b]">
                    Chưa có chiến dịch nào được khởi tạo gần đây.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => {
                  const id = c._id || c.id;
                  const total = c.stats?.totalRecipients || 0;
                  const sent = c.stats?.sentCount || 0;
                  const percent = total > 0 ? Math.round((sent / total) * 100) : 0;
                  const opened = c.stats?.openedCount || 0;
                  const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(1) + "%" : "0%";

                  return (
                    <tr key={id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{c.name}</div>
                        <div className="text-[11px] font-mono text-[#64748b] truncate max-w-xs">
                          {c.subject}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            c.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : c.status === "PROCESSING"
                              ? "bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20"
                              : "bg-white/5 text-[#94a3b8] border border-white/10"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              c.status === "COMPLETED"
                                ? "bg-emerald-400"
                                : c.status === "PROCESSING"
                                ? "bg-[#38bdf8] animate-pulse"
                                : "bg-[#94a3b8]"
                            }`}
                          />
                          {c.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="w-32">
                          <div className="flex justify-between text-[10px] font-mono text-[#94a3b8] mb-1">
                            <span>{sent} / {total}</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#38bdf8]"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-[#818cf8]">
                        {openRate}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to="/campaigns"
                          className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#38bdf8] text-[11px] transition-all inline-flex items-center gap-1"
                        >
                          <span>Quản lý</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}