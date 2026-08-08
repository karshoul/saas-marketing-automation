import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

// Component phụ điều phối luồng và khóa cứng nền tối sâu khi chuyển trang
const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    /* 
      Bọc toàn bộ Routes vào một thẻ div có nền #060907 cố định.
      Khi framer-motion kích hoạt hiệu ứng exit/blur, lớp nền phía sau hở ra 
      vẫn sẽ là màu đen ma trận chuẩn của VERDIO, loại bỏ hoàn toàn hiện tượng lóe màu cũ.
    */
    <div className="min-h-screen bg-[#060907] relative overflow-hidden selection:bg-emerald-600 selection:text-white">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;