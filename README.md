# 🚀 Study Plan Tracker

## 🛠 Prerequisites (Yêu cầu hệ thống)
- Java 17+
- Docker & Docker Compose
- Gradle (Có thể dùng Gradle Wrapper đi kèm dự án)

## 📦 Local Setup (Cài đặt môi trường)

**1. Khởi động Hạ tầng (Infrastructure)**
Dự án yêu cầu PostgreSQL, Redis và RabbitMQ. Mở terminal tại thư mục gốc và chạy:
```bash
docker-compose up -d