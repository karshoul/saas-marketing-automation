import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import { emailQueue } from './config/queue.js';
import emailWorker from './workers/emailWorker.js';
import tenantRoutes from './routes/tenantRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';

import db from './models/index.js';

// 1. Cấu hình đọc các biến môi trường từ file .env
dotenv.config();

const app = express();

// 2. Cấu hình các Middleware cơ bản
app.use(cors()); // Cho phép Frontend (ReactJS) gọi API tới Backend mà không bị chặn
app.use(express.json()); // Bắt buộc phải có để Backend đọc được dữ liệu JSON (req.body) gửi lên
app.use(express.urlencoded({ extended: true })); // Để xử lý dữ liệu từ form hoặc webhook sau này

app.use('/api/tenants', tenantRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/webhooks', webhookRoutes);

// 3. Định nghĩa một Endpoint (Route) kiểm tra ban đầu
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'Success',
    message: 'Nền tảng SaaS Marketing Automation Backend đang chạy mượt mà!' 
  });
});

// 4. Cấu hình kết nối Cơ sở dữ liệu MongoDB (Compass Local)
const PORT = process.env.PORT || 5000;

// Sử dụng biến MONGO_URI đã cấu hình ở bước trước (mongodb://127.0.0.1:27017/saas_marketing)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Kết nối cơ sở dữ liệu MongoDB thông qua Compass thành công!');
    
    // 5. Chỉ khi kết nối Database thành công, mới chính thức khởi động Server Node.js
    app.listen(PORT, () => {
      console.log(`🚀 Server của Khương đang chạy tại: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Lỗi kết nối cơ sở dữ liệu MongoDB:', err.message);
  });