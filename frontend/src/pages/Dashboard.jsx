import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Users, Mail, MousePointerClick, LogOut } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [contactsCount, setContactsCount] = useState(0);
  const [campaigns, setCampaigns] = useState([]);
  const [chartData, setChartData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      try {
        // Cấu hình Header đính kèm Token bảo mật tự động
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 1. Lấy danh sách khách hàng của shop
        const contactRes = await axios.get('http://localhost:5000/api/contacts', config);
        setContactsCount(contactRes.data.total || 0);

        // 2. Dựng data tĩnh hoặc gọi API thống kê campaign (tự giả lập dựa trên cấu trúc DB)
        const fakeChartData = [
          { name: 'Chiến dịch Sale Hè', sent: 1, click: 1 },
          { name: 'BST Mới Thu Đông', sent: 5, click: 3 },
          { name: 'Tri ân VIP', sent: 3, click: 0 }
        ];
        setChartData(fakeChartData);

      } catch (err) {
        console.error('Lỗi nạp dữ liệu Dashboard:', err);
        localStorage.removeItem('token');
        navigate('/login');
      }
    };
    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const totalClicks = chartData.reduce((acc, curr) => acc + curr.click, 0);
  const totalSent = chartData.reduce((acc, curr) => acc + curr.sent, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-900 bg-gray-950 flex flex-col justify-between p-6">
        <div className="space-y-8">
          <div className="text-lg font-black tracking-tight">KHUONG LAP <span className="text-blue-500">CONSOLE</span></div>
          <nav className="space-y-2">
            <div className="px-4 py-2.5 bg-gray-900 rounded-xl text-sm font-medium text-white cursor-pointer">Tổng quan hệ thống</div>
          </nav>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-red-400 border border-gray-900 hover:border-red-500/20 bg-transparent py-2.5 rounded-xl transition-all"><LogOut className="w-4 h-4" /> Đăng xuất</button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Bảng Điều Khiển</h1>
            <p className="text-gray-500 text-sm mt-0.5">Thống kê hiệu năng tự động hóa doanh nghiệp</p>
          </div>
        </header>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900/30 border border-gray-900 p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center"><Users className="w-5 h-5" /></div>
            <div>
              <div className="text-2xl font-black">{contactsCount}</div>
              <div className="text-gray-500 text-xs uppercase font-semibold tracking-wider mt-0.5">Tổng số khách hàng</div>
            </div>
          </div>
          <div className="bg-gray-900/30 border border-gray-900 p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center"><Mail className="w-5 h-5" /></div>
            <div>
              <div className="text-2xl font-black">{totalSent}</div>
              <div className="text-gray-500 text-xs uppercase font-semibold tracking-wider mt-0.5">Email đã phát đi</div>
            </div>
          </div>
          <div className="bg-gray-900/30 border border-gray-900 p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center"><MousePointerClick className="w-5 h-5" /></div>
            <div>
              <div className="text-2xl font-black">{totalClicks}</div>
              <div className="text-gray-500 text-xs uppercase font-semibold tracking-wider mt-0.5">Lượt tương tác click</div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-gray-900/20 border border-gray-900 p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-6">Biểu đồ tương tác chiến dịch</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '12px' }} />
                <Bar dataKey="sent" name="Đã Gửi" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="click" name="Lượt Click" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;