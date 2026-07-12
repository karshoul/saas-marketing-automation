import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/tenants/login', { email, password });
      if (response.data.status === 'Success') {
        localStorage.setItem('token', response.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Email hoặc mật khẩu không chính xác!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="min-h-screen bg-gray-950 text-white flex flex-col justify-center items-center p-4 relative overflow-hidden"
    >
      {/* Nút quay lại có hiệu ứng hover trượt nhẹ */}
      <motion.div 
        whileHover={{ x: -4 }}
        className="absolute top-8 left-8"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
        </Link>
      </motion.div>

      {/* Khung Form Đăng Nhập */}
      <div className="max-w-md w-full bg-gray-900/40 border border-gray-900 rounded-2xl p-8 shadow-2xl backdrop-blur-md z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black tracking-tight">MARKET<span className="text-blue-500">FLOW</span></h2>
          <p className="text-gray-500 text-sm mt-1">Đăng nhập vào bảng điều khiển doanh nghiệp</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs text-center animate-shake">
              {error}
            </div>
          )}

          {/* Ô nhập Email */}
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-2 tracking-wider">Email Doanh Nghiệp</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-600" />
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full bg-gray-950 border border-gray-900 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" 
                placeholder="name@company.com" 
              />
            </div>
          </div>

          {/* Ô nhập Mật khẩu */}
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-2 tracking-wider">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-600" />
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-gray-950 border border-gray-900 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          {/* Nút bấm Đăng Nhập với hiệu ứng phát sáng */}
          <motion.button 
            type="submit" 
            disabled={loading}
            whileHover={{ scale: 1.02, boxShadow: "0px 0px 20px rgba(37, 99, 235, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Xác thực tài khoản'}
          </motion.button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Chưa có không gian số? <Link to="/register" className="text-blue-400 hover:underline">Đăng ký hệ thống</Link>
        </div>
      </div>
    </motion.div>
  );
};

export default Login;