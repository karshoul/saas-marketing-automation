import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { redis } from './config/redis.js';
import { initEmailWorker } from './queues/email.queue.js';

// Import Routes
import authRoutes from './routes/auth.routes.js';
import contactRoutes from './routes/contact.routes.js';
import campaignRoutes from './routes/campaign.routes.js';

const app = express();

// ==========================================
// 1. CẤU HÌNH CORS TOÀN DIỆN CHO VERCEL & LOCAL
// ==========================================
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://saas-marketing-automation-two.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Cho phép requests từ Postman/server-to-server (không có origin)
    // Hoặc nằm trong danh sách allowedOrigins
    // Hoặc bất kỳ sub-domain preview nào từ Vercel (*.vercel.app)
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-workspace-id',
    'X-Device-Fingerprint'
  ],
  optionsSuccessStatus: 204
};

// Đặt CORS trước toàn bộ middleware và routes khác
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ==========================================
// 2. PARSERS MIDDLEWARES
// ==========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ==========================================
// 3. HEALTH CHECK ENDPOINT
// ==========================================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 VERDIO Multi-Tenant SaaS Engine running smooth!',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 4. API ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/campaigns', campaignRoutes);

// ==========================================
// 5. GLOBAL ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  console.error('❌ [Unhandled Server Error]:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi hệ thống nội bộ'
  });
});

// ==========================================
// 6. KHỞI TẠO SERVICES VÀ START SERVER
// ==========================================
const PORT = process.env.PORT || 10000;

const startServer = async () => {
  try {
    // Kết nối MongoDB Atlas
    const mongoUri = process.env.MONGO_URI || env.mongoUri;
    await mongoose.connect(mongoUri);
    console.log('🔗 [MongoDB Connection]: Kết nối cơ sở dữ liệu MongoDB thành công!');

    // Khởi tạo BullMQ Background Worker
    initEmailWorker();
    console.log('⚙️ [BullMQ Engine]: Email Background Worker đã sẵn sàng nhận jobs.');

    // Bắt đầu lắng nghe requests
    app.listen(PORT, '0.0.0.0', () => {
      console.log('==================================================');
      console.log(`🚀 VERDIO Server is running on: http://localhost:${PORT}`);
      console.log(`🌐 Health Check Endpoint: http://localhost:${PORT}/`);
      console.log(`🔑 Auth Endpoint: http://localhost:${PORT}/api/auth`);
      console.log(`👥 Contacts Endpoint: http://localhost:${PORT}/api/contacts`);
      console.log(`📢 Campaigns Endpoint: http://localhost:${PORT}/api/campaigns`);
      console.log('==================================================');
    });
  } catch (error) {
    console.error('❌ Không thể khởi động server:', error.message);
    process.exit(1);
  }
};

startServer();