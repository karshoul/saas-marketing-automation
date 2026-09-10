import React, { useState } from "react";
import {
  GitFork,
  Plus,
  Play,
  Pause,
  Clock,
  Mail,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowDown,
  Sparkles,
  Zap,
  Split,
  ChevronRight,
  Send,
  MoreVertical,
  Activity,
  Layers
} from "lucide-react";

const INITIAL_WORKFLOWS = [
  {
    id: "wf-1",
    name: "Chuỗi Chào Mừng Thành Viên Mới",
    trigger: "Contact Created",
    status: "ACTIVE",
    runsCount: 1240,
    completionRate: "98.5%",
    stepsCount: 4,
    lastRun: "5 phút trước"
  },
  {
    id: "wf-2",
    name: "Cứu Giỏ Hàng Chưa Thanh Toán (Abandoned Cart)",
    trigger: "Tag Added: #GIO_HANG",
    status: "ACTIVE",
    runsCount: 480,
    completionRate: "94.2%",
    stepsCount: 3,
    lastRun: "12 phút trước"
  },
  {
    id: "wf-3",
    name: "Tái Tương Tác Khách Hàng Rời Bỏ (Churn Risk)",
    trigger: "Inactive > 30 Days",
    status: "PAUSED",
    runsCount: 310,
    completionRate: "89.0%",
    stepsCount: 5,
    lastRun: "Hôm qua"
  }
];

export default function Automations() {
  const [workflows, setWorkflows] = useState(INITIAL_WORKFLOWS);
  const [selectedWf, setSelectedWf] = useState(INITIAL_WORKFLOWS[0]);
  const [simulating, setSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  // Toggle trạng thái Active / Paused
  const toggleStatus = (id) => {
    setWorkflows((prev) =>
      prev.map((wf) => {
        if (wf.id === id) {
          const nextStatus = wf.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
          return { ...wf, status: nextStatus };
        }
        return wf;
      })
    );
    if (selectedWf.id === id) {
      setSelectedWf((prev) => ({
        ...prev,
        status: prev.status === "ACTIVE" ? "PAUSED" : "ACTIVE"
      }));
    }
  };

  // Kích hoạt mô phỏng luồng
  const runSimulation = () => {
    setSimulating(true);
    setSimulationStep(1);

    setTimeout(() => setSimulationStep(2), 1200);
    setTimeout(() => setSimulationStep(3), 2400);
    setTimeout(() => setSimulationStep(4), 3600);
    setTimeout(() => {
      setSimulating(false);
      setSimulationStep(0);
    }, 4800);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <GitFork className="w-6 h-6 text-[#38bdf8]" />
              Kịch Bản Tự Động Hóa (Workflows)
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#6366f1]/20 border border-[#6366f1]/40 text-[#818cf8] text-[10px] font-mono font-bold">
              EVENT DRIVEN
            </span>
          </div>
          <p className="text-xs text-[#94a3b8]">
            Điều phối kịch bản gửi tin đa kênh theo luồng sự kiện, rẽ nhánh điều kiện và thời gian thực thi
          </p>
        </div>

        <button
          onClick={() => alert("Tính năng tạo quy trình kéo thả dạng tự do (Freeform Flow) sẽ mở rộng trong phiên bản tiếp theo.")}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] hover:from-[#4f46e5] hover:to-[#0284c7] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Kịch Bản Mới</span>
        </button>
      </div>

      {/* ================= WORKFLOW STATS CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
          <div className="text-[#94a3b8] text-xs font-semibold uppercase mb-1">Tổng Lượt Kích Hoạt (24h)</div>
          <div className="text-2xl font-mono font-bold text-white">2,030 <span className="text-xs text-emerald-400 font-normal">runs</span></div>
          <div className="text-[11px] text-[#94a3b8] font-mono mt-1">Tự động đẩy tác vụ vào BullMQ</div>
        </div>

        <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
          <div className="text-[#94a3b8] text-xs font-semibold uppercase mb-1">Tỷ Lệ Hoàn Tất Kịch Bản</div>
          <div className="text-2xl font-mono font-bold text-emerald-400">96.8%</div>
          <div className="text-[11px] text-[#94a3b8] font-mono mt-1">0% nghẽn luồng xử lý</div>
        </div>

        <div className="bg-[#0b1329]/70 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
          <div className="text-[#94a3b8] text-xs font-semibold uppercase mb-1">Kịch Bản Đang Hoạt Động</div>
          <div className="text-2xl font-mono font-bold text-[#38bdf8]">2 / 3</div>
          <div className="text-[11px] text-[#94a3b8] font-mono mt-1">Lắng nghe Webhook & DB Events</div>
        </div>
      </div>

      {/* ================= MAIN CONTENT: LIST & CANVAS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI (4 COLS): DANH SÁCH WORKFLOWS */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-[#94a3b8] px-1">
            Danh Sách Kịch Bản ({workflows.length})
          </div>

          <div className="space-y-2.5">
            {workflows.map((wf) => {
              const isSelected = selectedWf.id === wf.id;
              return (
                <div
                  key={wf.id}
                  onClick={() => setSelectedWf(wf)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer backdrop-blur-xl ${
                    isSelected
                      ? "bg-[#6366f1]/15 border-[#38bdf8]/40 shadow-[0_0_25px_rgba(56,189,248,0.15)]"
                      : "bg-[#0b1329]/70 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        wf.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${wf.status === "ACTIVE" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                      {wf.status}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStatus(wf.id);
                      }}
                      className="p-1 rounded-lg hover:bg-white/10 text-[#94a3b8] hover:text-white transition-colors"
                      title={wf.status === "ACTIVE" ? "Tạm dừng" : "Kích hoạt"}
                    >
                      {wf.status === "ACTIVE" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1">{wf.name}</h3>
                  <div className="text-[11px] text-[#38bdf8] font-mono mb-3">Trigger: {wf.trigger}</div>

                  <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[10px] font-mono text-[#94a3b8]">
                    <span>{wf.runsCount} lần chạy</span>
                    <span>Hoàn tất: {wf.completionRate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CỘT PHẢI (8 COLS): VISUAL WORKFLOW CANVAS */}
        <div className="lg:col-span-8 bg-[#0b1329]/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col justify-between">
          <div>
            {/* Canvas Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-5 border-b border-white/10 mb-8">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">{selectedWf.name}</h2>
                  <span className="text-xs font-mono text-[#38bdf8]">({selectedWf.stepsCount} Bước)</span>
                </div>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  Sơ đồ luồng kích hoạt và phân nhánh điều kiện thời gian thực
                </p>
              </div>

              <button
                onClick={runSimulation}
                disabled={simulating}
                className="px-3.5 py-1.5 rounded-xl bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/30 text-[#38bdf8] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(56,189,248,0.2)] disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 ${simulating ? "animate-spin text-amber-400" : ""}`} />
                <span>{simulating ? `Đang thực thi bước ${simulationStep}...` : "Chạy Thử Nghiệm"}</span>
              </button>
            </div>

            {/* Canvas Visual Workflow (Sơ đồ các Nodes) */}
            <div className="flex flex-col items-center space-y-4 max-w-lg mx-auto py-2">
              {/* NODE 1: TRIGGER */}
              <div
                className={`w-full p-4 rounded-2xl border transition-all duration-500 relative ${
                  simulationStep === 1
                    ? "bg-[#6366f1]/25 border-[#38bdf8] shadow-[0_0_30px_rgba(56,189,248,0.4)] scale-105"
                    : "bg-[#020617] border-[#6366f1]/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#6366f1]/20 border border-[#6366f1]/40 flex items-center justify-center text-[#818cf8]">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#818cf8] font-bold">1. Trigger (Sự Kiện Kích Hoạt)</span>
                    <div className="text-xs font-bold text-white mt-0.5">{selectedWf.trigger}</div>
                  </div>
                </div>
              </div>

              {/* Mũi tên kết nối 1 -> 2 */}
              <div className="flex flex-col items-center">
                <div className={`w-0.5 h-6 transition-all duration-500 ${simulationStep >= 2 ? "bg-[#38bdf8] shadow-[0_0_10px_#38bdf8]" : "bg-white/10"}`} />
                <ArrowDown className={`w-3.5 h-3.5 -mt-1 transition-colors ${simulationStep >= 2 ? "text-[#38bdf8]" : "text-[#64748b]"}`} />
              </div>

              {/* NODE 2: ACTION - GỬI EMAIL CHÀO MỪNG */}
              <div
                className={`w-full p-4 rounded-2xl border transition-all duration-500 ${
                  simulationStep === 2
                    ? "bg-[#6366f1]/25 border-[#38bdf8] shadow-[0_0_30px_rgba(56,189,248,0.4)] scale-105"
                    : "bg-[#020617] border-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#38bdf8] font-bold">2. Dispatch Action (Hành Động)</span>
                    <div className="text-xs font-bold text-white mt-0.5">Phát tán Mẫu: Chào Mừng Thành Viên Mới</div>
                    <div className="text-[10px] font-mono text-[#94a3b8] mt-0.5">SLA = 15s • BullMQ Queue P(t)</div>
                  </div>
                </div>
              </div>

              {/* Mũi tên kết nối 2 -> 3 */}
              <div className="flex flex-col items-center">
                <div className={`w-0.5 h-6 transition-all duration-500 ${simulationStep >= 3 ? "bg-[#38bdf8] shadow-[0_0_10px_#38bdf8]" : "bg-white/10"}`} />
                <ArrowDown className={`w-3.5 h-3.5 -mt-1 transition-colors ${simulationStep >= 3 ? "text-[#38bdf8]" : "text-[#64748b]"}`} />
              </div>

              {/* NODE 3: DELAY TIMER */}
              <div
                className={`w-full p-4 rounded-2xl border transition-all duration-500 ${
                  simulationStep === 3
                    ? "bg-[#6366f1]/25 border-[#38bdf8] shadow-[0_0_30px_rgba(56,189,248,0.4)] scale-105"
                    : "bg-[#020617] border-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold">3. Time Delay (Trì Hoãn)</span>
                    <div className="text-xs font-bold text-white mt-0.5">Đợi 24 Giờ (Chờ Tương Tác Của Khách)</div>
                  </div>
                </div>
              </div>

              {/* Mũi tên kết nối 3 -> 4 */}
              <div className="flex flex-col items-center">
                <div className={`w-0.5 h-6 transition-all duration-500 ${simulationStep >= 4 ? "bg-[#38bdf8] shadow-[0_0_10px_#38bdf8]" : "bg-white/10"}`} />
                <ArrowDown className={`w-3.5 h-3.5 -mt-1 transition-colors ${simulationStep >= 4 ? "text-[#38bdf8]" : "text-[#64748b]"}`} />
              </div>

              {/* NODE 4: CONDITION BRANCH (RẼ NHÁNH IF/ELSE) */}
              <div
                className={`w-full p-4 rounded-2xl border transition-all duration-500 ${
                  simulationStep === 4
                    ? "bg-[#6366f1]/25 border-[#38bdf8] shadow-[0_0_30px_rgba(56,189,248,0.4)] scale-105"
                    : "bg-[#020617] border-white/10"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                    <Split className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold">4. Condition (Kiểm Tra Điều Kiện)</span>
                    <div className="text-xs font-bold text-white mt-0.5">Người nhận đã mở thư bước 2?</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-white/10">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>NẾU CÓ: Gắn thẻ #VIP</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>NẾU CHƯA: Gửi thư nhắc lại</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Footer Note */}
          <div className="mt-8 p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-[#94a3b8] font-mono">
            <span>Trạng thái bộ lập lịch: <span className="text-emerald-400">IDLE & LISTENING</span></span>
            <span>BullMQ Consumer Concurrency: 14 luồng</span>
          </div>
        </div>
      </div>
    </div>
  );
}