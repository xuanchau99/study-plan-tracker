# Hoàn thiện Giao diện Web (Premium UI/UX)

Dự án đã chính thức được trang bị một hệ thống Frontend cực kỳ bắt mắt bằng **React + Vite**, kết hợp cùng bộ giao diện **Glassmorphism/Dark Mode** được code bằng Vanilla CSS, mang lại trải nghiệm 5 sao cho cả Admin và User.

## Thay đổi nổi bật (Changes Made)

1. **Cấu hình CORS ở Backend:** Bổ sung `CorsConfig.java` và chỉnh sửa `SecurityConfig.java` để cho phép origin `http://localhost:5173` gọi API an toàn.
2. **Setup Frontend React Vite:** Khởi tạo thư mục `frontend` và cài thêm thư viện `react-router-dom` cùng bộ icon `lucide-react` để giao diện trông "xịn" hơn.
3. **Phân quyền Route (Role-based Routing):**
   - Tự động điều hướng user dựa trên `role` lưu trong LocalStorage khi Login.
   - Tài khoản **ADMIN** được chuyển tới `AdminDashboard` (Trang quản lý).
   - Tài khoản **USER** được chuyển tới `UserDashboard` (Trang làm bài thi).
4. **Admin Dashboard - Bulk Generator:** 
   - Có form xịn xò để nhập số lượng câu hỏi.
   - Khi Submit, Frontend sẽ tự động sinh Mock Data bằng vòng lặp và gọi thẳng API `POST /api/v1/quizzes`. Đây là màn Demo hoàn hảo cho bài toán Stress Test hệ thống.
5. **User Dashboard & Take Quiz (Luồng làm bài trắc nghiệm siêu tốc):**
   - User có thể nhập ID bài thi để mở giao diện làm bài.
   - **Tính năng ăn tiền:** Khi user click chọn đáp án, Frontend bắn ngầm API `/answers` lưu thẳng xuống Redis mà không cần load trang. Animation siêu mượt.
   - Khi ấn "Submit Exam", API nộp bài bất đồng bộ qua RabbitMQ được gọi và người dùng lập tức nhận thông báo thành công.

## Hướng dẫn Trải nghiệm (Verification)

> [!IMPORTANT]  
> Hãy chắc chắn rằng bạn đã **TẮT** ứng dụng Spring Boot cũ ở Terminal bằng `Ctrl + C` trước khi làm tiếp các bước sau.

**Bước 1: Bật lại Backend (với cấu hình CORS mới nhất)**
Mở Terminal 1 ở thư mục gốc của dự án (`study-plan-tracker`):
```bash
./gradlew bootRun
```

**Bước 2: Khởi chạy Frontend**
Mở thêm **một Terminal số 2** và cd vào thư mục frontend để chạy React:
```bash
cd frontend
npm run dev
```

**Bước 3: Mở trình duyệt và Tận hưởng**
1. Truy cập vào đường link `http://localhost:5173`
2. Bạn sẽ lập tức thấy màn hình **Welcome Back** với nền gradient chuyển động mờ và bảng kính (glass-panel) rất sang trọng.
3. **Luồng Admin:** Đăng nhập tài khoản admin (Nếu chưa có thì tự Register rồi dùng tool DB đổi số `0` thành `1` ở cột role nhé). Bạn sẽ vào trang tạo hàng loạt đề thi ảo.
4. **Luồng User:** Đăng xuất, đăng nhập tài khoản User bình thường. Nhập ID `1` rồi tiến vào làm bài thử. Cảm nhận độ mượt khi hệ thống tự động gọi Auto-save ngầm không độ trễ.
