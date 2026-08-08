import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserCheck, UserPlus, Award, Target, UserMinus, 
  Search, SlidersHorizontal, Download, Upload, MoreVertical, 
  ChevronLeft, ChevronRight, X, Mail, Play, CheckCircle2, 
  Sparkles, ShieldCheck, BarChart3, PieChart, Landmark
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart as RePieChart, Pie
} from 'recharts';

const ContactsTab = ({ telemetry }) => {
  // --- STATE QUẢN LÝ TÁC VỤ ---
  const [selectedContact, setSelectedContact] = useState(null); // Quản lý Drawer Quick View Panel
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);

  // --- MOCK DỮ LIỆU ĐỒ THỊ ANALYTICS BIỂU ĐỒ (PHẦN 2) ---
  const growthData = [
    { name: 'Mon', count: 12400 }, { name: 'Tue', count: 12900 }, { name: 'Wed', count: 13200 },
    { name: 'Thu', count: 13600 }, { name: 'Fri', count: 13900 }, { name: 'Sat', count: 14208 }
  ];

  const industryData = [
    { name: 'E-commerce', value: 4500 }, { name: 'SaaS Tech', value: 3800 },
    { name: 'Finance', value: 2900 }, { name: 'Education', value: 1800 },
    { name: 'Logistics', value: 1208 }
  ];

  const segmentPieData = [
    { name: 'VIP', value: 2500, color: '#dffe64' },
    { name: 'Enterprise', value: 4300, color: '#00CFA2' },
    { name: 'Leads', value: 4800, color: '#00D98B' },
    { name: 'Customers', value: 2108, color: '#3CE87A' },
    { name: 'Inactive', value: 500, color: '#FF5C5C' }
  ];

  // --- DATA MANAGEMENT TABLE (PHẦN 3) ---
  const mockContacts = [
    { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', company: 'Google Vietnam', title: 'Marketing Manager', country: 'Vietnam', segment: 'VIP', score: 98, eng: '94%', ltv: '$4,500', last: '2 mins ago', camp: 'Summer Sale', status: 'Active' },
    { id: 2, name: 'Nguyễn Lập Thủy Khương', email: 'khuongmingo@gmail.com', company: 'Can Tho Tech', title: 'Software Engineer', country: 'Vietnam', segment: 'VIP', score: 99, eng: '97%', ltv: '$6,200', last: 'Just now', camp: 'AI Integration', status: 'Active' },
    { id: 3, name: 'Merry Crypto', email: 'merry_c@littlebee.io', company: 'LittleBee Group', title: 'Trading Manager', country: 'Singapore', segment: 'Enterprise', score: 92, prob: '88%', ltv: '$2,999', last: '12 mins ago', camp: 'Q3 Omni Retarget', status: 'Active' },
    { id: 4, name: 'Alex Rivera', email: 'alex.r@linear.app', company: 'Linear SaaS', title: 'Product Architect', country: 'USA', segment: 'Customers', score: 85, eng: '72%', ltv: '$1,850', last: '1 hr ago', camp: 'Core Stream', status: 'Active' },
    { id: 5, name: 'Sarah Jenkins', email: 'sarah.j@vercel.com', company: 'Vercel Inc', title: 'DevOps Lead', country: 'USA', segment: 'Enterprise', score: 96, eng: '91%', ltv: '$5,400', last: '45 mins ago', camp: 'Next-Gen Launch', status: 'Active' },
    { id: 6, name: 'Nguyễn Kiệt', email: 'kiet.nguyen@verdio.io', company: 'Verdio System', title: 'Data Analyst', country: 'Vietnam', segment: 'Leads', score: 78, eng: '54%', ltv: '$920', last: '2 hrs ago', camp: 'Trial Pipeline', status: 'Inactive' }
  ];

  // Các thẻ thống kê nhanh KPI (Phần 1)
  const kpiCards = [
    { label: 'Total Contacts', value: '18,452', growth: '+14.2%', icon: Users, color: 'text-[#00D98B]' },
    { label: 'Active Subscribers', value: '14,208', growth: '+18.5%', icon: UserCheck, color: 'text-[#3CE87A]' },
    { label: 'New Contacts Today', value: '+245', growth: 'Optimal', icon: UserPlus, color: 'text-[#dffe64]' },
    { label: 'Leads Node Pool', value: '4,800', growth: '+6.2%', icon: Target, color: 'text-[#FFC857]' },
    { label: 'VIP Customers', value: '2,500', growth: '+22.4%', icon: Award, color: 'text-[#00CFA2]' },
    { label: 'Unsubscribed Rate', value: '0.8%', growth: '-1.4%', icon: UserMinus, color: 'text-[#FF5C5C]' }
  ];

  return (
    <div className="w-full space-y-6 font-sans select-none text-slate-300 relative">
      
      {/* ========================== PHẦN 1 – THỐNG KÊ TỔNG QUAN ========================== */}
      <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-[#141d16]/30 border border-white/[0.04] backdrop-blur-xl p-4 rounded-2xl flex flex-col justify-between shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.08]">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                <Icon className={`w-3.5 h-3.5 ${kpi.color}`} />
              </div>
              <div className="flex justify-between items-end mt-4">
                <span className="text-lg font-black text-white font-mono leading-none">{kpi.value}</span>
                <span className="text-[8px] font-mono font-bold text-[#3CE87A] bg-[#3CE87A]/5 px-1.5 py-0.5 rounded border border-[#3CE87A]/10">
                  {kpi.growth}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================== PHẦN 2 – AUDIENCE ANALYTICS & AI INSIGHTS ========================== */}
      <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* KHỐI BIỂU ĐỒ CON (8 COLS): CONTACT GROWTH & SEGMENTS SECTOR */}
        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0a110d]/80 border border-white/[0.04] p-5 rounded-[24px] backdrop-blur-2xl shadow-xl">
          
          {/* Biểu đồ 1: Sóng tăng trưởng Contact Growth */}
          <div className="space-y-3 flex flex-col justify-between h-44">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><BarChart3 className="w-3 h-3 text-[#00D98B]" /> Contact Growth</span>
            <div className="h-32 w-full font-mono text-[8px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData} margin={{ top: 5, right: 5, left: -35, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#1f2d25" fontSize={8} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a110d', fontSize: '9px', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="count" stroke="#00D98B" strokeWidth={1.5} fill="rgba(0,217,139,0.03)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Biểu đồ 2: Trọng số ngành Top Industries */}
          <div className="space-y-3 flex flex-col justify-between h-44">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Landmark className="w-3 h-3 text-[#00CFA2]" /> Top Industries</span>
            <div className="h-32 w-full font-mono text-[8px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={industryData} margin={{ top: 5, right: 5, left: -35, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#1f2d25" fontSize={8} tickLine={false} axisLine={false} />
                  <Bar dataKey="value" fill="#00CFA2" radius={[4, 4, 0, 0]} maxBarSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Biểu đồ 3: Doughnut Phân Khúc Audience Segments */}
          <div className="space-y-3 flex flex-col justify-between h-44 items-center md:items-start">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><PieChart className="w-3 h-3 text-[#dffe64]" /> Segments Spec</span>
            <div className="h-32 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={segmentPieData} cx="50%" cy="50%" innerRadius={22} outerRadius={36} paddingAngle={3} dataKey="value">
                    {segmentPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center text-center select-none pointer-events-none">
                <span className="text-[10px] font-black font-mono text-white leading-none">100%</span>
              </div>
            </div>
          </div>

        </div>

        {/* KHỐI AI AUDIENCE INSIGHTS PHẢI (4 COLS - PHẦN AI INSIGHTS) */}
        <div className="xl:col-span-4 bg-gradient-to-br from-[#0e1b17] to-white/[0.01] border border-white/[0.05] p-5 rounded-[24px] backdrop-blur-2xl shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-[-15px] top-[-15px] w-24 h-24 bg-[#00D98B]/[0.02] rounded-full blur-xl group-hover:bg-[#00D98B]/[0.05] transition-all" />
          
          <div className="space-y-3 flex-1">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-mono font-black text-[#00D98B] uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> AI Audience Insights
              </span>
            </div>

            <ul className="space-y-2.5 font-mono text-[10px] text-slate-400">
              <li className="flex items-start gap-1.5"><span className="text-[#3CE87A] font-bold">✓</span> 245 khách hàng có khả năng chuyển đổi cao trong ngày.</li>
              <li className="flex items-start gap-1.5"><span className="text-[#00D98B] font-bold">✦</span> AI đề xuất phát động Email Campaign độc quyền nhóm VIP.</li>
              <li className="flex items-start gap-1.5"><span className="text-[#FF5C5C] font-bold">!</span> 58 Enterprise contacts đóng băng tương tác 30 ngày.</li>
            </ul>
          </div>

          <button className="w-full bg-[#dffe64] text-[#08110F] text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl mt-4 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/5 cursor-pointer">
            Generate Automation Pipeline
          </button>
        </div>

      </div>

      {/* ========================== PHẦN 3 – CONTACT MANAGEMENT (DATA TABLE) ========================== */}
      <div className="bg-[#0a110d]/60 border border-white/[0.04] rounded-[24px] backdrop-blur-2xl shadow-2xl p-5 w-full relative z-10">
        
        {/* THANH ĐIỀU HƯỚNG TÁC VỤ CHO DATA TABLE TRÊN CÙNG */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.04] select-none">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input type="text" placeholder="Advanced search registry..." className="bg-white/[0.01] border border-white/[0.04] rounded-full py-1.5 pl-9 pr-4 text-[10px] font-medium text-white outline-none w-44 focus:w-52 transition-all focus:border-[#00D98B]/20" />
            </div>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.03] text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all"><SlidersHorizontal className="w-3 h-3" /> Advanced Filter</button>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-center">
            <button className="flex items-center gap-1 bg-white/[0.01] border border-white/[0.03] hover:border-white/[0.08] text-slate-400 hover:text-white text-[10px] font-bold uppercase px-3 py-2 rounded-xl transition-all cursor-pointer"><Download className="w-3 h-3" /> Export</button>
            <button className="flex items-center gap-1 bg-white/[0.01] border border-white/[0.03] hover:border-white/[0.08] text-slate-400 hover:text-white text-[10px] font-bold uppercase px-3 py-2 rounded-xl transition-all cursor-pointer"><Upload className="w-3 h-3" /> Import</button>
            <button className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-1 shadow-md hover:bg-slate-200 transition-all cursor-pointer"><UserPlus className="w-3.5 h-3.5 stroke-[2.5]" /> Add Contact</button>
          </div>
        </div>

        {/* KHU VỰC BẢNG DỮ LIỆU ĐA TẦNG CHUYÊN NGHIỆP */}
        <div className="overflow-x-auto scrollbar-none pt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.03] text-slate-500 font-mono text-[9px] uppercase tracking-widest">
                <th className="py-3 px-2 w-6"><input type="checkbox" className="rounded bg-black border-white/10" /></th>
                <th className="py-3 font-bold tracking-wider">// Identity Full Name</th>
                <th className="py-3 tracking-wider">// Company Hub</th>
                <th className="py-3 tracking-wider">// Country</th>
                <th className="py-3 tracking-wider">// Segment</th>
                <th className="py-3 tracking-wider">// AI Score</th>
                <th className="py-3 tracking-wider">// LTV</th>
                <th className="py-3 tracking-wider">// Last Activity</th>
                <th className="py-3 text-right pr-2">// Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02] font-mono text-[11px] text-slate-300">
              {mockContacts.map((contact) => (
                <tr 
                  key={contact.id} 
                  className="hover:bg-white/[0.01] transition-colors group cursor-pointer"
                  onClick={() => setSelectedContact(contact)} // Bấm kích hoạt Drawer Quick View Panel Phía phải
                >
                  <td className="py-3.5 px-2" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="rounded bg-black border-white/10" /></td>
                  <td className="py-3.5 font-bold text-white group-hover:text-[#00D98B] transition-colors">
                    <div>
                      <div>{contact.name}</div>
                      <span className="text-[9px] text-slate-500 font-normal normal-case block mt-0.5">{contact.email}</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-400">
                    <div>{contact.company}</div>
                    <span className="text-[9px] text-slate-600 block mt-0.5">{contact.title}</span>
                  </td>
                  <td className="py-3.5 text-slate-500">{contact.country}</td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${contact.segment === 'VIP' ? 'bg-[#dffe64]/5 text-[#dffe64] border-[#dffe64]/10' : 'bg-white/[0.02] text-slate-400 border-white/[0.04]'}`}>
                      {contact.segment}
                    </span>
                  </td>
                  <td className="py-3.5 font-bold text-emerald-400">{contact.score}</td>
                  <td className="py-3.5 text-slate-400 font-bold">{contact.ltv}</td>
                  <td className="py-3.5 text-slate-500">
                    <div>{contact.last}</div>
                    <span className="text-[9px] text-[#00CFA2]/70 block mt-0.5">{contact.camp}</span>
                  </td>
                  <td className="py-3.5 text-right pr-2" onClick={(e) => e.stopPropagation()}>
                    <button className="p-1 hover:bg-white/[0.03] rounded-lg text-slate-500 hover:text-white transition-colors"><MoreVertical className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ========================== PAGINATION (PHẦN BẢNG PHÂN TRANG) ========================== */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-2 border-t border-white/[0.03] text-[10px] font-mono text-slate-500 select-none">
          <div className="flex items-center gap-2">
            <span>Show rows:</span>
            <select 
              value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-[#0a110d] border border-white/[0.04] rounded px-2 py-1 text-slate-300 outline-none cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="ml-2">Showing 1–{mockContacts.length} of 18,452 Contacts</span>
          </div>

          <div className="flex items-center gap-1">
            <button className="p-1.5 bg-white/[0.01] border border-white/[0.03] rounded-lg hover:text-white transition-all cursor-pointer"><ChevronLeft className="w-3.5 h-3.5" /></button>
            <button className="px-2.5 py-1 bg-white/[0.03] border border-white/[0.06] text-[#00D98B] rounded-lg font-bold">1</button>
            <button className="px-2.5 py-1 hover:bg-white/[0.01] text-slate-400 rounded-lg">2</button>
            <button className="px-2.5 py-1 hover:bg-white/[0.01] text-slate-400 rounded-lg">3</button>
            <span className="px-1.5">...</span>
            <button className="px-2.5 py-1 hover:bg-white/[0.01] text-slate-400 rounded-lg">738</button>
            <button className="p-1.5 bg-white/[0.01] border border-white/[0.03] rounded-lg hover:text-white transition-all cursor-pointer"><ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>

      </div>

      {/* ========================== QUICK VIEW PANEL (DRAWER ĐẨY TỪ BÊN PHẢI) ========================== */}
      <AnimatePresence>
        {selectedContact && (
          <>
            {/* Lớp nền mờ chắn click ngoài */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedContact(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
            
            {/* Thân bảng điều khiển chi tiết Drawer */}
            <motion.aside 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="fixed top-4 right-4 bottom-4 w-96 bg-[#08110F]/95 border border-white/[0.06] backdrop-blur-3xl rounded-[24px] shadow-[0_0_50px_rgba(0,0,0,0.6)] z-50 p-5 flex flex-col justify-between overflow-hidden select-none font-mono"
            >
              <div className="space-y-5 overflow-y-auto pr-1 scrollbar-none flex-1">
                <div className="flex justify-between items-center border-b border-white/[0.03] pb-3">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">// QUICK IDENTITY OVERVIEW</span>
                  <button onClick={() => setSelectedContact(null)} className="p-1 bg-white/[0.01] border border-white/[0.04] rounded-lg hover:text-white transition-colors cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </div>

                {/* Cụm hồ sơ tài khoản lớn */}
                <div className="flex items-center gap-4 bg-white/[0.01] border border-white/[0.03] p-4 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00D98B] to-transparent border border-white/[0.1] text-black font-sans font-black text-sm flex items-center justify-center shadow-md">{selectedContact.name.substring(0,2).toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-sans font-black text-white truncate">{selectedContact.name}</h4>
                    <span className="text-[10px] text-slate-500 block truncate mt-0.5">{selectedContact.email}</span>
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-[#dffe64]/5 border border-[#dffe64]/10 text-[#dffe64] tracking-wide inline-block mt-2">{selectedContact.segment}</span>
                  </div>
                </div>

                {/* Khối thông tin chi tiết Analytics Ma Trận */}
                <div className="bg-[#141d16]/20 border border-white/[0.03] p-4 rounded-2xl space-y-3 text-[11px]">
                  <div className="flex justify-between border-b border-white/[0.02] pb-1.5"><span className="text-slate-500">Company Hub:</span><span className="text-white font-bold">{selectedContact.company}</span></div>
                  <div className="flex justify-between border-b border-white/[0.02] pb-1.5"><span className="text-slate-500">Lead Score Core:</span><span className="text-[#00D98B] font-black">{selectedContact.score}</span></div>
                  <div className="flex justify-between border-b border-white/[0.02] pb-1.5"><span className="text-slate-500">AI Engagement:</span><span className="text-teal-400 font-bold">{selectedContact.eng || '94%'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">LTV Value Asset:</span><span className="text-[#3CE87A] font-bold">{selectedContact.ltv}</span></div>
                </div>

                {/* Timeline nhật ký kịch bản hoạt động (Timeline) */}
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block px-1">// Core Node Timeline</span>
                  <div className="border-l border-white/[0.05] ml-2 pl-3 space-y-3 text-[10px]">
                    <div className="relative"><span className="w-1.5 h-1.5 rounded-full bg-[#00D98B] absolute left-[-16px] top-1" /> <span className="text-white font-bold">Opened Email Campaign</span> — {selectedContact.camp} ({selectedContact.last})</div>
                    <div className="relative"><span className="w-1.5 h-1.5 rounded-full bg-slate-600 absolute left-[-16px] top-1" /> Added to Workflow Pipeline ngầm (2 days ago)</div>
                  </div>
                </div>
              </div>

              {/* Cụm Quick Actions chân Drawer */}
              <div className="pt-4 border-t border-white/[0.03] flex gap-2 select-none">
                <button className="flex-1 bg-[#00D98B] text-black text-[10px] font-black uppercase py-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer"><Mail className="w-3.5 h-3.5" /> Dispatch Mail</button>
                <button className="flex-1 bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] text-white text-[10px] font-bold uppercase py-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer"><Play className="w-3.5 h-3.5" /> Trigger Flow</button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ContactsTab;