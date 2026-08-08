import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// 1. Import cấu hình hạ tầng
import { env } from './src/config/env.js';
import { connectDB } from './src/config/database.js';

// 2. Import Middlewares
import { globalErrorHandler } from './src/middleware/error.middleware.js';
import { globalRateLimiter } from './src/middleware/rateLimit.middleware.js';

// 3. Import Routes (Chỉ import các Route đã triển khai hoàn chỉnh ở Sprint 2)
import authRoutes from './src/routes/auth.routes.js';

const app = express();

// ==========================================
// 🛡️ MIDDLEWARES SETUP
// ==========================================

// Cấu hình CORS an toàn hỗ trợ gửi Cookie (credentials: true)
app.use(
  cors({
    origin: env.app.frontendUrl || 'http://localhost:3000',
    credentials: true, // BẮT BỘC: Cho phép gửi và nhận HttpOnly Cookie (Refresh Token)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Fingerprint']
  })
);

// Đọc cookie từ Request (Dùng cho Refresh Token & Logout)
app.use(cookieParser());

// Read JSON Payload & URL Encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Áp dụng Rate Limiting chung cho toàn bộ API
app.use('/api', globalRateLimiter);

// ==========================================
// 🛣️ ROUTES REGISTRATION
// ==========================================

// Endpoint Health Check hệ thống
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 VERDIO Multi-Tenant SaaS Engine running smooth!',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Dang ky Auth Routes (/api/auth/register, /login, /refresh-token, /logout, v.v...)
app.use('/api/auth', authRoutes);

// Bẫy lỗi 404 Route Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `❌ Route [${req.method}] ${req.originalUrl} không tồn tại trên hệ thống.`
  });
});

// ==========================================
// 💥 GLOBAL ERROR HANDLER (BẮT BỘC ĐẶT Ở CUỐI)
// ==========================================
app.use(globalErrorHandler);

// ==========================================
// 🚀 BOOTSTRAP SERVER & DATABASE
// ==========================================
const startServer = async () => {
  try {
    // 1. Kết nối MongoDB
    await connectDB();

    // 2. Khởi chạy Server Node.js
    const PORT = env.port || 5000;
    app.listen(PORT, () => {
      console.log(`\n==================================================`);
      console.log(`🚀 VERDIO Server is running on: http://localhost:${PORT}`);
      console.log(`🌐 Health Check Endpoint: http://localhost:${PORT}/`);
      console.log(`🔑 Auth Endpoint: http://localhost:${PORT}/api/auth`);
      console.log(`==================================================\n`);
    });
  } catch (error) {
    console.error('💥 Lỗi khởi động Server:', error.message);
    process.exit(1);
  }
};

startServer();