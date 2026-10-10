import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// 1. Cấu hình hạ tầng
import { env } from './src/config/env.js';
import { connectDB } from './src/config/database.js';
import { redis } from './src/config/redis.js';
import Plan from './src/models/Plan.js';
import { seedPlans } from './src/config/plans.config.js';

// 2. Import Worker & Queue Engines (Khởi tạo theo yêu cầu có kiểm soát)
import { initEmailWorker } from './src/queues/email.queue.js';
import { initAutomationWorker } from './src/queues/automation.queue.js';
import workerScaler from './src/schedulers/worker.scaler.js';

// 3. Middlewares
import { globalErrorHandler } from './src/middleware/error.middleware.js';
import { globalRateLimiter } from './src/middleware/rateLimit.middleware.js';

// 4. Routes
import authRoutes from './src/routes/auth.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import contactRoutes from './src/routes/contact.routes.js';
import templateRoutes from './src/routes/template.routes.js';
import automationRoutes from './src/routes/automation.routes.js';
import tenantRoutes from './src/routes/tenant.routes.js';
import campaignRoutes from './src/routes/campaign.routes.js';
import queueRouter from './src/routes/queue.routes.js';
import billingRouter from './src/routes/billing.routes.js';
import membershipRoutes from './src/routes/membership.routes.js';

const app = express();

// ==========================================
// 🛡️ MIDDLEWARES SETUP
// ==========================================
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://saas-marketing-automation-two.vercel.app'
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-workspace-id', 'X-Device-Fingerprint'],
    optionsSuccessStatus: 204
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', globalRateLimiter);

// ==========================================
// 🛣️ ROUTES REGISTRATION
// ==========================================
app.get('/', (req, res) => {
  const isWorkersEnabled = env.enableWorkers === 'true' || process.env.ENABLE_WORKERS === 'true';
  const scalerMetrics = workerScaler.getMetrics();

  res.status(200).json({
    success: true,
    message: '🚀 VERDIO Multi-Tenant SaaS Engine running smooth!',
    environment: env.nodeEnv,
    workersEnabled: isWorkersEnabled,
    autoScaler: isWorkersEnabled ? scalerMetrics : 'STANDBY (API-Only Mode)',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/queue', queueRouter);
app.use('/api/billing', billingRouter);
app.use('/api/memberships', membershipRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `❌ Route [${req.method}] ${req.originalUrl} không tồn tại trên hệ thống.`
  });
});

app.use(globalErrorHandler);

// ==========================================
// 🚀 BOOTSTRAP SERVER & ASYNC ENGINES
// ==========================================
let server;
let emailWorker;
let automationWorker;

const startServer = async () => {
  try {
    await connectDB();

    const planCount = await Plan.countDocuments();
    if (planCount === 0) {
      console.log('🌱 [Auto-Seed]: Chưa có dữ liệu Plan, khởi tạo gói FREE/PRO/ENTERPRISE...');
      await seedPlans();
    }

    // Kiểm tra cờ bật Worker qua cấu hình env hoặc biến môi trường trực tiếp
    const shouldEnableWorkers = env.enableWorkers === 'true' || process.env.ENABLE_WORKERS === 'true';

    if (shouldEnableWorkers) {
      console.log('⚙️ [Workers Hub]: Biến môi trường ENABLE_WORKERS được kích hoạt. Đang khởi chạy Workers...');

      // 1. Khởi tạo BullMQ Workers
      emailWorker = initEmailWorker(2);
      automationWorker = initAutomationWorker(2);

      // 2. Kích hoạt Elastic Auto-scaler giám sát Email Queue
      workerScaler.init(emailWorker, {
        minConcurrency: 2,
        maxConcurrency: 20,
        checkIntervalMs: 3000
      });
    } else {
      console.log('🛡️ [Workers Hub]: Chế độ API-Only. Background Workers & Auto-scaler đã được vô hiệu hóa để tiết kiệm Redis requests.');
    }

    const PORT = env.port || 5000;
    server = app.listen(PORT, () => {
      console.log(`\n==================================================`);
      console.log(`🚀 VERDIO Server is running on: http://localhost:${PORT}`);
      console.log(`🌐 Health Check: http://localhost:${PORT}/`);
      console.log(`⚡ Mode: ${shouldEnableWorkers ? 'API + Background Workers' : 'API Only'}`);
      console.log(`==================================================\n`);
    });
  } catch (error) {
    console.error('💥 Lỗi khởi động Server:', error.message);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`\n⚠️ [${signal}] Nhận tín hiệu dừng. Đang dọn tài nguyên...`);
  if (workerScaler) workerScaler.stop();
  if (server) server.close(() => console.log('🛑 [HTTP Server]: Đã đóng cổng nhận request.'));
  if (emailWorker) await emailWorker.close();
  if (automationWorker) await automationWorker.close();
  if (redis) await redis.quit();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();