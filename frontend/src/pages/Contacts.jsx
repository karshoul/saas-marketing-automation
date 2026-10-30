import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { 
  Users, UserCheck, UserPlus, Award, Target, UserMinus, 
  Search, SlidersHorizontal, Download, Upload, MoreVertical, 
  ChevronLeft, ChevronRight, X, Mail, Play, CheckCircle2, 
  Sparkles, ShieldCheck, BarChart3, PieChart, Landmark,
  RefreshCw, Trash2, Phone, Tag, FileSpreadsheet, AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart as RePieChart, Pie
} from 'recharts';

export default function Contacts() {
  // --- STATE QUẢN LÝ DỮ LIỆU TỪ BACKEND ---
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [meta, setMeta] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });

  // --- MODAL & DRAWER STATE ---
  const [selectedContact, setSelectedContact] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // REF DÙNG CHO CHỌN FILE EXCEL TỪ MÁY TÍNH
  const fileInputRef = useRef(null);

  // --- FORM TẠO MỚI HỒ SƠ KHÁCH HÀNG CRM ĐẦY ĐỦ ---
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    title: '',
    phone: '',
    country: 'Vietnam',
    segment: 'LEADS',
    status: 'SUBSCRIBED',
    tags: ''
  });

  const [rawImportText, setRawImportText] = useState('');

  // ==========================================
  // 1. TẢI DỮ LIỆU TỪ BACKEND THEO WORKSPACE
  // ==========================================
  const fetchContacts = useCallback(async (page = 1) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        segment: segmentFilter || undefined
      };

      const res = await api.get('/contacts', { params });
      const data = res.data?.data || [];
      const metaData = res.data?.meta || {
        page,
        limit: pageSize,
        total: data.length,
        totalPages: Math.ceil(data.length / pageSize) || 1
      };

      setContacts(data);
      setMeta(metaData);
    } catch (err) {
      console.error('Lỗi tải contacts:', err);
      setErrorMsg(err.response?.data?.message || 'Không thể tải danh sách liên hệ từ máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, segmentFilter, pageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchContacts]);

  // ==========================================
  // 2. TÍNH TOÁN KPI VÀ BIỂU ĐỒ TỪ DỮ LIỆU THẬT
  // ==========================================
  const kpiStats = useMemo(() => {
    const total = meta.total || contacts.length;
    const activeSubs = contacts.filter(c => c.status === 'SUBSCRIBED').length;
    const unsubscribed = contacts.filter(c => c.status === 'UNSUBSCRIBED').length;
    const vipCount = contacts.filter(c => c.segment === 'VIP').length;
    const leadsCount = contacts.filter(c => c.segment === 'LEADS').length;

    return [
      { label: 'Total Contacts', value: total.toLocaleString(), growth: 'Optimal', icon: Users, color: 'text-[#00D98B]' },
      { label: 'Subscribers', value: activeSubs.toLocaleString(), growth: 'Active', icon: UserCheck, color: 'text-[#3CE87A]' },
      { label: 'VIP Partners', value: vipCount.toLocaleString(), growth: 'Tier 1', icon: Award, color: 'text-[#dffe64]' },
      { label: 'Leads Pipeline', value: leadsCount.toLocaleString(), growth: 'Growing', icon: Target, color: 'text-[#FFC857]' },
      { label: 'Enterprise Hub', value: contacts.filter(c => c.segment === 'ENTERPRISE').length.toLocaleString(), growth: 'Sync', icon: Landmark, color: 'text-[#00CFA2]' },
      { label: 'Unsubscribed', value: unsubscribed.toLocaleString(), growth: 'Managed', icon: UserMinus, color: 'text-[#FF5C5C]' }
    ];
  }, [meta.total, contacts]);

  const segmentChartData = useMemo(() => {
    const counts = { VIP: 0, ENTERPRISE: 0, LEADS: 0, CUSTOMERS: 0, INACTIVE: 0 };
    contacts.forEach(c => {
      const seg = c.segment || 'LEADS';
      if (counts[seg] !== undefined) counts[seg]++;
    });

    return [
      { name: 'VIP', value: counts.VIP || 1, color: '#dffe64' },
      { name: 'Enterprise', value: counts.ENTERPRISE || 1, color: '#00CFA2' },
      { name: 'Leads', value: counts.LEADS || 1, color: '#00D98B' },
      { name: 'Customers', value: counts.CUSTOMERS || 1, color: '#3CE87A' },
      { name: 'Inactive', value: counts.INACTIVE || 1, color: '#FF5C5C' }
    ];
  }, [contacts]);

  // ==========================================
  // 3. THAO TÁC EXPORT / IMPORT FILE EXCEL
  // ==========================================
  const handleExportExcel = async () => {
    setExporting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await api.get('/contacts/export', {
        responseType: 'blob' // Bắt buộc nhận binary file stream từ Backend
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Danh_Ba_VERDIO_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccessMsg('Đã xuất thành công file Excel danh bạ!');
    } catch (err) {
      console.error('Lỗi xuất Excel:', err);
      setErrorMsg('Không thể xuất file Excel danh bạ.');
    } finally {
      setExporting(false);
    }
  };

  const handleImportExcelFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await api.post('/contacts/import-excel', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMsg(res.data?.message || 'Import thành công danh bạ từ file Excel!');
      fetchContacts(1);
    } catch (err) {
      console.error('Lỗi import Excel:', err);
      setErrorMsg(err.response?.data?.message || 'Lỗi khi tải file Excel lên.');
    } finally {
      setSubmitting(false);
      if (e.target) e.target.value = ''; // Reset input file
    }
  };

  // ==========================================
  // 4. THAO TÁC THÊM MỚI, IMPORT TEXT & XÓA
  // ==========================================
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        company: formData.company.trim(),
        title: formData.title.trim(),
        phone: formData.phone.trim(),
        country: formData.country.trim(),
        segment: formData.segment,
        status: formData.status,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };

      await api.post('/contacts', payload);
      setSuccessMsg(`Thêm liên hệ ${payload.email} thành công!`);
      setIsCreateOpen(false);
      setFormData({
        email: '', firstName: '', lastName: '', company: '', title: '',
        phone: '', country: 'Vietnam', segment: 'LEADS', status: 'SUBSCRIBED', tags: ''
      });
      fetchContacts(1);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi thêm liên hệ.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportText = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const lines = rawImportText.split('\n').map(l => l.trim()).filter(Boolean);
      const contactsList = lines.map(line => {
        const p = line.split(',').map(s => s.trim());
        return {
          email: p[0]?.toLowerCase(),
          firstName: p[1] || '',
          lastName: p[2] || '',
          phone: p[3] || '',
          company: p[4] || '',
          tags: p[5] ? p[5].split('|').map(t => t.trim()) : [],
          status: 'SUBSCRIBED',
          segment: 'LEADS'
        };
      }).filter(c => c.email && c.email.includes('@'));

      if (contactsList.length === 0) {
        throw new Error('Không tìm thấy dòng dữ liệu email hợp lệ nào.');
      }

      await api.post('/contacts/import', { contacts: contactsList });
      setSuccessMsg(`Import thành công ${contactsList.length} liên hệ vào Workspace!`);
      setIsImportOpen(false);
      setRawImportText('');
      fetchContacts(1);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Lỗi import danh bạ.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Xóa vĩnh viễn liên hệ "${email}" khỏi không gian làm việc này?`)) return;

    try {
      await api.delete(`/contacts/${id}`);
      setContacts(prev => prev.filter(c => (c._id || c.id) !== id));
      if (selectedContact && (selectedContact._id || selectedContact.id) === id) {
        setSelectedContact(null);
      }
      setSuccessMsg(`Đã xóa liên hệ ${email}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Không thể xóa liên hệ này.');
    }
  };

  return (
    <div className="w-full space-y-6 font-sans select-none text-slate-300 relative">
      
      {/* INPUT FILE ẨN CHỌN FILE EXCEL */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept=".xlsx, .xls, .csv" 
        onChange={handleImportExcelFile} 
        className="hidden" 
      />

      {/* THÔNG BÁO TRẠNG THÁI */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="hover:text-white">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="hover:text-white">✕</button>
        </div>
      )}

      {/* ========================== PHẦN 1 – KPI STATS CARDS ========================== */}
      <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiStats.map((kpi, i) => {
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

      {/* ========================== PHẦN 2 – AUDIENCE ANALYTICS & INSIGHTS ========================== */}
      <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0a110d]/80 border border-white/[0.04] p-5 rounded-[24px] backdrop-blur-2xl shadow-xl">
          
          <div className="space-y-3 flex flex-col justify-between h-44">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <PieChart className="w-3 h-3 text-[#dffe64]" /> Live Segments Ratio
            </span>
            <div className="h-32 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={segmentChartData} cx="50%" cy="50%" innerRadius={24} outerRadius={40} paddingAngle={3} dataKey="value">
                    {segmentChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] font-black font-mono text-white leading-none">{meta.total}</span>
                <span className="text-[7px] text-slate-500 uppercase font-mono">Nodes</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 flex flex-col justify-center border-l border-white/[0.03] pl-4 font-mono text-[10px]">
            <span className="text-slate-500 font-bold uppercase tracking-wider mb-1">// Workspace Metadata</span>
            <div className="flex justify-between py-1 border-b border-white/[0.02]">
              <span className="text-slate-400">Total Registry:</span>
              <span className="text-emerald-400 font-bold">{meta.total} contacts</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.02]">
              <span className="text-slate-400">Filter Applied:</span>
              <span className="text-[#38bdf8]">{statusFilter || 'ALL_STATUS'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Current Scope:</span>
              <span className="text-[#dffe64]">Page {meta.page} of {meta.totalPages}</span>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 bg-gradient-to-br from-[#0e1b17] to-white/[0.01] border border-white/[0.05] p-5 rounded-[24px] backdrop-blur-2xl shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="space-y-3 flex-1">
            <span className="text-[9px] font-mono font-black text-[#00D98B] uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Multi-Tenant Registry Hub
            </span>
            <ul className="space-y-2 font-mono text-[10px] text-slate-400">
              <li className="flex items-start gap-1.5"><span className="text-[#3CE87A] font-bold">✓</span> Ràng buộc cô lập dữ liệu theo Tenant ID.</li>
              <li className="flex items-start gap-1.5"><span className="text-[#00D98B] font-bold">✦</span> Hệ thống tự đồng bộ hạn mức Contact Quota theo gói cước.</li>
              <li className="flex items-start gap-1.5"><span className="text-[#38bdf8] font-bold">i</span> Hỗ trợ Bulk Import file Excel/CSV chống trùng lặp.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ========================== PHẦN 3 – CONTACT TABLE & ACTIONS ========================== */}
      <div className="bg-[#0a110d]/60 border border-white/[0.04] rounded-[24px] backdrop-blur-2xl shadow-2xl p-5 w-full relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.04] select-none">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Tìm email, tên, công ty..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/[0.01] border border-white/[0.04] rounded-full py-1.5 pl-9 pr-4 text-[10px] font-medium text-white outline-none w-52 focus:w-64 transition-all focus:border-[#00D98B]/30" 
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0e1b17] border border-white/[0.05] rounded-xl px-3 py-1.5 text-[10px] font-mono text-slate-300 outline-none"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="SUBSCRIBED">SUBSCRIBED</option>
              <option value="UNSUBSCRIBED">UNSUBSCRIBED</option>
              <option value="BOUNCED">BOUNCED</option>
            </select>

            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              className="bg-[#0e1b17] border border-white/[0.05] rounded-xl px-3 py-1.5 text-[10px] font-mono text-slate-300 outline-none"
            >
              <option value="">Tất cả phân khúc</option>
              <option value="VIP">VIP</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
              <option value="LEADS">LEADS</option>
              <option value="CUSTOMERS">CUSTOMERS</option>
            </select>

            <button 
              onClick={() => fetchContacts(meta.page)}
              className="p-1.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] text-slate-400 hover:text-white"
              title="Tải lại"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00D98B]' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
            {/* NÚT EXPORT EXCEL */}
            <button 
              onClick={handleExportExcel}
              disabled={exporting}
              className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-300 text-[10px] font-bold uppercase px-3 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Tải file Excel danh bạ về máy"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? 'Đang xuất Excel...' : 'Tải Excel'}
            </button>

            {/* NÚT UPLOAD FILE EXCEL */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
              className="flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/20 hover:border-sky-500/40 text-sky-400 hover:text-sky-300 text-[10px] font-bold uppercase px-3 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Upload file Excel từ máy tính"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              {submitting ? 'Đang nạp file...' : 'Upload Excel'}
            </button>

            {/* NÚT IMPORT DÁN TEXT */}
            <button 
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-1 bg-white/[0.01] border border-white/[0.04] hover:border-white/[0.1] text-slate-300 hover:text-white text-[10px] font-bold uppercase px-3 py-2 rounded-xl transition-all cursor-pointer"
            >
              <Upload className="w-3 h-3 text-[#38bdf8]" /> Import Text
            </button>

            {/* NÚT THÊM THỦ CÔNG */}
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md hover:bg-slate-200 transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" /> Add Contact
            </button>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto scrollbar-none pt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.03] text-slate-500 font-mono text-[9px] uppercase tracking-widest">
                <th className="py-3 px-2 w-6"><input type="checkbox" className="rounded bg-black border-white/10" /></th>
                <th className="py-3 font-bold tracking-wider">// Identity Full Name</th>
                <th className="py-3 tracking-wider">// Company Hub</th>
                <th className="py-3 tracking-wider">// Status</th>
                <th className="py-3 tracking-wider">// Segment</th>
                <th className="py-3 tracking-wider">// AI Score</th>
                <th className="py-3 tracking-wider">// Tags</th>
                <th className="py-3 text-right pr-2">// Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02] font-mono text-[11px] text-slate-300">
              {loading && contacts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#00D98B]" />
                      <span>Đang truy vấn MongoDB Atlas...</span>
                    </div>
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    Workspace này chưa có liên hệ nào. Hãy bấm "Add Contact", "Upload Excel" hoặc "Import Text".
                  </td>
                </tr>
              ) : (
                contacts.map((c) => {
                  const id = c._id || c.id;
                  const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email.split('@')[0];
                  return (
                    <tr 
                      key={id} 
                      className="hover:bg-white/[0.01] transition-colors group cursor-pointer"
                      onClick={() => setSelectedContact(c)}
                    >
                      <td className="py-3.5 px-2" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="rounded bg-black border-white/10" />
                      </td>
                      <td className="py-3.5 font-bold text-white group-hover:text-[#00D98B] transition-colors">
                        <div>
                          <div>{fullName}</div>
                          <span className="text-[9px] text-slate-500 font-normal normal-case block mt-0.5">{c.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-400">
                        <div>{c.company || '—'}</div>
                        <span className="text-[9px] text-slate-600 block mt-0.5">{c.title || 'Team Member'}</span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                          c.status === 'SUBSCRIBED' 
                            ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20'
                            : c.status === 'UNSUBSCRIBED'
                            ? 'bg-amber-500/5 text-amber-400 border-amber-500/20'
                            : 'bg-red-500/5 text-red-400 border-red-500/20'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                          c.segment === 'VIP' ? 'bg-[#dffe64]/5 text-[#dffe64] border-[#dffe64]/10' : 'bg-white/[0.02] text-slate-400 border-white/[0.04]'
                        }`}>
                          {c.segment || 'LEADS'}
                        </span>
                      </td>
                      <td className="py-3.5 font-bold text-emerald-400">{c.engagementScore ?? 50}</td>
                      <td className="py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {c.tags && c.tags.length > 0 ? (
                            c.tags.slice(0, 2).map((t, idx) => (
                              <span key={idx} className="px-1.5 py-0.2 rounded text-[8px] bg-white/[0.03] text-slate-400 border border-white/5">
                                #{t}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-600 text-[10px]">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 text-right pr-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleDelete(id, c.email)}
                          className="p-1 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                          title="Xóa liên hệ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-2 border-t border-white/[0.03] text-[10px] font-mono text-slate-500 select-none">
          <div className="flex items-center gap-2">
            <span>Show rows:</span>
            <select 
              value={pageSize} 
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-[#0a110d] border border-white/[0.04] rounded px-2 py-1 text-slate-300 outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="ml-2">Showing {contacts.length} of {meta.total} Contacts</span>
          </div>

          <div className="flex items-center gap-1">
            <button 
              disabled={meta.page <= 1 || loading}
              onClick={() => fetchContacts(meta.page - 1)}
              className="p-1.5 bg-white/[0.01] border border-white/[0.03] rounded-lg hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 py-1 bg-white/[0.03] border border-white/[0.06] text-[#00D98B] rounded-lg font-bold">
              {meta.page} / {meta.totalPages || 1}
            </span>
            <button 
              disabled={meta.page >= meta.totalPages || loading}
              onClick={() => fetchContacts(meta.page + 1)}
              className="p-1.5 bg-white/[0.01] border border-white/[0.03] rounded-lg hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================== QUICK VIEW PANEL (DRAWER) ========================== */}
      <AnimatePresence>
        {selectedContact && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedContact(null)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
            
            <motion.aside 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="fixed top-4 right-4 bottom-4 w-96 bg-[#08110F]/95 border border-white/[0.06] backdrop-blur-3xl rounded-[24px] shadow-[0_0_50px_rgba(0,0,0,0.8)] z-50 p-5 flex flex-col justify-between overflow-hidden select-none font-mono"
            >
              <div className="space-y-5 overflow-y-auto pr-1 scrollbar-none flex-1">
                <div className="flex justify-between items-center border-b border-white/[0.03] pb-3">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">// IDENTITY DOSSIER</span>
                  <button onClick={() => setSelectedContact(null)} className="p-1 bg-white/[0.01] border border-white/[0.04] rounded-lg hover:text-white transition-colors cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </div>

                <div className="flex items-center gap-4 bg-white/[0.01] border border-white/[0.03] p-4 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00D98B] to-transparent border border-white/[0.1] text-black font-sans font-black text-sm flex items-center justify-center shadow-md">
                    {selectedContact.email?.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-sans font-black text-white truncate">
                      {[selectedContact.firstName, selectedContact.lastName].filter(Boolean).join(' ') || 'Chưa đặt tên'}
                    </h4>
                    <span className="text-[10px] text-slate-500 block truncate mt-0.5">{selectedContact.email}</span>
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-[#dffe64]/5 border border-[#dffe64]/10 text-[#dffe64] tracking-wide inline-block mt-2">
                      {selectedContact.segment || 'LEADS'}
                    </span>
                  </div>
                </div>

                <div className="bg-[#141d16]/20 border border-white/[0.03] p-4 rounded-2xl space-y-3 text-[11px]">
                  <div className="flex justify-between border-b border-white/[0.02] pb-1.5"><span className="text-slate-500">Company Hub:</span><span className="text-white font-bold">{selectedContact.company || 'N/A'}</span></div>
                  <div className="flex justify-between border-b border-white/[0.02] pb-1.5"><span className="text-slate-500">Job Title:</span><span className="text-slate-300">{selectedContact.title || 'N/A'}</span></div>
                  <div className="flex justify-between border-b border-white/[0.02] pb-1.5"><span className="text-slate-500">Phone:</span><span className="text-slate-300 font-mono">{selectedContact.phone || '—'}</span></div>
                  <div className="flex justify-between border-b border-white/[0.02] pb-1.5"><span className="text-slate-500">Score Core:</span><span className="text-[#00D98B] font-black">{selectedContact.engagementScore ?? 50} pts</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Status:</span><span className="text-emerald-400 font-bold">{selectedContact.status}</span></div>
                </div>

                {selectedContact.tags && selectedContact.tags.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">// Assigned Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedContact.tags.map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[9px] bg-white/[0.02] border border-white/[0.05] text-[#38bdf8]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/[0.03] flex gap-2 select-none">
                <button 
                  onClick={() => handleDelete(selectedContact._id || selectedContact.id, selectedContact.email)}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-black uppercase py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa Liên Hệ
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ========================== MODAL THÊM MỚI 1 CONTACT ========================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#0b1329] border border-white/15 rounded-2xl p-6 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#00D98B]" /> Thêm Hồ Sơ Khách Hàng
              </h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Email (*)</label>
                <input 
                  type="email" required placeholder="name@company.com"
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2 text-white outline-none focus:border-[#00D98B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Họ (First Name)</label>
                  <input 
                    type="text" placeholder="Nguyễn"
                    value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2 text-white outline-none focus:border-[#00D98B]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Tên (Last Name)</label>
                  <input 
                    type="text" placeholder="Văn A"
                    value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2 text-white outline-none focus:border-[#00D98B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Công Ty (Company Hub)</label>
                  <input 
                    type="text" placeholder="Google Vietnam"
                    value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2 text-white outline-none focus:border-[#00D98B]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Chức Danh (Title)</label>
                  <input 
                    type="text" placeholder="Marketing Lead"
                    value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2 text-white outline-none focus:border-[#00D98B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Phân Khúc (Segment)</label>
                  <select 
                    value={formData.segment} onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#00D98B]"
                  >
                    <option value="LEADS">LEADS</option>
                    <option value="VIP">VIP</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                    <option value="CUSTOMERS">CUSTOMERS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Số Điện Thoại</label>
                  <input 
                    type="text" placeholder="0901234567"
                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2 text-white outline-none focus:border-[#00D98B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Thẻ Nhãn Tags (cách nhau dấu phẩy)</label>
                <input 
                  type="text" placeholder="VIP_Q3, TECH, SAAS"
                  value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-3.5 py-2 text-white outline-none focus:border-[#00D98B]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 rounded-xl hover:bg-white/5 text-slate-400">Hủy</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl bg-[#00D98B] hover:bg-[#00c57d] text-black font-bold uppercase text-[11px] disabled:opacity-50">
                  {submitting ? 'Đang lưu...' : 'Lưu Hồ Sơ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================== MODAL IMPORT DÁN TEXT THỦ CÔNG ========================== */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#0b1329] border border-white/15 rounded-2xl p-6 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#38bdf8]" /> Import Khách Hàng Hàng Loạt (Text)
              </h2>
              <button onClick={() => setIsImportOpen(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <p className="text-xs text-slate-400">
              Dán dữ liệu danh bạ mỗi dòng một khách hàng theo cấu trúc sau:
              <br />
              <code className="text-[#00D98B] font-mono text-[11px]">email, firstName, lastName, phone, company, tag1|tag2</code>
            </p>

            <form onSubmit={handleImportText} className="space-y-4">
              <textarea
                rows="6"
                required
                placeholder={`developer@google.com, Nam, Nguyễn, 0911223344, Google, VIP|TECH\nceo@linear.app, Alex, Rivera, 0988776655, Linear, SAAS`}
                value={rawImportText}
                onChange={(e) => setRawImportText(e.target.value)}
                className="w-full bg-[#020617] border border-white/10 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-[#00D98B]"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsImportOpen(false)} className="px-4 py-2 rounded-xl hover:bg-white/5 text-slate-400 text-xs">Hủy</button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#38bdf8] text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50">
                  {submitting ? 'Đang đẩy vào MongoDB...' : 'Bắt Đầu Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}