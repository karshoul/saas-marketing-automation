# 🚀 VERDIO - Multi-Tenant SaaS Marketing Automation Platform

Nền tảng tự động hóa tiếp thị đa người thuê (Multi-Tenant SaaS), hỗ trợ phân phối chiến dịch email quy mô lớn qua hàng đợi phi đồng bộ với cơ chế tự động co giãn luồng (Adaptive Concurrency).

---

## 🛠️ Tech Stack & Kiến trúc

| Thành phần | Công nghệ | Vai trò |
| :--- | :--- | :--- |
| **Frontend** | ReactJS, Tailwind CSS, Vite | Giao diện điều khiển (Console/Dashboard) |
| **Web Server** | Nginx (Alpine) | Reverse proxy & phục vụ static files Frontend |
| **Backend** | Node.js, Express.js (ESM) | RESTful API Server & BullMQ Worker Engine |
| **Queue / Cache** | Redis 7 (Alpine), BullMQ | Điều phối hàng đợi job email & Rate limiting |
| **Database** | MongoDB Atlas (Mongoose) | Lưu trữ phân vùng Multi-tenant (Tenants, Users, Campaigns, Contacts, Plans) |
| **Containerization** | Docker, Docker Compose | Đóng gói toàn bộ hạ tầng 3 container cô lập |

---

## 📋 Yêu cầu hệ thống

* **Docker Desktop** (bật WSL 2 backend trên Windows)
* **Node.js** v20+ (nếu muốn chạy dev cục bộ)
* Cụm cơ sở dữ liệu **MongoDB Atlas** (đã whitelist IP)

---

## ⚙️ Cài đặt & Khởi chạy nhanh (Docker Compose)

### 1. Cấu hình biến môi trường
Tạo file `.env` tại thư mục gốc của dự án (ngang hàng với `docker-compose.yml`):

\`\`\`env
# MongoDB Atlas Connection
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/verdio_saas?retryWrites=true&w=majority

# Cổng dịch vụ
PORT=5000
NODE_ENV=production

# Redis nội bộ Docker
REDIS_HOST=redis
REDIS_PORT=6379

# Xác thực & Bảo mật
JWT_SECRET=your_super_secret_jwt_key
\`\`\`

### 2. Khởi chạy toàn bộ hạ tầng
Chạy lệnh duy nhất để build và kích hoạt 3 container:

\`\`\`bash
docker compose up -d --build
\`\`\`

### 3. Nạp dữ liệu khởi tạo (Seeding Plans)
Sau khi cụm container đã chạy, nạp dữ liệu mẫu cho các gói cước (`FREE`, `PRO`, `ENTERPRISE`):

\`\`\`bash
docker exec -it verdio-backend npm run seed
\`\`\`

---

## 🌐 Danh sách Cổng truy cập Dịch vụ

* **Frontend Portal:** `http://localhost:3000`
* **Backend API Base:** `http://localhost:5000`
* **Health Check API:** `http://localhost:5000/`
* **Redis Server:** `localhost:6379`

---

## 🧪 Các Endpoint API chính

* **Auth:** `POST /api/auth/register`, `POST /api/auth/login`
* **Campaigns:** `POST /api/campaigns`, `GET /api/campaigns`
* **Contacts:** `POST /api/contacts/import`, `GET /api/contacts`
* **Queue Telemetry:** `GET /api/queue/metrics`

---

## 🛑 Dừng hệ thống

\`\`\`bash
# Tắt container nhưng giữ nguyên dữ liệu Redis volume
docker compose down

# Tắt và xóa sạch volume dữ liệu tạm
docker compose down -v
\`\`\`