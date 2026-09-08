# Hướng Dẫn Cài Đặt & Khởi Chạy Dự Án (Quiz System)

Dự án này là một hệ thống Trắc nghiệm hiệu năng cao (High-Performance Quiz System) áp dụng các kỹ thuật cao cấp chuẩn chuyên gia (Senior Level) được yêu cầu:
- Cấu trúc **MVC** chuẩn chỉ, bảo mật với **JWT (Stateless)**.
- Tối ưu Database với **Index**, **Lazy Loading**, chống N+1 Query với **@EntityGraph**, lưu cấu trúc động qua **JSONB**.
- Chống quá tải DB nhờ ghi nhận thao tác người dùng (Auto-save) trên **Redis Hash**.
- Chấm điểm bất đồng bộ siêu tốc qua Message Broker **RabbitMQ**.

Dưới đây là các hướng dẫn step-by-step để bạn có thể test và nghiệm thu toàn bộ 4 Feature lớn.

---

## Bước 1: Khởi động Môi trường Hạ tầng (Docker)

Hệ thống sử dụng Docker Compose để tự động dựng **PostgreSQL**, **Redis** và **RabbitMQ**.

1. Mở Terminal tại thư mục gốc của dự án.
2. Xóa các volume cũ (nếu có) và khởi động lại hạ tầng hoàn toàn mới:
```bash
docker-compose down -v
docker-compose up -d
```
3. Đợi khoảng 10 giây để các container chuyển sang trạng thái sẵn sàng (Running).

---

## Bước 2: Khởi chạy Ứng dụng Spring Boot

1. Chạy lệnh Gradle để biên dịch và khởi động Server (Chạy ở Terminal khác để giữ app):
```bash
./gradlew bootRun
```
> **Lưu ý:** Nếu Terminal cũ của bạn đang chạy app, hãy ấn `Ctrl + C` để dừng trước khi chạy lại. Hibernate sẽ tự động tạo cấu trúc các bảng (`users`, `quizzes`, `questions`, `exam_results`) với đầy đủ Index và JSONB type trong Database `quiz_db`.

---

## Bước 3: Hướng dẫn Test Nghiệm thu Tính Năng

Bạn có thể sử dụng Postman hoặc copy các lệnh Terminal (cURL) sau để test trực tiếp.

### 3.1. Feature 1: Đăng ký & Đăng nhập (JWT Security)

**Đăng ký tài khoản mới:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
-H "Content-Type: application/json" \
-d '{"username":"admin_test", "password":"123456"}'
```

**Đăng nhập lấy Token:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
-H "Content-Type: application/json" \
-d '{"username":"admin_test", "password":"123456"}'
```
> Copy chuỗi `jwtToken` trả về để thay vào các lệnh bên dưới (ký hiệu là `<YOUR_TOKEN>`).

*Mẹo cấp quyền ADMIN: Để tạo đề thi ở bước sau, bạn hãy dùng pgAdmin hoặc DBeaver vào Database `quiz_db`, mở bảng `users`, đổi giá trị cột `role` của user vừa tạo từ `0` (USER) thành `1` (ADMIN).*

---

### 3.2. Feature 2: Tạo Đề thi & Tối ưu Database (JSONB)

Gửi yêu cầu tạo đề thi với 1 câu hỏi có chứa cấu trúc linh hoạt (JSONB `details`). Nhớ dùng token có quyền ADMIN:

```bash
curl -X POST http://localhost:8080/api/v1/quizzes \
-H "Authorization: Bearer <YOUR_TOKEN>" \
-H "Content-Type: application/json" \
-d '{
  "title": "Unit 1: Business English",
  "description": "Vocabulary for daily meetings",
  "questions": [
    {
      "details": {
        "imageUrl": "https://example.com/spooky.png",
        "options": ["Scary", "Funny", "Boring", "Spooky"],
        "keyword": "SPOOKY"
      },
      "type": "MULTIPLE_CHOICE",
      "correctAnswer": "Spooky"
    }
  ]
}'
```

**Kiểm tra hiệu năng chống N+1 Query:**
```bash
curl -X GET http://localhost:8080/api/v1/quizzes/1 \
-H "Authorization: Bearer <YOUR_TOKEN>"
```
=> **Quan sát log Terminal của Spring Boot**, bạn sẽ thấy Hibernate dùng một câu lệnh `SELECT` kết hợp `JOIN FETCH` duy nhất để kéo dữ liệu đề thi lẫn câu hỏi, hoàn toàn giải quyết lỗi N+1 Query kinh điển.

---

### 3.3. Feature 3: Auto-save Tiến độ Thi (Redis In-Memory)

Ghi nhận nhanh đáp án mà thí sinh đang tick. Giao dịch này siêu nhanh và không chạm vào DB.
*(Giả sử id đề thi là 1, id câu hỏi là 1)*
```bash
curl -X POST http://localhost:8080/api/v1/exams/1/questions/1/answers \
-H "Authorization: Bearer <YOUR_TOKEN>" \
-H "Content-Type: application/json" \
-d '{"answer": "Spooky"}'
```
=> **Bạn sẽ không thấy log câu lệnh SQL UPDATE nào**, thao tác này ghi thẳng lên RAM của Redis bằng HashOps để tiết kiệm tài nguyên I/O ổ cứng.

---

### 3.4. Feature 4: Nộp bài (RabbitMQ Async Grading)

Chốt sổ và nộp bài, đẩy event qua hàng chờ (Message Queue) để xử lý ngầm. Thêm tham số `-i` vào cURL để hiển thị Header kết quả trả về.
```bash
curl -i -X POST http://localhost:8080/api/v1/exams/1/submit \
-H "Authorization: Bearer <YOUR_TOKEN>"
```
=> **Hệ thống sẽ trả về ngay lập tức mã `HTTP/1.1 202 Accepted`** dù cho đề thi có hàng ngàn câu hỏi.

**Nghiệm thu chấm điểm:**
Mở CSDL PostgreSQL lên, kiểm tra bảng `exam_results` (`SELECT * FROM exam_results`). Hệ thống Consumer ngầm của RabbitMQ đã tự động kéo đáp án từ Redis, so sánh với đáp án chuẩn, và lưu thành công kết quả thi của bạn (vd: `score: 1`). Xóa rác trên Redis ngay sau đó.
