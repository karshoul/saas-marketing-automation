# Giai đoạn 1: Build React Production Assets
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Giai đoạn 2: Nginx Web Server chạy siêu nhẹ
FROM nginx:alpine

# Copy cấu hình Nginx tùy biến
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts từ giai đoạn 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]