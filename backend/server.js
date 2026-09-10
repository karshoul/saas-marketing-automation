import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// 1. Import cấu hình hạ tầng
import { env } from './src/config/env.js';
import { connectDB } from './src/config/database.js';
import { redis } from './src/config/redis.js';
import Plan from './src/models/Plan.js';
import { seedPlans } from './src/config/plans.config.js';
// 2. Import Worker & Queue Engine
import { initEmailWorker } from './src/queues/email.queue.js';
import workerScaler from './src/schedulers/worker.scaler.js';

// 3. Import Middlewares
import { globalErrorHandler } from './src/middleware/error.middleware.js';
import { globalRateLimiter } from './src/middleware/rateLimit.middleware.js';

// 4. Import Routes
import authRoutes from './src/routes/auth.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import contactRoutes from './src/routes/contact.routes.js';
import tenantRoutes from './src/routes/tenant.routes.js';
import campaignRoutes from './src/routes/campaign.routes.js';
import queueRouter from './src/routes/queue.routes.js'
import billingRouter from './src/routes/billing.routes.js';

const app = express();

// ==========================================
// 🛡️ MIDDLEWARES SETUP
// ==========================================

// Cấu hình CORS an toàn hỗ trợ gửi Cookie (credentials: true)
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Fingerprint']
  })
);

// Đọc cookie từ Request
app.use(cookieParser());

// Read JSON Payload & URL Encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Áp dụng Rate Limiting chung cho API
app.use('/api', globalRateLimiter);

// ==========================================
// 🛣️ ROUTES REGISTRATION
// ==========================================

// Endpoint Health Check hệ thống
app.get('/', (req, res) => {
  const scalerMetrics = workerScaler.getMetrics();

  res.status(200).json({
    success: true,
    message: '🚀 VERDIO Multi-Tenant SaaS Engine running smooth!',
    environment: env.nodeEnv,
    autoScaler: scalerMetrics,
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/queue', queueRouter)
app.use('/api/billing', billingRouter);

// Bẫy lỗi 404 Route Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `❌ Route [${req.method}] ${req.originalUrl} không tồn tại trên hệ thống.`
  });
});

// ==========================================
// 💥 GLOBAL ERROR HANDLER
// ==========================================
app.use(globalErrorHandler);

// ==========================================
// 🚀 BOOTSTRAP SERVER & ASYNC ENGINES
// ==========================================
let server;
let emailWorker;

const startServer = async () => {
  try {
    // 1. Kết nối MongoDB
    await connectDB();

    // Tự động seed nếu database chưa có gói cước
    const planCount = await Plan.countDocuments();
    if (planCount === 0) {
    console.log('🌱 [Auto-Seed]: Chưa có dữ liệu Plan, tiến hành tự động khởi tạo gói FREE/PRO/ENTERPRISE...');
    await seedPlans();
    }   

    // 2. Khởi tạo BullMQ Email Worker (Bắt đầu với mức tối thiểu 2 concurrency)
    emailWorker = initEmailWorker(2);
    console.log('⚙️ [BullMQ Engine]: Email Background Worker đã sẵn sàng nhận jobs.');

    //3. Khởi chạy Bộ điều phối tự động co giãn Worker (Min: 2, Max: 20, chu kỳ đo: 3s)
    workerScaler.init(emailWorker, {
      minConcurrency: 2,
      maxConcurrency: 20,
      checkIntervalMs: 3000
    });

    // 4. Khởi chạy Server Node.js
    const PORT = env.port || 5000;
    server = app.listen(PORT, () => {
      console.log(`\n==================================================`);
      console.log(`🚀 VERDIO Server is running on: http://localhost:${PORT}`);
      console.log(`🌐 Health Check Endpoint: http://localhost:${PORT}/`);
      console.log(`🔑 Auth Endpoint: http://localhost:${PORT}/api/auth`);
      console.log(`👥 Contacts Endpoint: http://localhost:${PORT}/api/contacts`);
      console.log(`📢 Campaigns Endpoint: http://localhost:${PORT}/api/campaigns`);
      console.log(`==================================================\n`);
    });
  } catch (error) {
    console.error('💥 Lỗi khởi động Server:', error.message);
    process.exit(1);
  }
};

// ==========================================
// 🛑 GRACEFUL SHUTDOWN HANDLER
// ==========================================
const shutdown = async (signal) => {
  console.log(`\n⚠️ [${signal}] Nhận tín hiệu dừng server. Đang giải phóng tài nguyên...`);

  // 1. Dừng vòng lặp Auto-scaler
  workerScaler.stop();

  // 2. Đóng HTTP Server
  if (server) {
    server.close(() => console.log('🛑 [HTTP Server]: Đã đóng tiếp nhận request mới.'));
  }

  // 3. Đóng Worker
  if (emailWorker) {
    await emailWorker.close();
    console.log('🛑 [BullMQ Worker]: Đã hoàn tất các jobs đang xử lý và đóng worker.');
  }

  // 4. Ngắt kết nối Redis
  if (redis) {
    await redis.quit();
    console.log('🛑 [Redis]: Đã ngắt kết nối an toàn.');
  }

  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();