import dotenv from 'dotenv';
import path from 'path';

// Nạp file .env từ thư mục gốc của backend
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const requiredEnvs = [
  'MONGO_URI',
  'REDIS_HOST',
  'REDIS_PORT',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET'
];

// Kiểm tra nghiêm ngặt sự tồn tại của các cấu hình bắt buộc trước khi booting hệ thống
for (const env of requiredEnvs) {
  if (!process.env[env]) {
    throw new Error(`❌ [Critical Config Error]: Biến môi trường ${env} bắt buộc nhưng chưa được cấu hình trong file .env`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  app: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  },
  
  // Database Configuration
  mongoUri: process.env.MONGO_URI,
  
  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  
  // Security Tokens (Access / Refresh Secrets)
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  },
  
  // Third-party Provider Integrations (Sẽ dùng cho các Sprint sau)
  resendApiKey: process.env.RESEND_API_KEY || '',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  }
};