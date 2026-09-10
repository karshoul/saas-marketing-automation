import React, { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import {
  CreditCard,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Sparkles,
  Clock,
  ArrowRight,
  QrCode,
  RefreshCw,
  AlertCircle,
  X,
  Building2,
  Copy,
  Check
} from "lucide-react";

export default function Billing() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState(null);
  const [currentPlan, setCurrentPlan] = useState("FREE");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal Checkout State
  const [checkoutModal, setCheckoutModal] = useState(null); // Lưu thông tin order đang chờ trả
  const [submitting, setSubmitting] = useState(false);
  const [pollingStatus, setPollingStatus] = useState("PENDING");
  const [copied, setCopied] = useState(false);

  // Tải thông tin gói cước và trạng thái Workspace hiện tại
  const fetchBillingData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [plansRes, tenantRes] = await Promise.all([
        api.get("/billing/plans"),
        api.get("/tenants/me")
      ]);

      setPlans(plansRes.data?.data || plansRes.data);
      const tenantData = tenantRes.data?.data?.tenant || tenantRes.data?.tenant || tenantRes.data?.data;
      if (tenantData?.plan) {
        setCurrentPlan(tenantData.plan);
      }
    } catch (err) {
      console.error("Lỗi tải thông tin Billing:", err);
      setErrorMsg(err.response?.data?.message || "Không thể tải danh sách gói cước.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  // Khởi tạo thanh toán mua gói
  const handleSubscribe = async (planKey) => {
    if (planKey === currentPlan) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await api.post("/billing/subscribe", { plan: planKey });
      const orderData = res.data?.data || res.data;
      setCheckoutModal(orderData);
      setPollingStatus("PENDING");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Không thể khởi tạo đơn hàng.");
    } finally {
      setSubmitting(false);
    }
  };

  // Polling tự động kiểm tra trạng thái thanh toán khi Modal mở
  useEffect(() => {
    if (!checkoutModal?.orderId || pollingStatus === "PAID") return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/billing/order/${checkoutModal.orderId}`);
        const order = res.data?.data || res.data;
        if (order?.status === "PAID") {
          setPollingStatus("PAID");
          setSuccessMsg(`Thanh toán thành công! Gói cước đã được nâng cấp lên ${order.plan}.`);
          fetchBillingData();
          setTimeout(() => {
            setCheckoutModal(null);
          }, 2500);
        }
      } catch (err) {
        console.error("Lỗi polling đơn hàng:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [checkoutModal, pollingStatus, fetchBillingData]);

  // Nút Demo: Giả lập Webhook xác nhận thanh toán thành công ngay lập tức
  // Trong handleSimulatePaymentSuccess:
  const handleSimulatePaymentSuccess = async () => {
    if (!checkoutModal?.orderCode) return;
    try {
      await api.post("/billing/confirm", { orderCode: checkoutModal.orderCode });
      setPollingStatus("PAID");
      setSuccessMsg(`Đã kích hoạt thành công gói cước ${checkoutModal.plan}!`);
      
      // Bắn tín hiệu để AppLayout tự cập nhật ngay lập tức
      window.dispatchEvent(new Event("tenant_updated"));

      fetchBillingData();
      setTimeout(() => {
        setCheckoutModal(null);
      }, 2000);
    } catch (err) {
      setErrorMsg("Lỗi xác nhận thanh toán giả lập.");
    }
  };
  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <CreditCard className="w-6 h-6 text-[#38bdf8]" />
              Gói Dịch Vụ & Thanh Toán
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
              VIETQR AUTO-ACTIVATION
            </span>
          </div>
          <p className="text-xs text-[#94a3b8]">
            Nâng cấp hạn ngạch gửi thư, mở rộng dung lượng danh bạ và tăng mức độ ưu tiên hàng đợi P(t)
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/10">
          <span className="text-[#94a3b8]">Gói Hiện Tại:</span>
          <span className="text-white font-bold px-2 py-0.5 rounded bg-[#6366f1]/20 border border-[#6366f1]/30 text-[#38bdf8]">
            {currentPlan}
          </span>
        </div>
      </div>

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

      {/* ================= PRICING CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* FREE TIER */}
        <div className={`p-6 rounded-2xl border backdrop-blur-xl flex flex-col justify-between transition-all ${
          currentPlan === "FREE"
            ? "bg-[#6366f1]/10 border-[#38bdf8]/40 shadow-[0_0_30px_rgba(56,189,248,0.15)]"
            : "bg-[#0b1329]/70 border-white/10"
        }`}>
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-mono font-bold uppercase text-[#94a3b8]">Bản Dùng Thử</span>
              {currentPlan === "FREE" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white border border-white/20">
                  Đang dùng
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white">Free Starter</h3>
            <div className="mt-3 mb-6">
              <span className="text-3xl font-mono font-bold text-white">0đ</span>
              <span className="text-xs text-[#94a3b8] font-mono"> / vĩnh viễn</span>
            </div>

            <ul className="space-y-3 text-xs text-[#cbd5e1] border-t border-white/10 pt-5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span><b>3,000</b> email gửi / tháng</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span><b>500</b> khách hàng danh bạ</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Ưu tiên chuẩn <b>P(t) Bulk (W=0)</b></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>1 Kịch bản tự động hóa</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4">
            <button
              disabled
              className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-[#64748b] cursor-not-allowed"
            >
              {currentPlan === "FREE" ? "Gói Mặc Định" : "Gói Tiêu Chuẩn"}
            </button>
          </div>
        </div>

        {/* PRO TIER (POPULAR) */}
        <div className={`p-6 rounded-2xl border backdrop-blur-xl flex flex-col justify-between relative transition-all ${
          currentPlan === "PRO"
            ? "bg-[#6366f1]/15 border-[#38bdf8] shadow-[0_0_35px_rgba(99,102,241,0.25)]"
            : "bg-[#0b1329]/90 border-[#6366f1]/50 shadow-[0_10px_35px_rgba(0,0,0,0.4)]"
        }`}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#6366f1] to-[#38bdf8] text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
            Phổ Biến Nhất
          </div>

          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-mono font-bold uppercase text-[#38bdf8]">Doanh Nghiệp Vừa</span>
              {currentPlan === "PRO" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Đang dùng
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white">Pro Automation</h3>
            <div className="mt-3 mb-6">
              <span className="text-3xl font-mono font-bold text-white">590.000đ</span>
              <span className="text-xs text-[#94a3b8] font-mono"> / tháng</span>
            </div>

            <ul className="space-y-3 text-xs text-[#cbd5e1] border-t border-white/10 pt-5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#38bdf8] flex-shrink-0" />
                <span><b>50,000</b> email gửi / tháng</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#38bdf8] flex-shrink-0" />
                <span><b>10,000</b> khách hàng danh bạ</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#38bdf8] flex-shrink-0" />
                <span>Ưu tiên cao <b>P(t) Boost (W=5)</b></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#38bdf8] flex-shrink-0" />
                <span>10 Kịch bản tự động hóa</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#38bdf8] flex-shrink-0" />
                <span>Hỗ trợ Cổng gửi thư riêng SMTP Relay</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4">
            <button
              onClick={() => handleSubscribe("PRO")}
              disabled={currentPlan === "PRO" || submitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] hover:from-[#4f46e5] hover:to-[#0284c7] text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
            >
              {currentPlan === "PRO" ? "Gói Hiện Tại Của Bạn" : "Nâng Cấp Gói Pro"}
            </button>
          </div>
        </div>

        {/* ENTERPRISE ULTRA */}
        <div className={`p-6 rounded-2xl border backdrop-blur-xl flex flex-col justify-between transition-all ${
          currentPlan === "ENTERPRISE"
            ? "bg-[#6366f1]/15 border-[#38bdf8] shadow-[0_0_30px_rgba(56,189,248,0.2)]"
            : "bg-[#0b1329]/70 border-white/10"
        }`}>
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-mono font-bold uppercase text-amber-400">Tập Đoàn / Quy Mô Lớn</span>
              {currentPlan === "ENTERPRISE" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Đang dùng
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white">Enterprise Ultra</h3>
            <div className="mt-3 mb-6">
              <span className="text-3xl font-mono font-bold text-white">1.890.000đ</span>
              <span className="text-xs text-[#94a3b8] font-mono"> / tháng</span>
            </div>

            <ul className="space-y-3 text-xs text-[#cbd5e1] border-t border-white/10 pt-5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span><b>500,000</b> email gửi / tháng</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span><b>100,000</b> khách hàng danh bạ</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Ưu tiên tuyệt đối <b>OTP / Hỏa tốc (W=10)</b></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Không giới hạn Kịch bản Workflow</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Dedicated IP & SLA 99.9%</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4">
            <button
              onClick={() => handleSubscribe("ENTERPRISE")}
              disabled={currentPlan === "ENTERPRISE" || submitting}
              className="w-full py-2.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40"
            >
              {currentPlan === "ENTERPRISE" ? "Gói Hiện Tại Của Bạn" : "Nâng Cấp Enterprise"}
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL QUÉT MÃ VIETQR THANH TOÁN ================= */}
      {checkoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010409]/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0b1329] border border-white/15 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative">
            <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#38bdf8]" />
                <h2 className="text-base font-bold text-white">Thanh Toán Gói {checkoutModal.plan}</h2>
              </div>
              <button
                onClick={() => setCheckoutModal(null)}
                className="text-[#64748b] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pollingStatus === "PAID" ? (
              <div className="py-10 text-center space-y-3">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
                <h3 className="text-lg font-bold text-white">Thanh Toán Thành Công!</h3>
                <p className="text-xs text-[#94a3b8]">Hệ thống đang làm mới phân vùng Workspace của bạn...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[#94a3b8] text-center">
                  Mở ứng dụng Ngân Hàng bất kỳ và quét mã VietQR để hoàn tất nâng cấp tự động:
                </p>

                {/* Khung hiển thị mã QR */}
                <div className="p-4 bg-white rounded-2xl flex items-center justify-center max-w-[280px] mx-auto shadow-xl">
                  <img
                    src={checkoutModal.qrUrl}
                    alt="VietQR Payment"
                    className="w-full h-auto rounded-lg object-contain"
                  />
                </div>

                {/* Thông tin chuyển khoản thủ công */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">Ngân Hàng:</span>
                    <span className="text-white font-bold">{checkoutModal.bankInfo?.BANK_ID}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">Số Tài Khoản:</span>
                    <span className="text-white font-bold">{checkoutModal.bankInfo?.ACCOUNT_NO}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">Số Tiền:</span>
                    <span className="text-emerald-400 font-bold">{checkoutModal.amount?.toLocaleString()} VNĐ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#94a3b8]">Nội Dung CK:</span>
                    <button
                      onClick={() => copyText(checkoutModal.orderCode)}
                      className="text-[#38bdf8] font-bold flex items-center gap-1 hover:underline"
                    >
                      {checkoutModal.orderCode}
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-[#94a3b8]">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#38bdf8]" />
                  <span>Đang đợi tín hiệu thanh toán từ hệ thống ngân hàng...</span>
                </div>

                {/* NÚT FAST-TRACK DEMO */}
                <div className="pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleSimulatePaymentSuccess}
                    className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Mô Phỏng Đã Chuyển Tiền Thành Công (Demo Nhanh)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}