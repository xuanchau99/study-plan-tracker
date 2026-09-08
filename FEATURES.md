# HỆ THỐNG TRẮC NGHIỆM HIỆU SUẤT CAO

Dự án này là một nền tảng thi và trắc nghiệm hiện đại, hiệu suất cao, được xây dựng với kiến trúc có khả năng mở rộng tốt để xử lý lưu lượng truy cập lớn và người dùng đồng thời.

## 🚀 Công Nghệ & Kiến Trúc Cốt Lõi
- **Frontend**: React + Vite + CSS thuần (Giao diện Glassmorphism & Chế độ tối).
- **Backend**: Spring Boot 3 + Spring Security (JWT Stateless).
- **Cơ Sở Dữ Liệu Chính**: PostgreSQL (Sử dụng `JSONB` để lưu trữ dữ liệu linh hoạt).
- **Bộ Nhớ Đệm & Xử Lý Đồng Thời**: Redis (Sử dụng để lưu tự động các câu trả lời với tốc độ siêu nhanh và độ trễ thấp).
- **Message Broker**: RabbitMQ (Sử dụng cho hệ thống chấm điểm bất đồng bộ dựa trên sự kiện, giúp ngăn chặn nghẽn cơ sở dữ liệu khi có lượng lớn bài thi được nộp cùng lúc).
- **Cơ Sở Hạ Tầng**: Docker & Docker Compose để triển khai cục bộ nhanh chóng các dịch vụ (Redis, RabbitMQ, PostgreSQL).

## ✨ Tính Năng Nổi Bật
1. **Giao Diện Người Dùng Cao Cấp**: 
   - Thiết kế glassmorphism đẹp mắt, thân thiện với mọi thiết bị (responsive).
   - Hiệu ứng chuyển động mượt mà và phản hồi tương tác theo thời gian thực.
2. **Xác Thực Bảo Mật**: 
   - Kiểm soát truy cập dựa trên vai trò (Quản trị viên và Người dùng).
   - Token JWT bảo mật, không lưu trạng thái (stateless), tự động đăng xuất khi hết hạn.
3. **Quản Lý Bài Thi Nâng Cao (Quản trị viên)**: 
   - Tạo hàng loạt bài thi và câu hỏi mẫu.
   - Lưu trữ dữ liệu động sử dụng `JSONB` của PostgreSQL để lưu các loại câu hỏi khác nhau (hình ảnh, tùy chọn, văn bản) mà không cần thay đổi cấu trúc cơ sở dữ liệu.
4. **Lưu Tự Động Theo Thời Gian Thực (Người dùng)**: 
   - Câu trả lời được đẩy vào Redis Hash với độ phức tạp `O(1)` ngay khi người dùng chọn, đảm bảo không mất dữ liệu khi cúp điện mà không cần ghi liên tục vào cơ sở dữ liệu trên ổ cứng.
5. **Hệ Thống Chấm Điểm Dựa Trên Sự Kiện**: 
   - Khi người dùng nộp bài, yêu cầu chấm điểm được đưa vào hàng đợi RabbitMQ.
   - Consumer ở backend sẽ lấy câu trả lời từ Redis, chấm điểm dựa trên dữ liệu từ PostgreSQL, lưu `ExamResult` (kết quả thi), và trả về bằng chứng chi tiết của bài làm.
6. **Kiểm Tra Lịch Sử Chi Tiết**: 
   - Quản trị viên có thể xem bằng chứng chi tiết bài làm của người dùng trong một hộp thoại (modal) tương tác, làm nổi bật câu trả lời đúng và đáp án người dùng đã chọn.