import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Shield, Zap, RefreshCw, CheckCircle2, ChevronDown } from 'lucide-react';

// 🌐 CANVAS CORE COMPONENT: MẠNG LƯỚI DỮ LIỆU TỰ ĐỘNG MARKETING INTERACTIVE
const EmailFlowNetworkBg = ({ triggerPulse }) => {
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

    const clusterTypes = ['Customer', 'Email', 'AI', 'Automation', 'Analytics', 'Success'];
    const nodes = [];

    const clustersConfig = [
      { type: 'Customer', cx: 0.2, cy: 0.6, count: 5, icon: 'users' },
      { type: 'Email', cx: 0.35, cy: 0.3, count: 6, icon: 'mail' },
      { type: 'AI', cx: 0.5, cy: 0.55, count: 7, icon: 'cpu' },
      { type: 'Automation', cx: 0.65, cy: 0.35, count: 6, icon: 'toggle' },
      { type: 'Analytics', cx: 0.78, cy: 0.65, count: 5, icon: 'chart' },
      { type: 'Success', cx: 0.9, cy: 0.4, count: 4, icon: 'award' }
    ];

    clustersConfig.forEach((cfg) => {
      const baseId = nodes.length;
      nodes.push({
        id: baseId,
        type: cfg.type,
        baseX: canvas.width * cfg.cx,
        baseY: canvas.height * cfg.cy,
        x: canvas.width * cfg.cx,
        y: canvas.height * cfg.cy,
        vx: 0, vy: 0,
        size: 14,
        isIcon: true,
        iconName: cfg.icon,
        phase: Math.random() * Math.PI * 2,
        speed: 0.002 + Math.random() * 0.002,
        glow: 0,
        parallaxLayer: 3
      });

      for (let i = 0; i < cfg.count; i++) {
        const angle = (i / cfg.count) * Math.PI * 2 + Math.random();
        const dist = 40 + Math.random() * 50;
        const bx = canvas.width * cfg.cx + Math.cos(angle) * dist;
        const by = canvas.height * cfg.cy + Math.sin(angle) * dist;

        nodes.push({
          id: nodes.length,
          type: cfg.type,
          baseX: bx,
          baseY: by,
          x: bx,
          y: by,
          vx: 0, vy: 0,
          size: 4 + Math.random() * 4,
          isIcon: false,
          phase: Math.random() * Math.PI * 2,
          speed: 0.003 + Math.random() * 0.004,
          glow: 0,
          parallaxLayer: 1 + Math.floor(Math.random() * 2)
        });
      }
    });

    const connections = [];
    nodes.forEach((n1) => {
      nodes.forEach((n2) => {
        if (n1.id < n2.id && n1.type === n2.type && (n1.isIcon || n2.isIcon || Math.random() < 0.3)) {
          connections.push({ from: n1, to: n2, isLongLink: false });
        }
      });
    });

    for (let i = 0; i < clusterTypes.length - 1; i++) {
      const iconFrom = nodes.find(n => n.type === clusterTypes[i] && n.isIcon);
      const iconTo = nodes.find(n => n.type === clusterTypes[i+1] && n.isIcon);
      if (iconFrom && iconTo) {
        connections.push({ from: iconFrom, to: iconTo, isLongLink: true });
      }
    }

    const particles = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        baseX: 0, baseY: 0,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: 1 + Math.random() * 2
      });
    }

    let dataPulse = {
      active: true,
      currentLinkIdx: 0,
      progress: 0,
      path: connections.filter(c => c.isLongLink || (c.from.isIcon && c.to.isIcon))
    };

    let ctaBoomActive = false;
    let ctaBoomProgress = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;

      if (triggerPulse && !ctaBoomActive) {
        ctaBoomActive = true;
        ctaBoomProgress = 0;
      }
      if (ctaBoomActive) {
        ctaBoomProgress += 0.015;
        if (ctaBoomProgress > 1.2) ctaBoomActive = false;
      }

      const time = Date.now() * 0.0005;
      clustersConfig.forEach((cfg, idx) => {
        const bx = canvas.width * cfg.cx + Math.cos(time + idx) * 15;
        const by = canvas.height * cfg.cy + Math.sin(time * 0.8 + idx) * 15;
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(bx, by, 10, bx, by, 140);
        gradient.addColorStop(0, 'rgba(52, 211, 153, 0.05)');
        gradient.addColorStop(1, 'rgba(6, 9, 7, 0)');
        ctx.fillStyle = gradient;
        ctx.arc(bx, by, 140, 0, Math.PI * 2);
        ctx.fill();
      });

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          const force = (80 - dist) / 80;
          p.x += (dx / dist) * force * 4;
          p.y += (dy / dist) * force * 4;
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(167, 243, 208, ${0.15 + Math.random() * 0.2})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      nodes.forEach((n) => {
        n.phase += n.speed;
        const autoFloatY = Math.sin(n.phase) * 5;

        const parallaxFactor = n.parallaxLayer === 3 ? 0.03 : n.parallaxLayer === 2 ? 0.015 : 0.006;
        const targetParallaxX = (mouse.x - canvas.width / 2) * parallaxFactor;
        const targetParallaxY = (mouse.y - canvas.height / 2) * parallaxFactor;

        let targetX = n.baseX + targetParallaxX;
        let targetY = n.baseY + targetParallaxY + autoFloatY;

        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          const force = (120 - dist) / 120;
          targetX += (dx / dist) * force * 15;
          targetY += (dy / dist) * force * 15;
          n.glow += (1 - n.glow) * 0.15;
        } else {
          n.glow += (0 - n.glow) * 0.08;
        }

        const ax = (targetX - n.x) * 0.06;
        const ay = (targetY - n.y) * 0.06;
        n.vx = (n.vx + ax) * 0.82;
        n.vy = (n.vy + ay) * 0.82;
        n.x += n.vx;
        n.y += n.vy;
      });

      connections.forEach((c) => {
        ctx.beginPath();
        const midX = (c.from.x + c.to.x) / 2;
        const midY = (c.from.y + c.to.y) / 2 - (c.isLongLink ? 20 : 0);

        ctx.moveTo(c.from.x, c.from.y);
        ctx.quadraticCurveTo(midX, midY, c.to.x, c.to.y);

        let alpha = c.isLongLink ? 0.25 : 0.15;
        if (c.from.glow > 0.4 || c.to.glow > 0.4) alpha = 0.45;
        
        ctx.strokeStyle = `rgba(221, 248, 232, ${alpha})`;
        ctx.lineWidth = c.isLongLink ? 1.5 : 1;
        ctx.stroke();
      });

      if (dataPulse.active && dataPulse.path.length > 0) {
        dataPulse.progress += 0.012;
        if (dataPulse.progress >= 1) {
          dataPulse.progress = 0;
          dataPulse.currentLinkIdx = (dataPulse.currentLinkIdx + 1) % dataPulse.path.length;
        }

        const currentLink = dataPulse.path[dataPulse.currentLinkIdx];
        if (currentLink) {
          const t = dataPulse.progress;
          const pFrom = currentLink.from;
          const pTo = currentLink.to;
          const midX = (pFrom.x + pTo.x) / 2;
          const midY = (pFrom.y + pTo.y) / 2 - (currentLink.isLongLink ? 20 : 0);

          const pulseX = (1-t)*(1-t)*pFrom.x + 2*(1-t)*t*midX + t*t*pTo.x;
          const pulseY = (1-t)*(1-t)*pFrom.y + 2*(1-t)*t*midY + t*t*pTo.y;

          ctx.beginPath();
          const pGlow = ctx.createRadialGradient(pulseX, pulseY, 1, pulseX, pulseY, 8);
          pGlow.addColorStop(0, '#3ce87a');
          pGlow.addColorStop(0.4, 'rgba(60, 232, 122, 0.4)');
          pGlow.addColorStop(1, 'rgba(60, 232, 122, 0)');
          ctx.fillStyle = pGlow;
          ctx.arc(pulseX, pulseY, 8, 0, Math.PI * 2);
          ctx.fill();

          if (t > 0.85) {
            pTo.glow = Math.max(pTo.glow, 0.6);
          }
        }
      }

      nodes.forEach((n) => {
        const sizeMultiplier = 1 + n.glow * 0.25 + (ctaBoomActive ? Math.sin(ctaBoomProgress * Math.PI) * 0.4 : 0);
        const currentSize = n.size * sizeMultiplier;

        if (n.glow > 0.1 || ctaBoomActive) {
          ctx.beginPath();
          ctx.fillStyle = n.isIcon ? `rgba(60, 232, 122, ${0.12 * n.glow})` : `rgba(167, 243, 208, ${0.08 * n.glow})`;
          ctx.arc(n.x, n.y, currentSize * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        if (n.isIcon) {
          ctx.fillStyle = ctaBoomActive ? '#3ce87a' : n.glow > 0.5 ? '#a7f3d0' : '#c8f6d6';
          ctx.arc(n.x, n.y, currentSize, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.strokeStyle = '#060907';
          ctx.lineWidth = 2;
          ctx.arc(n.x, n.y, currentSize, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#060907';
          ctx.font = `bold ${Math.floor(currentSize * 0.9)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          let letter = n.type.charAt(0);
          if (ctaBoomActive && n.type !== 'Success') letter = '✓';
          ctx.fillText(letter, n.x, n.y);
        } else {
          ctx.fillStyle = `rgba(200, 246, 214, ${0.35 + n.glow * 0.5})`;
          ctx.arc(n.x, n.y, currentSize, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [triggerPulse]);

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.targetX = e.clientX - rect.left;
    mouseRef.current.targetY = e.clientY - rect.top;
  };

  const handleMouseLeave = () => {
    mouseRef.current.targetX = -1000;
    mouseRef.current.targetY = -1000;
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="absolute top-0 left-0 w-full h-full z-0 pointer-events-auto cursor-crosshair overflow-visible"
    />
  );
};

const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [activeTab, setActiveTab] = useState('automation');
  const [ctaPulse, setCtaPulse] = useState(false);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleCtaClick = () => {
    setCtaPulse(true);
    setTimeout(() => setCtaPulse(false), 1500);
  };

  // Nạp cấu hình lướt trồi (Scroll In View) cho khối hạ tầng
  const fadeInUp = {
    hidden: { y: 50, opacity: 0, filter: "blur(4px)" },
    visible: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 60, damping: 16 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.05 }
    }
  };

  return (
    <motion.div 
    initial={{ opacity: 0, filter: 'blur(4px)' }} 
    animate={{ opacity: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, filter: 'blur(4px)' }}
    transition={{ duration: 0.35, ease: "easeInOut" }}
    className="min-h-screen bg-[#060907] ..." // Giữ nguyên các class cũ của Khương
  >
    <div className="min-h-screen bg-[#060907] text-slate-200 font-sans relative overflow-x-hidden selection:bg-emerald-600 selection:text-white scroll-smooth">
      
      {/* 🌌 AMBIENT BACKGROUND GLOWS */}
      <div className="absolute top-0 left-[15%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/5 blur-[150px] pointer-events-none z-0" />
      <div className="absolute top-[35%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-teal-500/5 blur-[130px] pointer-events-none z-0" />

      {/* 1. SMART STICKY NAVBAR HEADER - Đã sửa lỗi khóa cứng dính (sticky top-0) + Kính lỏng trong suốt xịn */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05] bg-[#060907]/40 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.3)]">
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
        {/* 🌟 VERDIO LOGO & TEXT RE-DESIGN: CHIẾC LÁ MẠNG LƯỚI DỮ LIỆU CHUẨN ĐỒ HỌA */}
    <div className="flex items-center gap-3 select-none">
      {/* Cụm Logo SVG mô phỏng 100% hình chiếc lá kết nối node dữ liệu phẳng mịn */}
      <svg className="w-8 h-8 overflow-visible" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Tạo dải màu chuyển sắc mượt từ xanh lá sang Mint Neon */}
          <linearGradient id="verdio-leaf-network" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="40%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>

        {/* 🖲️ CÁC ĐƯỜNG MẠNG LƯỚI CONG BEZIER (MÔ PHỎNG LUỒNG GÂN LÁ) */}
        {/* Cuống lá chính cong dài từ dưới lên */}
        <path d="M25,85 Q28,50 45,43 Q65,38 100,45" stroke="url(#verdio-leaf-network)" strokeWidth="3.5" strokeLinecap="round" />
        
        {/* Vòm lá phía trên */}
        <path d="M45,43 Q62,25 64,30 Q78,40 100,45" stroke="url(#verdio-leaf-network)" strokeWidth="3" strokeLinecap="round" />
        <path d="M45,43 Q55,33 75,50" stroke="url(#verdio-leaf-network)" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Các luồng gân lá chạy song song ở giữa */}
        <path d="M47,57 Q65,48 100,45" stroke="url(#verdio-leaf-network)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M50,65 Q70,55 100,45" stroke="url(#verdio-leaf-network)" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Vòm lá phía dưới */}
        <path d="M50,65 Q67,70 100,45" stroke="url(#verdio-leaf-network)" strokeWidth="3" strokeLinecap="round" />

        {/* 🟢 CÁC ĐỐM TRÒN NODE DỮ LIỆU TẠI CÁC ĐẦU NÚT KHỚP NỐI */}
        <circle cx="25" cy="85" r="4.5" fill="#059669" stroke="#060907" strokeWidth="1.5" /> {/* Gốc cuống lá */}
        <circle cx="45" cy="43" r="4.5" fill="#10b981" />
        <circle cx="64" cy="30" r="4.5" fill="#34d399" /> {/* Đỉnh vòm trên */}
        <circle cx="75" cy="50" r="4.5" fill="#34d399" />
        <circle cx="47" cy="57" r="4.5" fill="#10b981" />
        <circle cx="50" cy="65" r="4.5" fill="#10b981" />
        <circle cx="67" cy="70" r="4.5" fill="#34d399" /> {/* Đáy vòm dưới */}
        <circle cx="100" cy="45" r="4.5" fill="#34d399" /> {/* Đầu nhọn lá */}
      </svg>
      
      {/* Tên thương hiệu khít sát, sang trọng chuẩn Typography */}
      <span className="text-sm font-black tracking-widest text-white uppercase">
        VERD<span className="text-emerald-400 font-medium">IO</span>
      </span>
    </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="bg-white/[0.03] border border-white/[0.08] text-slate-300 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl hover:text-white hover:border-white/[0.18] transition-all backdrop-blur-md">Đăng nhập</Link>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link to="/register" className="bg-gradient-to-r from-emerald-500 to-teal-500 text-[#070a08] text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20">Đăng ký ngay</Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION VỚI NỀN MẠNG LƯỚI TƯƠNG TÁC LƯỢNG GIÁC KÍNH MỜ */}
      <section className="relative w-full min-h-screen flex items-center justify-center overflow-visible pt-24 pb-20">
        
        <EmailFlowNetworkBg triggerPulse={ctaPulse} />

        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10 pointer-events-none">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 50 }} className="space-y-4">
            <div className="w-fit mx-auto bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-xl">
              🚀 Next-Gen Marketing Orchestration Platform
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.05] uppercase">
              Think Faster, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">Build Smarter</span>
            </h1>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }} className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed backdrop-blur-[1px]">
            Hệ thống quản lý không gian và tự động hóa chiến dịch tiếp thị đa kênh thế hệ mới. Trải nghiệm hiệu năng bứt phá của kiến trúc hàng đợi BullMQ ngầm kết hợp hệ thống bảo mật cách ly khối dữ liệu lõi tuyệt đối.
          </motion.p>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-4 justify-center pointer-events-auto">
            <button 
              onClick={handleCtaClick}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-[#070a08] text-xs font-black uppercase tracking-widest px-10 py-4.5 rounded-xl flex items-center gap-2 group shadow-xl shadow-emerald-500/10 hover:opacity-95 transition-all active:scale-[0.98] cursor-pointer"
            >
              Bắt đầu ngay <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a href="#features" className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] hover:border-white/[0.15] text-slate-300 text-xs font-black uppercase tracking-widest px-8 py-4.5 rounded-xl transition-all">
              Khám phá giải pháp
            </a>
          </motion.div>
        </div>
      </section>

      {/* 3. THREE-COLUMN BANNER - Phong cách Kính lỏng lơ lửng */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="w-full bg-white/[0.01] border-y border-white/[0.05] backdrop-blur-lg py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-white/[0.05]">
          <motion.div variants={fadeInUp} className="md:px-8 space-y-2 text-left">
            <div className="flex items-center gap-2 text-emerald-400"><Shield className="w-4 h-4" /> <h4 className="text-xs font-bold uppercase tracking-wider text-white">Bảo mật Multi-Tenant</h4></div>
            <p className="text-slate-400 text-xs leading-relaxed">Dữ liệu doanh nghiệp và tệp khách hàng của shop được cách ly, mã hóa tuyệt đối ở lớp lõi cơ sở dữ liệu.</p>
          </motion.div>
          <motion.div variants={fadeInUp} className="md:px-8 space-y-2 text-left">
            <div className="flex items-center gap-2 text-emerald-400"><Zap className="w-4 h-4" /> <h4 className="text-xs font-bold uppercase tracking-wider text-white">Kiến trúc Hàng đợi</h4></div>
            <p className="text-slate-400 text-xs leading-relaxed">Xử lý phân phối hàng ngàn Email cùng lúc nhờ cơ chế chia nhỏ bất đồng bộ ngầm thông qua BullMQ Cluster.</p>
          </motion.div>
          <motion.div variants={fadeInUp} className="md:px-8 space-y-2 text-left">
            <div className="flex items-center gap-2 text-emerald-400"><RefreshCw className="w-4 h-4" /> <h4 className="text-xs font-bold uppercase tracking-wider text-white">Tốc độ tức thì</h4></div>
            <p className="text-slate-400 text-xs leading-relaxed">Báo cáo chỉ số mở thư, nhấp liên kết và tương tác thực tế trả về Dashboard thông qua Webhook trong vòng 10ms.</p>
          </motion.div>
        </div>
      </motion.section>

      {/* 4. MODULES WORKSPACE - Workspace Kính lỏng cao cấp */}
      <motion.section id="features" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-120px" }} variants={staggerContainer} className="max-w-4xl mx-auto px-6 py-28 text-center relative z-10">
        <motion.div variants={fadeInUp} className="space-y-3 mb-12">
          <div className="w-fit mx-auto bg-white/[0.02] border border-white/[0.06] text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md">Core Modules</div>
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Hệ sinh thái vận hành</h2>
          <p className="text-slate-400 text-xs max-w-md mx-auto">Kiểm soát toàn bộ vòng đời chiến dịch tự động hóa Marketing trong một giao diện duy nhất.</p>
        </motion.div>

        <motion.div variants={fadeInUp} className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-[28px] p-4 shadow-2xl">
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {['automation', 'import', 'cloudinary', 'smtp'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === tab ? 'bg-emerald-600 text-[#070a08] shadow-lg shadow-emerald-500/10' : 'bg-white/[0.02] border border-white/[0.05] text-slate-400 hover:text-white backdrop-blur-md'}`}>
                {tab === 'automation' ? 'Tự động hóa' : tab === 'import' ? 'Nhập dữ liệu CSV' : tab === 'cloudinary' ? 'Kho lưu trữ ảnh' : 'Cấu hình SMTP'}
              </button>
            ))}
          </div>

          <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6 text-left min-h-[140px] flex flex-col justify-center backdrop-blur-md">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {activeTab === 'automation' && <p className="text-slate-400 text-xs leading-relaxed">Hệ thống phân tách tác vụ gửi thư thông minh giúp tránh tình trạng nghẽn băng thông, tối ưu hóa tỷ lệ email rơi vào hộp thư chính thay vì thư rác.</p>}
                {activeTab === 'import' && <p className="text-slate-400 text-xs leading-relaxed">Hỗ trợ bóc tách tệp cấu trúc CSV chứa hàng ngàn liên hệ khách hàng, tự động xử lý loại bỏ trùng lặp và ghi dữ liệu cực nhanh vào MongoDB.</p>}
                {activeTab === 'cloudinary' && <p className="text-slate-400 text-xs leading-relaxed">Tải trực tiếp hình ảnh, biểu mẫu banner khuyến mãi lên kho đám mây mã nguồn mở, tự động sinh thẻ HTML dán vào trình soạn thảo.</p>}
                {activeTab === 'smtp' && <p className="text-slate-400 text-xs leading-relaxed">Kết nối linh hoạt các bên thứ ba cung cấp dịch vụ gửi thư như Resend, SendGrid, Amazon SES hoặc Gmail App Password cá nhân chỉ trong vài thao tác.</p>}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.section>

      {/* 5. PRICING SECTIONS - Khối Card Kính lỏng phản chiếu */}
      <motion.section id="pricing" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-120px" }} variants={staggerContainer} className="max-w-6xl mx-auto px-6 py-24 text-center relative z-10">
        <motion.div variants={fadeInUp} className="space-y-3 mb-16">
          <div className="w-fit mx-auto bg-white/[0.02] border border-white/[0.06] text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md">Pricing</div>
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Quy mô không giới hạn</h2>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">Lựa chọn gói dịch vụ tối ưu, đồng hành cùng sự tăng trưởng doanh số của shop.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: 'Starter', price: '0', desc: 'Mọi công cụ cần thiết để bắt đầu.', features: ['Truy cập Core Dashboard', 'Nạp tối đa 1,000 Contacts', 'Báo cáo cơ bản ngầm'] },
            { title: 'Pro', price: '29', desc: 'Dành cho các chuỗi shop thực thụ.', features: ['Hàng đợi BullMQ ưu tiên', 'Nạp không giới hạn Contacts', 'Tải ảnh Cloudinary chuyên sâu', 'Cấu hình SMTP tùy biến'], active: true },
            { title: 'Scale', price: '149', desc: 'Dành cho doanh nghiệp tải lượng lớn.', features: ['Dedicated Worker Cluster', 'Cách ly hoàn toàn hạ tầng RAM', 'Hỗ trợ kỹ thuật cấu hình 24/7', 'Tùy biến Webhook độc bản'] }
          ].map((pkg, idx) => (
            <motion.div key={idx} variants={fadeInUp} whileHover={{ y: -8, transition: { duration: 0.2 } }} className={`bg-white/[0.02] border p-8 rounded-[32px] text-left flex flex-col justify-between transition-all duration-300 backdrop-blur-xl ${pkg.active ? 'border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500' : 'border-white/[0.05] hover:border-white/[0.15]'}`}>
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-black text-white uppercase">{pkg.title}</h4>
                  <p className="text-slate-500 text-xs mt-1">{pkg.desc}</p>
                </div>
                <div className="flex items-baseline text-white">
                  <span className="text-4xl font-black font-mono">${pkg.price}</span>
                  <span className="text-slate-500 text-xs ml-1">/ Tháng</span>
                </div>
                <div className="w-full h-px bg-white/[0.06]" />
                <ul className="space-y-3">
                  {pkg.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-300"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>{feat}</span></li>
                  ))}
                </ul>
              </div>
              <div className="pt-8"><Link to="/register" className={`w-full block text-center text-xs font-black uppercase tracking-widest py-3.5 rounded-xl transition-all ${pkg.active ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-[#070a08]' : 'bg-white/[0.02] border border-white/[0.05] text-slate-300 backdrop-blur-md hover:border-white/[0.15]'}`}>{pkg.price === '0' ? 'Trải nghiệm miễn phí' : 'Kích hoạt ngay'}</Link></div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 6. FAQ ACCORDION SECTION */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-24 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center space-y-3 mb-12">
          <div className="w-fit mx-auto bg-white/[0.02] border border-white/[0.06] text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md">FAQ</div>
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Giải đáp thắc mắc</h2>
        </motion.div>

        <div className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-[28px] p-4 space-y-2 shadow-2xl">
          {[
            { q: "Hệ thống Verdio bảo mật dữ liệu khách hàng như thế nào?", a: "Chúng tôi ứng dụng kiến trúc Multi-tenancy phân tách dữ liệu tuyệt đối. Tệp danh sách email khách hàng của từng doanh nghiệp được bảo vệ bằng lớp mã hóa riêng biệt, ngăn chặn hoàn toàn việc rò rỉ dữ liệu giữa các shop." },
            { q: "Làm thế nào để import danh sách hàng ngàn email khách hàng cùng lúc?", a: "Bạn chỉ cần xuất danh sách khách hàng từ file Excel sang định dạng đuôi mẫu .csv, sau đó vào phân hệ 'Khách hàng' trên Dashboard và bấm 'Nhập CSV'. Hệ thống xử lý luồng ghi hàng loạt (Bulk Write) sẽ nạp toàn bộ vào cơ sở dữ liệu chỉ sau vài giây." },
            { q: "Tại sao email gửi đi không bị rơi vào hộp thư rác (Spam)?", a: "Verdio sử dụng lõi hàng đợi ngầm BullMQ để giãn cách khoảng thời gian phát thư một cách thông minh, không gửi dồn dập cùng một thời điểm. Điều này giúp các nhà cung cấp dịch vụ email đánh giá cao độ tin cậy của tài khoản gửi thư của bạn." }
          ].map((faq, index) => (
            <div key={index} className="border border-white/[0.04] rounded-xl bg-white/[0.01] overflow-hidden backdrop-blur-md">
              <button onClick={() => toggleFaq(index)} className="w-full flex justify-between items-center p-4 text-left text-xs font-bold uppercase tracking-wider text-white hover:text-emerald-400 transition-colors cursor-pointer">
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${openFaq === index ? 'rotate-180 text-emerald-400' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {openFaq === index && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="border-t border-white/[0.04] bg-black/20"><p className="p-4 text-xs text-slate-400 leading-relaxed">{faq.a}</p></motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="w-full border-t border-white/[0.05] bg-[#060907] pt-16 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-8">
          <motion.div initial={{ scale: 0.96, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} className="bg-white/[0.01] border border-white/[0.05] backdrop-blur-xl w-full rounded-[32px] p-10 text-center space-y-4 shadow-xl">
            <h3 className="text-xl md:text-2xl font-black text-white uppercase">Sẵn sàng bứt phá doanh số?</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">Trải nghiệm hệ thống tự động hóa Marketing tinh tế, chuẩn xác và mượt mà ngay hôm nay.</p>
            <div className="pt-2"><button onClick={handleCtaClick} className="inline-flex bg-gradient-to-r from-emerald-500 to-teal-500 text-[#070a08] text-xs font-black uppercase tracking-widest px-6 py-3.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer">Khởi chạy miễn phí</button></div>
          </motion.div>
          <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-white/[0.05] text-slate-500 text-[11px] font-mono">
            <div className="flex items-center gap-2 text-white font-black text-xs font-sans tracking-wider">🌱 VERDIO</div>
            <div>Verdio Engine — Infinite marketing automation pipelines.</div>
            <div>© 2026 Verdio AI. All Rights Reserved.</div>
          </div>
        </div>
      </footer>
    </div>
    </motion.div>
  );
};

export default LandingPage;