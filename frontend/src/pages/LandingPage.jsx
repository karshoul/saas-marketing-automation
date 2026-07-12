import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, Layers, MailCheck, ShieldCheck, Terminal as TermIcon, Cpu, Activity } from 'lucide-react';

const LandingPage = () => {
  const [currentBanner, setCurrentBanner] = useState(0);

  const banners = [
    {
      title: "Hạ tầng gửi nhận bất đồng bộ",
      tech: "BULLMQ + REDIS STACK",
      description: "Tách biệt hoàn toàn luồng gửi Mail ngầm ra khỏi tiến trình chính. Hệ thống chịu tải hàng triệu gói tin cùng lúc mà không làm tăng tài nguyên CPU lõi.",
      icon: <Layers className="w-6 h-6 text-blue-400" />,
    },
    {
      title: "Đồng bộ Webhook tracking tuyệt đối",
      tech: "RESEND WEBHOOK ENGINE",
      description: "Bắt trọn khoảnh khắc khách hàng click liên kết từ Gmail. Phản hồi số liệu, cập nhật trạng thái chiến dịch về MongoDB với độ trễ dưới 12ms.",
      icon: <MailCheck className="w-6 h-6 text-emerald-400" />,
    },
    {
      title: "Kiến trúc Multi-tenancy độc lập",
      tech: "JWT MULTI-LAYER ISOLATION",
      description: "Cô lập dữ liệu khách hàng nghiêm ngặt theo mã định danh doanh nghiệp. Đảm bảo an toàn thông tin, chống rò rỉ chéo dữ liệu giữa các phân hệ cửa hàng.",
      icon: <ShieldCheck className="w-6 h-6 text-purple-400" />,
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-950 text-gray-200 font-sans antialiased relative selection:bg-blue-600 selection:text-white overflow-x-hidden"
    >
      {/* 🔮 SPATIAL GRID BACKGROUND - Lớp lưới không gian tạo chiều sâu */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* Navbar */}
      <nav className="border-b border-gray-900/60 bg-gray-950/60 backdrop-blur-xl sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-lg font-black tracking-widest text-white">
            MARKET<span className="text-blue-500 font-light">FLOW</span>
          </div>
          <div className="flex items-center gap-8">
            <Link to="/login" className="text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-white transition-colors">Đăng nhập</Link>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link to="/register" className="bg-white text-black text-xs font-black uppercase tracking-widest px-6 py-3 rounded-none hover:bg-gray-200 transition-all shadow-xl shadow-white/5">Khởi đầu</Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-28 pb-20 text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none border border-gray-800 bg-gray-900/40 text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" /> Build v1.0.4 // Dev Console Active
        </motion.div>
        
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white leading-[0.9] uppercase mb-8">
          Automate <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-blue-400 to-gray-500">Track Control</span>
        </h1>
        
        <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto mb-12 font-mono leading-relaxed">
          [system-info]: Vận hành chiến dịch email tự động hóa cấu trúc đa doanh nghiệp. Đảm bảo toàn vẹn dữ liệu, tối ưu hóa tỷ lệ chuyển đổi dựa trên luồng phản hồi tức thời.
        </p>
        
        <div className="flex justify-center">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link to="/register" className="bg-blue-600 text-white text-xs font-black uppercase tracking-widest px-8 py-4 transition-all flex items-center gap-3 group border border-blue-500 shadow-lg shadow-blue-600/20">
              Khởi chạy Console <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 🏃‍♂️ RUNNING TEXT MARQUEE - Hiệu ứng dòng chữ chạy vô tận */}
      <div className="w-full bg-gray-900/40 border-y border-gray-900 py-4 overflow-hidden mb-24 select-none relative z-10">
        <div className="flex whitespace-nowrap gap-16 animate-[marquee_25s_linear_infinite] font-mono text-xs uppercase tracking-widest text-gray-600">
          <span>// MULTI-TENANCY ISOLATION APPROVED</span>
          <span>•</span>
          <span>BULLMQ QUEUE BURST MODE ACTIVE</span>
          <span>•</span>
          <span>RESEND API STATUS 200 OK</span>
          <span>•</span>
          <span>WEBHOOK LATENCY &lt; 12MS</span>
          <span>•</span>
          <span>MONGODB ATLAS TUNED</span>
          <span>// MULTI-TENANCY ISOLATION APPROVED</span>
        </div>
      </div>

      {/* Feature Banner Section - Trượt Không Gian */}
      <section className="max-w-4xl mx-auto px-6 mb-28 relative z-10">
        <div className="bg-gray-900/20 border border-gray-900/80 rounded-none p-8 md:p-12 min-h-[280px] flex flex-col justify-between relative shadow-2xl backdrop-blur-md">
          {/* Góc thiết kế kỹ thuật kiểu Techwear */}
          <div className="absolute top-0 right-0 border-b border-l border-gray-800 px-3 py-1 font-mono text-[9px] text-gray-600">SYS_MODULE // 0{currentBanner + 1}</div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentBanner}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gray-950 border border-gray-800 rounded-none w-fit">
                  {banners[currentBanner].icon}
                </div>
                <div>
                  <div className="font-mono text-[10px] tracking-widest text-blue-500 font-bold">{banners[currentBanner].tech}</div>
                  <h3 className="text-xl font-black text-white uppercase mt-0.5">{banners[currentBanner].title}</h3>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-2xl font-light">{banners[currentBanner].description}</p>
            </motion.div>
          </AnimatePresence>
          
          <div className="flex gap-2 mt-8 md:mt-0 justify-end">
            {banners.map((_, idx) => (
              <button 
                key={idx} 
                onClick={() => setCurrentBanner(idx)}
                className={`h-1 transition-all ${currentBanner === idx ? 'bg-blue-500 w-8' : 'bg-gray-800 w-4'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Bố cục lưới bất đối xứng (Editorial) giới thiệu kiến trúc lõi */}
      <section className="max-w-7xl mx-auto px-6 pb-32 relative z-10">
        <div className="grid md:grid-cols-3 gap-px bg-gray-900/60 border border-gray-900">
          <div className="p-8 bg-gray-950 space-y-4">
            <div className="text-blue-500"><TermIcon className="w-5 h-5" /></div>
            <h4 className="text-lg font-bold text-white uppercase font-mono tracking-wide ">01 / Kernel Terminal</h4>
            <p className="text-gray-500 text-xs leading-relaxed font-light">Giao diện điều khiển tinh gọn, tối giản hóa mọi thao tác cấu hình phức tạp. Quản lý chiến dịch bằng luồng tư duy mạch lạc.</p>
          </div>
          <div className="p-8 bg-gray-950 space-y-4">
            <div className="text-emerald-500"><Cpu className="w-5 h-5" /></div>
            <h4 className="text-lg font-bold text-white uppercase font-mono tracking-wide ">02 / Async Process</h4>
            <p className="text-gray-500 text-xs leading-relaxed font-light">Hàng đợi nền cô lập hoàn toàn lỗi phát sinh. Khi một email lỗi, hàng đợi tự động tính toán cơ chế retry ngầm thông minh.</p>
          </div>
          <div className="p-8 bg-gray-950 space-y-4">
            <div className="text-purple-500"><Activity className="w-5 h-5" /></div>
            <h4 className="text-lg font-bold text-white uppercase font-mono tracking-wide">03 / Pulse Telemetry</h4>
            <p className="text-gray-500 text-xs leading-relaxed font-light">Mọi lượt click của người nhận được phân tích, bóc tách cấu trúc link và nạp thẳng vào biểu đồ trực quan hóa dữ liệu tức thì.</p>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default LandingPage;