import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Send, Users, Cpu, BarChart3, 
  MessageSquare, Sliders, Settings, Search, Bell, Plus 
} from 'lucide-react';

import OverviewTab from '../components/dashboard/OverviewTab';
import CampaignsTab from '../components/dashboard/CampaignsTab';
import ContactsTab from '../components/dashboard/ContactsTab';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Khởi tạo mock data telemetry đồng bộ toàn hệ thống
  const [telemetry] = useState({
    contactsCount: 14208,
    activeAutomations: 24,
    runningCampaigns: 12,
    aiScore: 94.8,
    recentActivities: [
      { id: 1, type: 'ai_mail', desc: 'AI tối ưu & sinh nội dung Email tiếp thị chuỗi xuân', time: '2 mins ago', color: 'border-[#00D98B] text-[#00D98B]' },
      { id: 2, type: 'camp_launch', desc: 'Chiến dịch Multi-channel "BST Hè Tự Động" được khởi chạy', time: '12 mins ago', color: 'border-[#3CE87A] text-[#3CE87A]' },
      { id: 3, type: 'wf_complete', desc: 'Workflow chăm sóc Khách hàng Doanh nghiệp hoàn thành', time: '45 mins ago', color: 'border-[#00CFA2] text-[#00CFA2]' },
      { id: 4, type: 'new_lead', desc: 'Hệ thống ghi nhận 14 khách hàng Enterprise mới từ Webhook', time: '1 hr ago', color: 'border-[#dffe64] text-[#dffe64]' },
      { id: 5, type: 'email_open', desc: 'Tỷ lệ mở thư chiến dịch Marketing Automation tăng đột biến', time: '2 hrs ago', color: 'border-[#3CE87A] text-[#3CE87A]' }
    ],
    chartData: [
      { name: 'Jan', sent: 2400, openRate: 72, clickRate: 38, conversion: 18, revenue: 4999 },
      { name: 'Feb', sent: 3200, openRate: 75, clickRate: 42, conversion: 22, revenue: 6200 },
      { name: 'Mar', sent: 2800, openRate: 70, clickRate: 40, conversion: 20, revenue: 5800 },
      { name: 'Apr', sent: 4600, openRate: 82, clickRate: 55, conversion: 28, revenue: 8900 },
      { name: 'May', sent: 5400, openRate: 88, clickRate: 64, conversion: 34, revenue: 12400 },
      { name: 'Jun', sent: 6800, openRate: 94, clickRate: 72, conversion: 41, revenue: 16800 }
    ]
  });

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Campaigns', icon: Send },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'automation', label: 'Automation', icon: Cpu },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'ai_assistant', label: 'AI Assistant', icon: MessageSquare },
    { id: 'integrations', label: 'Integrations', icon: Sliders },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#08110F] text-white flex p-4 font-sans gap-4 select-none overflow-hidden relative selection:bg-[#00D98B] selection:text-black">
      {/* 🌌 BACKGROUND GRADIENT & BLOB GLASS REFLECTION */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#08110F] via-[#0E1B17] to-[#10261E] z-0" />
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#00D98B]/[0.02] blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#00CFA2]/[0.02] blur-[120px] pointer-events-none z-0" />

      {/* 🟢 SIDEBAR BÊN TRÁI LAYOUT CỐ ĐỊNH */}
      <aside className="w-64 bg-white/[0.02] border border-white/[0.05] backdrop-blur-2xl rounded-[24px] p-5 flex flex-col justify-between shrink-0 relative z-10 shadow-2xl">
        <div className="space-y-7">
          <div className="flex items-center gap-3 px-2 select-none">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00D98B] to-[#00CFA2] flex items-center justify-center text-black font-black text-xs shadow-lg shadow-[#00D98B]/20">V</div>
            <span className="text-sm font-black tracking-widest uppercase">VERD<span className="text-[#00D98B] font-medium">IO</span></span>
          </div>

          <nav className="space-y-1">
            <span className="text-[9px] font-mono font-bold text-[#AAB7B3]/40 uppercase tracking-widest block px-3 mb-2">// CORE OPERATIONS</span>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isTabImplemented = ['overview', 'campaigns', 'contacts'].includes(item.id);
              return (
                <button
                  key={item.id}
                  disabled={!isTabImplemented}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                    activeTab === item.id
                      ? 'bg-white/[0.03] border-white/[0.06] text-[#00D98B] shadow-inner'
                      : isTabImplemented 
                        ? 'border-transparent text-[#AAB7B3] hover:text-white hover:bg-white/[0.01]'
                        : 'border-transparent text-[#AAB7B3]/30 cursor-not-allowed'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* AI ENGINE INDICATION CARD */}
        <div className="bg-gradient-to-b from-[#0E1B17] to-white/[0.01] border border-white/[0.04] p-4 rounded-2xl relative overflow-hidden">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D98B] absolute top-4 right-4 animate-pulse shadow-[0_0_8px_#00D98B]" />
          <h5 className="text-xs font-black text-white leading-none">VERDIO AI Core</h5>
          <p className="text-[10px] text-[#AAB7B3] mt-2 leading-relaxed font-mono">// Optimization status: Active [94.8%]</p>
        </div>
      </aside>

      {/* 🟢 KHÔNG GIAN THÂN PHẢI: TOP NAV + CONTENT GRID */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden h-[calc(100vh-32px)]">
        
        {/* TOP NAVIGATION HÀNG NGANG CHUẨN SAAS */}
        <header className="w-full bg-white/[0.01] border border-white/[0.04] backdrop-blur-xl rounded-[24px] px-5 py-3.5 flex items-center justify-between relative z-10 shadow-md">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-[#00D98B] transition-colors" />
            <input 
              type="text" 
              placeholder="Search across nodes, pipelines, logs..." 
              className="bg-white/[0.01] border border-white/[0.05] focus:border-[#00D98B]/30 rounded-full py-1.5 pl-9 pr-4 text-[11px] text-white placeholder-slate-600 outline-none w-56 focus:w-64 transition-all font-medium" 
            />
          </div>

          <div className="flex items-center gap-3.5">
            <button className="p-2 bg-white/[0.02] border border-white/[0.04] rounded-xl text-[#AAB7B3] hover:text-white transition-all relative">
              <Bell className="w-4 h-4" />
              <span className="w-1.5 h-1.5 bg-[#FF5C5C] rounded-full absolute top-1 right-1" />
            </button>
            
            <button className="bg-[#00D98B] text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#00D98B]/10 hover:opacity-95 transition-all active:scale-95 cursor-pointer">
              <Plus className="w-3.5 h-3.5 stroke-[3]" /> Create New
            </button>

            <div className="w-px h-5 bg-white/[0.08]" />

            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00CFA2] to-[#08110F] border border-white/[0.1] flex items-center justify-center text-white text-xs font-mono font-bold">
                KL
              </div>
            </div>
          </div>
        </header>

        {/* PHÂN KHU THAY ĐỔI CƠ CHẾ CÁC TRANG TAB */}
        <main className="flex-1 overflow-y-auto pr-1 scrollbar-none h-full relative z-10">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && <OverviewTab key="overview" telemetry={telemetry} />}
            {activeTab === 'campaigns' && <CampaignsTab key="campaigns" />}
            {activeTab === 'contacts' && <ContactsTab key="contacts" />}
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
};

export default Dashboard;