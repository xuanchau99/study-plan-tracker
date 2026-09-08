# Hướng Dẫn Khởi Chạy Dự Án

Tài liệu này sẽ hướng dẫn bạn các bước cần thiết để thiết lập và chạy Hệ Thống Trắc Nghiệm Hiệu Suất Cao trên máy tính cá nhân.

## Yêu Cầu Cài Đặt (Prerequisites)
- **Docker & Docker Compose**: Đã cài đặt và đang chạy trên máy.
- **Java 17+**: Đã cài đặt và cấu hình biến môi trường.
- **Node.js 18+**: Đã cài đặt và cấu hình.

---

## Bước 1: Khởi Động Cơ Sở Hạ Tầng (Database, Cache, Message Broker)
Hệ thống sử dụng PostgreSQL, Redis, và RabbitMQ. Chúng ta dùng Docker Compose để khởi động tất cả ngay lập tức.

1. Mở terminal tại thư mục gốc của dự án.
2. Chạy lệnh sau:
   ```bash
   docker-compose up -d
   ```
3. Đợi vài giây để tất cả các container (`quiz-postgres`, `quiz-redis`, `quiz-rabbitmq`) báo trạng thái là **Started** hoặc **Healthy**.

---

## Bước 2: Khởi Động Backend (Spring Boot)
1. Mở một **terminal mới** tại thư mục gốc của dự án.
2. Chạy ứng dụng Spring Boot bằng Gradle:
   ```bash
   # Trên Windows:
   ./gradlew bootRun
   
   # Trên Mac/Linux:
   ./gradlew bootRun
   ```
3. Server sẽ khởi động và chạy tại `http://localhost:8080`. Lưu ý rằng Hibernate sẽ tự động tạo các bảng trong cơ sở dữ liệu cho bạn.

---

## Bước 3: Khởi Động Frontend (React + Vite)
1. Mở một **terminal mới** và di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```
2. Cài đặt các thư viện phụ thuộc (nếu bạn chưa cài):
   ```bash
   npm install
   ```
3. Khởi động server phát triển:
   ```bash
   npm run dev
   ```
4. Ứng dụng React sẽ có thể truy cập tại `http://localhost:5173`.

---

## Bước 4: Truy Cập và Sử Dụng
1. Mở trình duyệt và truy cập `http://localhost:5173`.
2. **Đăng Ký Tài Khoản:** Bấm vào "Register" và tạo một tài khoản mới (ví dụ: username: `admin`, password: `password`).
3. **Quyền Quản Trị Viên (Admin):** Mặc định, người dùng mới sẽ có vai trò `USER`. Để thử nghiệm tính năng Admin:
   - Kết nối vào cơ sở dữ liệu PostgreSQL cục bộ của bạn (URL: `jdbc:postgresql://localhost:5433/quiz_db`, User: `postgres`, Password: `postgres`).
   - Mở bảng `users` và sửa cột `role` từ `0` thành `1` (tương ứng với `ADMIN`).
   - Đăng nhập lại để truy cập **Admin Dashboard**.
4. **Tạo Dữ Liệu:** Với tư cách Admin, sử dụng tab "Quizzes" để tạo hàng loạt bài thi mẫu.
5. **Làm Bài Thi:** Đăng nhập lại bằng tài khoản User bình thường để làm bài thi mẫu và trải nghiệm tính năng lưu tự động siêu nhanh cùng hệ thống chấm điểm bất đồng bộ!
