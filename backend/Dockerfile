# Sử dụng Node.js LTS bản Alpine gọn nhẹ
FROM node:20-alpine AS base

WORKDIR /app

# Copy package files để tận dụng Docker cache layer
COPY package*.json ./

# Cài đặt dependencies môi trường production
RUN npm ci --omit=dev

# Copy toàn bộ mã nguồn backend
COPY . .

# Expose cổng API nội bộ
EXPOSE 5000

# Khởi chạy server
CMD ["node", "server.js"]