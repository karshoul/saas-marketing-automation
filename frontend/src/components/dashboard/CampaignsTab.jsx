import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, SlidersHorizontal, ArrowUpDown, Sparkles, 
  Layers, Calendar, Plus, Mail, MessageSquare, Phone 
} from 'lucide-react';

const CampaignsTab = () => {
  const [viewMode, setViewMode] = useState('kanban');

  // Khởi tạo các danh mục cột Kanban
  const columns = [
    { id: 'draft', title: 'Draft', count: 2 },
    { id: 'scheduled', title: 'Scheduled', count: 1 },
    { id: 'running', title: 'Running', count: 3 },
    { id: 'completed', title: 'Completed', count: 4 },
    { id: 'paused', title: 'Paused', count: 1 }
  ];

  // Mock data danh sách chiến dịch phân bổ theo cột Kanban
  const [campaignCards] = useState([
    { id: 1, column: 'running', name: 'Q3 Omni Automation', type: 'AI Campaign', priority: 'High', start: '06-01', openRate: '88%', clickRate: '64%', score: 96 },
    { id: 2, column: 'running', name: 'Zalo & SMS Retargeting', type: 'SMS Marketing', priority: 'Medium', start: '06-15', openRate: '92%', clickRate: '41%', score: 89 },
    { id: 3, column: 'draft', name: 'Welcome Stream Core', type: 'Email Marketing', priority: 'Low', start: 'Pending', openRate: '0%', clickRate: '0%', score: 94 },
    { id: 4, column: 'completed', name: 'Black Friday Phase 1', type: 'Multi-channel', priority: 'High', start: '05-01', openRate: '84%', clickRate: '52%', score: 91 },
    { id: 5, column: 'scheduled', name: 'Newsletter Automated', type: 'Email Marketing', priority: 'Medium', start: '07-01', openRate: '0%', clickRate: '0%', score: 92 }
  ]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
      className="space-y-4 w-full h-full pb-4 flex flex-col"
    >
      {/* THANH ĐIỀU KHIỂN CHỨC NĂNG PHÍA TRÊN KANBAN BOARD */}
      <div className="w-full bg-[#0a110d] border border-white/[0.04] rounded-[20px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 shadow-md select-none">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
            <input type="text" placeholder="Filter campaigns..." className="bg-white/[0.01] border border-white/[0.05] rounded-full py-1.5 pl-8 pr-4 text-[10px] text-white outline-none w-40" />
          </div>
          <button className="flex items-center gap-1 px-3 py-1.5 bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.03] text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all"><SlidersHorizontal className="w-3 h-3" /> Filter</button>
          <button className="flex items-center gap-1 px-3 py-1.5 bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.03] text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all"><ArrowUpDown className="w-3 h-3" /> Sort</button>
          <button className="flex items-center gap-1 px-3 py-1.5 bg-[#00D98B]/5 border border-[#00D98B]/10 text-[#00D98B] text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl"><Sparkles className="w-3 h-3 animate-pulse" /> AI Recommendation</button>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <div className="flex bg-black/30 p-0.5 rounded-lg border border-white/[0.03] text-[9px] font-bold font-mono">
            <button onClick={() => setViewMode('kanban')} className={`px-2 py-1 rounded-md uppercase tracking-wider ${viewMode === 'kanban' ? 'bg-white/[0.03] text-[#00D98B] border border-white/[0.04]' : 'text-slate-500'}`}>Kanban</button>
            <button onClick={() => setViewMode('list')} className={`px-2 py-1 rounded-md uppercase tracking-wider ${viewMode === 'list' ? 'bg-white/[0.03] text-[#00D98B] border border-white/[0.04]' : 'text-slate-500'}`}>List</button>
          </div>
          <button className="p-2 bg-white/[0.01] border border-white/[0.04] text-slate-400 hover:text-white rounded-xl transition-all"><Calendar className="w-3.5 h-3.5" /></button>
          <button className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-1 shadow-md hover:bg-slate-200 transition-all"><Plus className="w-3 h-3 stroke-[2.5]" /> New Campaign</button>
        </div>
      </div>

      {/* RENDER DẠNG LƯỚI KANBAN BOARD HÀNG CỘT */}
      <div className="w-full flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-2 scrollbar-none h-[calc(100vh-230px)]">
        {columns.map((col) => (
          <div key={col.id} className="bg-white/[0.01] border border-white/[0.03] rounded-[20px] p-3 flex flex-col gap-3 min-w-[200px] h-full overflow-y-auto scrollbar-none">
            <div className="flex justify-between items-center px-1.5 select-none shrink-0">
              <span className="text-[10px] font-mono font-black text-white uppercase tracking-wider">// {col.title}</span>
              <span className="text-[9px] font-mono font-bold text-slate-500 bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/[0.04]">{col.count}</span>
            </div>

            {/* Vòng lặp lọc xuất các thẻ Campaign Cards theo cột tương ứng */}
            <div className="space-y-3 flex-1 overflow-y-auto scrollbar-none pb-2">
              {campaignCards.filter(c => c.column === col.id).map((camp) => (
                <motion.div
                  key={camp.id}
                  whileHover={{ y: -3, borderColor: "rgba(0, 217, 139, 0.2)", boxShadow: "0 10px 20px rgba(0,0,0,0.3)" }}
                  className="bg-[#0e1b17]/40 border border-white/[0.04] p-3.5 rounded-xl space-y-3 transition-all cursor-pointer relative overflow-hidden group"
                >
                  <div className="flex justify-between items-start select-none">
                    <span className="text-[8px] font-mono font-bold bg-white/[0.02] text-slate-400 px-1.5 py-0.5 rounded border border-white/[0.04]">{camp.type}</span>
                    <span className="text-[9px] font-mono text-[#dffe64] font-black">AI:{camp.score}</span>
                  </div>

                  <h4 className="text-xs font-bold text-white leading-snug group-hover:text-[#00D98B] transition-colors">{camp.name}</h4>

                  <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-500 pt-2 border-t border-white/[0.03] select-none">
                    <div>Open: <span className="text-slate-300 font-bold">{camp.openRate}</span></div>
                    <div>Click: <span className="text-slate-300 font-bold">{camp.clickRate}</span></div>
                  </div>

                  <div className="flex justify-between items-center select-none pt-1">
                    <div className="flex -space-x-1">
                      <div className="w-4 h-4 rounded-full bg-emerald-600 text-[6px] font-bold flex items-center justify-center text-black">A1</div>
                      <div className="w-4 h-4 rounded-full bg-slate-700 text-[6px] font-bold flex items-center justify-center text-white">A2</div>
                    </div>
                    <span className={`text-[8px] font-mono font-bold uppercase tracking-wider ${camp.priority === 'High' ? 'text-[#FF5C5C]' : 'text-slate-500'}`}>
                      {camp.priority}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </motion.div>
  );
};

export default CampaignsTab;