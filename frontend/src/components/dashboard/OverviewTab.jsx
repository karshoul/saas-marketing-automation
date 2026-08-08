import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Play, Pause, ArrowUpRight, ArrowDownRight, Zap, 
  Mail, Send, MousePointer, ShieldCheck, Cpu, Database, 
  Users
} from 'lucide-react';

// 🌐 MATRIX FLOW NETWORK CANVAS 60 FPS
const MarketingFlowNetwork = () => {
  const containerRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0, targetX: 0, targetY: 0 });

  const nodes = [
    { id: 'cust', label: 'Customer', x: 10, y: 15, type: 'source' },
    { id: 'lead', label: 'Lead', x: 25, y: 45, type: 'source' },
    { id: 'ai', label: 'AI Core', x: 50, y: 50, type: 'processor' },
    { id: 'auto', label: 'Automation', x: 45, y: 20, type: 'processor' },
    { id: 'mail', label: 'Email', x: 70, y: 25, type: 'channel' },
    { id: 'sms', label: 'SMS', x: 72, y: 48, type: 'channel' },
    { id: 'crm', label: 'CRM Sync', x: 35, y: 80, type: 'system' },
    { id: 'purch', label: 'Purchase', x: 88, y: 40, type: 'conversion' },
    { id: 'succ', label: 'Success', x: 92, y: 75, type: 'conversion' },
  ];

  // Khởi tạo các đường kết nối Bezier giữa các cặp nút node
  const connections = [
    { from: 'cust', to: 'ai' }, { from: 'lead', to: 'ai' },
    { from: 'ai', to: 'auto' }, { from: 'auto', to: 'mail' },
    { from: 'ai', to: 'sms' }, { from: 'auto', to: 'crm' },
    { from: 'mail', to: 'purch' }, { from: 'sms', to: 'purch' },
    { from: 'purch', to: 'succ' }
  ];

  useEffect(() => {
    let animId;
    const updateParallax = () => {
      setMouse(prev => {
        const dx = prev.targetX - prev.x;
        const dy = prev.targetY - prev.y;
        return {
          ...prev,
          x: prev.x + dx * 0.08,
          y: prev.y + dy * 0.08
        };
      });
      animId = requestAnimationFrame(updateParallax);
    };
    updateParallax();
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMouse(prev => ({
      ...prev,
      targetX: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
      targetY: ((e.clientY - rect.top) / rect.height - 0.5) * 20
    }));
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMouse({ x: 0, y: 0, targetX: 0, targetY: 0 })}
      className="w-full bg-white/[0.01] border border-white/[0.04] p-5 rounded-[24px] h-[340px] relative overflow-hidden backdrop-blur-xl shadow-inner select-none"
    >
      <div className="flex justify-between items-center absolute top-4 left-5 right-5 z-10">
        <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest block">// MARKETING FLOW NETWORK</span>
        <span className="w-2 h-2 rounded-full bg-[#00D98B] animate-ping" />
      </div>

      {/* RENDER KHỐI SVG VẼ CÁC ĐƯỜNG CONG VÀ LUỒNG SÁNG DỮ LIỆU */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <defs>
          <linearGradient id="beamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D98B" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#00CFA2" stopOpacity={0}/>
          </linearGradient>
        </defs>
        {connections.map((conn, i) => {
          const fromNode = nodes.find(n => n.id === conn.from);
          const toNode = nodes.find(n => n.id === conn.to);
          if (!fromNode || !toNode) return null;
          
          const x1 = `${fromNode.x}%`; const y1 = `${fromNode.y}%`;
          const x2 = `${toNode.x}%`; const y2 = `${toNode.y}%`;

          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0, 217, 139, 0.08)" strokeWidth="1.5" />
              {/* Luồng xung ánh sáng dữ liệu chạy tuần hoàn qua lại */}
              <motion.circle 
                r="3" fill="url(#beamGrad)"
                initial={{ offsetDistance: "0%" }}
                animate={{ cx: [x1, x2], cy: [y1, y2] }}
                transition={{ duration: 3 + (i % 3), repeat: Infinity, ease: "linear" }}
                className="shadow-[0_0_8px_#00D98B]"
              />
            </g>
          );
        })}
      </svg>

      {/* RENDER MẠNG LƯỚI NODE DỰA TRÊN HIỆU ỨNG SPRING PARALLAX VẬT LÝ */}
      <div className="absolute inset-0 w-full h-full z-10 flex items-center justify-center">
        {nodes.map((node, i) => (
          <motion.div
            key={node.id}
            style={{ left: `${node.x}%`, top: `${node.y}%`, x: mouse.x * 0.4, y: mouse.y * 0.4 }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4 + (i % 2), repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.08, filter: "drop-shadow(0px 0px 8px rgba(0,217,139,0.3))" }}
            className="absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0E1B17]/90 border border-white/[0.08] rounded-xl font-mono text-[9px] font-bold text-slate-300 flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-lg"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D98B]" />
            {node.label}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const OverviewTab = ({ telemetry }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [timeRange, setTimeRange] = useState('30D');

  const stats = [
    { label: 'Running Campaigns', value: '12', change: '+3', isUp: true },
    { label: 'Emails Sent Today', value: '48,290', change: '+14.2%', isUp: true },
    { label: 'Open Rate', value: '28.4%', change: '+2.1%', isUp: true },
    { label: 'Click Rate', value: '14.8%', change: '-0.4%', isUp: false },
    { label: 'Conversion Rate', value: '4.2%', change: '+1.1%', isUp: true },
    { label: 'Active Automations', value: '24', change: 'Stable', isUp: true }
  ];

  const bottomCards = [
    { label: 'Total Campaigns', value: '184', growth: '+12%', icon: Send },
    { label: 'Total Audience', value: '14,208', growth: '+24%', icon: Users },
    { label: 'Active Automations', value: '24', growth: '+8%', icon: Cpu },
    { label: 'Monthly Revenue', value: '$48,920', growth: '+32%', icon: Database }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
      className="space-y-4 w-full h-full pb-4"
    >
      {/* KHU VỰC 1: CAMPAIGN BANNER CARD & TIẾN TRÌNH LƯỚI HẠT NGẦM */}
      <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* CARD TRÁI: GIỚI THIỆU CHIẾN DỊCH HOẠT ĐỘNG CHUẨN ĐẲNG CẤP APPLE */}
        <div className="xl:col-span-4 bg-gradient-to-b from-[#0E1B17] to-white/[0.01] border border-white/[0.05] p-5 rounded-[24px] backdrop-blur-2xl flex flex-col justify-between shadow-xl relative overflow-hidden group h-[340px]">
          <div className="absolute right-[-20px] top-[-20px] w-36 h-36 bg-[#00D98B]/[0.03] rounded-full blur-2xl group-hover:bg-[#00D98B]/[0.06] transition-all" />
          <div>
            <div className="flex justify-between items-start">
              <div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase ${isPaused ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-[#00D98B]/10 text-[#00D98B] border border-[#00D98B]/20'}`}>
                  {isPaused ? 'Paused' : 'Running'}
                </span>
                <h3 className="text-base font-black text-white uppercase tracking-tight mt-2.5">Q3 Omni Automation</h3>
              </div>
              <span className="text-xs font-mono font-black text-[#dffe64] bg-[#dffe64]/5 px-2 py-1 rounded-lg border border-[#dffe64]/10">Score: 96</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-[10px] text-slate-400">
              <div>Start: <span className="text-white font-bold">2026-06-01</span></div>
              <div>End: <span className="text-white font-bold">2026-09-30</span></div>
              <div className="col-span-2 mt-1">Expected ROI: <span className="text-[#3CE87A] font-bold">+340%</span></div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/[0.03]">
            <div className="w-full h-1.5 bg-white/[0.03] border border-white/[0.05] rounded-full overflow-hidden">
              <div className="w-[68%] h-full bg-gradient-to-r from-[#00D98B] to-[#00CFA2] rounded-full" />
            </div>
            <div className="flex gap-3">
              <button className="flex-1 bg-white text-black text-[10px] font-black uppercase tracking-wider py-2.5 rounded-xl hover:bg-slate-200 transition-all cursor-pointer">View Details</button>
              <button 
                onClick={() => setIsPaused(!isPaused)}
                className="px-3 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:bg-white/[0.05] text-slate-300 transition-colors cursor-pointer"
              >
                {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
              </button>
            </div>
          </div>
        </div>

        {/* CHÍNH GIỮA: RENDER MA TRẬN MARKETING FLOW NETWORK */}
        <div className="xl:col-span-8">
          <MarketingFlowNetwork />
        </div>

      </div>

      {/* KHU VỰC 2: HOẠT ĐỘNG GẦN ĐÂY & THỐNG KÊ NHANH CARD LỚN CỦA SAAS */}
      <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* BÊN TRÁI (4 COLS): NHẬT KÝ HOẠT ĐỘNG GẦN ĐÂY CỦA AI TRONG HỆ THỐNG */}
        <div className="xl:col-span-4 bg-[#0a110d] border border-white/[0.04] p-5 rounded-[24px] shadow-xl flex flex-col justify-between h-[360px]">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-3">// LIVE AUTOMATION LOGS</span>
          <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 scrollbar-none">
            {telemetry.recentActivities.map((act) => (
              <div key={act.id} className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl flex items-start gap-2.5 hover:border-white/[0.06] transition-colors">
                <div className={`w-6 h-6 rounded-full border text-[9px] font-mono font-bold flex items-center justify-center shrink-0 ${act.color}`}>
                  AI
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-slate-300 leading-tight truncate">{act.desc}</p>
                  <span className="text-[9px] font-mono text-slate-600 mt-1 block leading-none">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHÍNH GIỮA + PHẢI (8 COLS): LƯỚI BẢNG THỐNG KÊ NHANH STATS GRID */}
        <div className="xl:col-span-8 bg-[#0a110d] border border-white/[0.04] p-5 rounded-[24px] shadow-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-4">// TELEMETRY QUICK METRICS</span>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl flex flex-col justify-between hover:border-white/[0.06] transition-colors shadow-sm">
                <span className="text-[10px] text-slate-500 font-bold leading-none">{stat.label}</span>
                <div className="flex justify-between items-end mt-3">
                  <span className="text-xl font-black text-white font-mono leading-none">{stat.value}</span>
                  <span className={`text-[9px] font-mono font-bold ${stat.isUp ? 'text-[#3CE87A]' : 'text-[#FF5C5C]'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* KHU VỰC 3: AREA CHART LỚN - CAMPAIGN PERFORMANCE */}
      <div className="bg-[#0a110d] border border-white/[0.04] p-5 rounded-[24px] shadow-xl w-full">
        <div className="flex justify-between items-center select-none mb-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[#00D98B]" /> Campaign Performance Analytics
          </h3>
          <div className="flex gap-1.5 bg-black/40 p-1 rounded-full border border-white/[0.03] font-mono text-[9px] font-bold">
            {['7D', '30D', '90D', '1Y'].map((range) => (
              <button 
                key={range} onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-full uppercase tracking-wider transition-all cursor-pointer ${timeRange === range ? 'bg-white/[0.05] text-[#00D98B] border border-white/[0.06]' : 'text-slate-500 hover:text-white'}`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="h-44 w-full font-mono text-[9px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={telemetry.chartData} margin={{ top: 5, right: 5, left: -32, bottom: 0 }}>
              <defs>
                <linearGradient id="verdioSentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D98B" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#00D98B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#243329" fontSize={8} tickLine={false} axisLine={false} />
              <YAxis stroke="#243329" fontSize={8} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0a110d', borderColor: 'rgba(255,255,255,0.04)', borderRadius: '12px', fontSize: '10px' }} />
              <Area type="monotone" dataKey="sent" name="Volume" stroke="#00D98B" strokeWidth={2} fillOpacity={1} fill="url(#verdioSentGrad)" dot={{ fill: '#00CFA2', stroke: '#0a110d', strokeWidth: 1, r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KHU VỰC 4: 4 STATISTIC CARDS CHÂN TRANG */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full select-none">
        {bottomCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -4, borderColor: "rgba(0, 217, 139, 0.2)" }}
              className="bg-white/[0.01] border border-white/[0.04] p-4 rounded-2xl flex flex-col justify-between hover:bg-white/[0.02] transition-all duration-300 shadow-md"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{card.label}</span>
                <Icon className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex justify-between items-end mt-4">
                <span className="text-xl font-black text-white font-mono leading-none">{card.value}</span>
                <span className="text-[9px] font-mono font-black text-[#3CE87A] bg-[#3CE87A]/5 border border-[#3CE87A]/10 px-1.5 py-0.5 rounded">
                  {card.growth}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

    </motion.div>
  );
};

export default OverviewTab;