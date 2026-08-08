import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';

const EmailFlowNetworkBg = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const clusterTypes = ['Customer', 'AI', 'Automation', 'Success'];
    const nodes = [];

    const clustersConfig = [
      { type: 'Customer', cx: 0.15, cy: 0.3, count: 4 },
      { type: 'AI', cx: 0.35, cy: 0.65, count: 5 },
      { type: 'Automation', cx: 0.6, cy: 0.35, count: 5 },
      { type: 'Success', cx: 0.85, cy: 0.55, count: 4 }
    ];

    clustersConfig.forEach((cfg) => {
      const baseId = nodes.length;
      nodes.push({
        id: baseId, type: cfg.type, baseX: canvas.width * cfg.cx, baseY: canvas.height * cfg.cy,
        x: canvas.width * cfg.cx, y: canvas.height * cfg.cy, vx: 0, vy: 0, size: 12, isIcon: true,
        phase: Math.random() * Math.PI * 2, speed: 0.002, glow: 0, parallaxLayer: 3
      });

      for (let i = 0; i < cfg.count; i++) {
        const angle = (i / cfg.count) * Math.PI * 2;
        const dist = 45 + Math.random() * 35;
        const bx = canvas.width * cfg.cx + Math.cos(angle) * dist;
        const by = canvas.height * cfg.cy + Math.sin(angle) * dist;

        nodes.push({
          id: nodes.length, type: cfg.type, baseX: bx, baseY: by, x: bx, y: by, vx: 0, vy: 0,
          size: 3 + Math.random() * 3, isIcon: false, phase: Math.random() * Math.PI * 2, speed: 0.004, glow: 0, parallaxLayer: 2
        });
      }
    });

    const connections = [];
    nodes.forEach((n1) => {
      nodes.forEach((n2) => {
        if (n1.id < n2.id && n1.type === n2.type && (n1.isIcon || n2.isIcon || Math.random() < 0.25)) {
          connections.push({ from: n1, to: n2, isLongLink: false });
        }
      });
    });

    for (let i = 0; i < clustersConfig.length - 1; i++) {
      const iconFrom = nodes.find(n => n.type === clustersConfig[i].type && n.isIcon);
      const iconTo = nodes.find(n => n.type === clustersConfig[i+1].type && n.isIcon);
      if (iconFrom && iconTo) connections.push({ from: iconFrom, to: iconTo, isLongLink: true });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.1; mouse.y += (mouse.targetY - mouse.y) * 0.1;

      nodes.forEach((n) => {
        n.phase += n.speed;
        const autoFloatY = Math.sin(n.phase) * 4;
        const factor = n.parallaxLayer === 3 ? 0.02 : 0.01;
        let targetX = n.baseX + (mouse.x - canvas.width / 2) * factor;
        let targetY = n.baseY + (mouse.y - canvas.height / 2) * factor + autoFloatY;

        const dx = mouse.x - n.x; const dy = mouse.y - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          targetX += (dx / dist) * 10; targetY += (dy / dist) * 10;
          n.glow += (1 - n.glow) * 0.1;
        } else {
          n.glow += (0 - n.glow) * 0.05;
        }
        n.x += (targetX - n.x) * 0.08; n.y += (targetY - n.y) * 0.08;
      });

      connections.forEach((c) => {
        ctx.beginPath(); ctx.moveTo(c.from.x, c.from.y);
        ctx.quadraticCurveTo((c.from.x + c.to.x) / 2, (c.from.y + c.to.y) / 2 - (c.isLongLink ? 15 : 0), c.to.x, c.to.y);
        ctx.strokeStyle = `rgba(221, 248, 232, ${c.from.glow > 0.4 || c.to.glow > 0.4 ? 0.32 : 0.12})`;
        ctx.lineWidth = c.isLongLink ? 1.2 : 0.8; ctx.stroke();
      });

      nodes.forEach((n) => {
        ctx.beginPath();
        if (n.isIcon) {
          ctx.fillStyle = n.glow > 0.5 ? '#a7f3d0' : '#c8f6d6';
          ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = `rgba(200, 246, 214, ${0.3 + n.glow * 0.4})`;
          ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2); ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={(e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        mouseRef.current.targetX = e.clientX - rect.left;
        mouseRef.current.targetY = e.clientY - rect.top;
      }}
      onMouseLeave={() => { mouseRef.current.targetX = -1000; mouseRef.current.targetY = -1000; }}
      className="absolute top-0 left-0 w-full h-full z-0 pointer-events-auto"
    />
  );
};

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/tenants/register', { name, email, password });
      if (response.data.status === 'Success') {
        setSuccess('Khởi tạo không gian Verdio thành công! Đang chuyển hướng...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký không thành công, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
      transition={{ duration: 0.18, ease: "linear" }}
      className="min-h-screen bg-[#060907] text-slate-200 flex flex-col justify-center items-center p-4 relative overflow-hidden"
    >
      <EmailFlowNetworkBg />

      {/* 🌌 AMBIENT BACKGROUND GLOWS - SẠCH BÓNG SẮC XANH ĐẰM CŨ */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/5 blur-[160px] pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-teal-500/5 blur-[160px] pointer-events-none z-0" />

      {/* Nút quay lại trang chủ */}
      <motion.div whileHover={{ x: -4 }} className="absolute top-8 left-8 z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider">
          <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
        </Link>
      </motion.div>

      {/* Khung Form Đăng Ký Glassmorphism */}
      <div className="max-w-md w-full bg-white/[0.02] border border-white/[0.06] backdrop-blur-2xl rounded-[32px] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 relative">
        <div className="absolute top-0 right-0 border-b border-l border-white/[0.05] bg-white/[0.01] px-4 py-1.5 font-mono text-[9px] text-slate-600 rounded-bl-xl rounded-tr-[30px]">INITIALIZE_NODE // v1.2</div>

        {/* LOGO CHIẾC LÁ CHUẨN TRANG CHỦ */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8 select-none">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 overflow-visible" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="verdio-leaf-reg" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="40%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <path d="M25,85 Q28,50 45,43 Q65,38 100,45" stroke="url(#verdio-leaf-reg)" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M45,43 Q62,25 64,30 Q78,40 100,45" stroke="url(#verdio-leaf-reg)" strokeWidth="3" strokeLinecap="round" />
              <path d="M45,43 Q55,33 75,50" stroke="url(#verdio-leaf-reg)" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M47,57 Q65,48 100,45" stroke="url(#verdio-leaf-reg)" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M50,65 Q70,55 100,45" stroke="url(#verdio-leaf-reg)" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M50,65 Q67,70 100,45" stroke="url(#verdio-leaf-reg)" strokeWidth="3" strokeLinecap="round" />
              <circle cx="25" cy="85" r="4.5" fill="#059669" />
              <circle cx="64" cy="30" r="4.5" fill="#34d399" />
              <circle cx="100" cy="45" r="4.5" fill="#34d399" />
            </svg>
            <span className="text-sm font-black tracking-widest text-white uppercase">VERD<span className="text-emerald-400 font-medium">IO</span></span>
          </div>
          <p className="text-slate-500 text-xs mt-1">Đăng ký hệ thống và kích hoạt không gian số</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-2xl text-xs text-center">{error}</div>}
          {success && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-2xl text-xs text-center animate-pulse">{success}</div>}

          {/* Ô nhập tên Doanh nghiệp */}
          <div className="space-y-2">
            <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-widest">// Tên Doanh Nghiệp / Shop</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-emerald-400 transition-colors" />
              <input 
                type="text" 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full bg-white/[0.01] border border-white/[0.06] focus:border-emerald-500/50 rounded-xl py-3.5 pl-12 pr-4 text-xs font-medium text-white placeholder-slate-600 outline-none backdrop-blur-md transition-all" 
                placeholder="Verdio Store" 
              />
            </div>
          </div>

          {/* Ô nhập Email */}
          <div className="space-y-2">
            <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-widest">// Email Quản Trị</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-emerald-400 transition-colors" />
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full bg-white/[0.01] border border-white/[0.06] focus:border-emerald-500/50 rounded-xl py-3.5 pl-12 pr-4 text-xs font-medium text-white placeholder-slate-600 outline-none backdrop-blur-md transition-all" 
                placeholder="admin@verdio.com" 
              />
            </div>
          </div>

          {/* Ô nhập Mật khẩu */}
          <div className="space-y-2">
            <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-widest">// Mật Khẩu Hệ Thống</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-emerald-400 transition-colors" />
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-white/[0.01] border border-white/[0.06] focus:border-emerald-500/50 rounded-xl py-3.5 pl-12 pr-4 text-xs font-medium text-white placeholder-slate-600 outline-none backdrop-blur-md transition-all" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          {/* Nút bấm Kích Hoạt */}
          <motion.button 
            type="submit" 
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-[#070a08] text-xs font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/10 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kích hoạt tài khoản'}
          </motion.button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/[0.05] text-center text-xs text-slate-500">
          Đã có không gian riêng? <Link to="/login" className="text-emerald-400 font-bold hover:underline transition-all">Đăng nhập ngay</Link>
        </div>
      </div>
    </motion.div>
  );
};

export default Register;