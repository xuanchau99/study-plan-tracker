# STUDY PLAN TRACKER - FEATURE HIGHLIGHTS

Dự án này là một nền tảng quản lý lộ trình học tập cường độ cao, được thiết kế theo kiến trúc Modular Monolith nhằm giải quyết các bài toán về hiệu năng cao và xử lý đồng thời.

## I. Tính năng Nghiệp vụ Cốt lõi (Business Features)
1. **Template & Lộ trình Cá nhân hóa:**
    - Cho phép định nghĩa các khuôn mẫu học tập phức tạp (VD: Lộ trình 30 ngày luyện giao tiếp công việc dành cho người mất gốc, định mức 130 phút/ngày).
    - Tự động hóa việc phân bổ thời gian và sinh `DailyTask` dựa trên mục tiêu tổng thể.
2. **Real-time Progress Tracking (Theo dõi tiến độ thời gian thực):**
    - API Heartbeat cho phép client báo cáo thời gian học thực tế liên tục mà không gây quá tải hệ thống.
3. **Automated Notification (Nhắc nhở tự động):**
    - Đánh giá trạng thái hoàn thành mục tiêu hàng ngày và điều phối thông báo qua đa kênh (Email/Push).

## II. Giải pháp Kỹ thuật Nâng cao (Senior-Level Engineering)
- **High-Throughput Tracking với Redis:** Giải quyết bài toán "Write-heavy" (ghi dữ liệu liên tục) bằng cách dùng Redis làm In-memory Buffer hứng request, giảm 90% tải ghi trực tiếp lên PostgreSQL.
- **Kiến trúc Hướng sự kiện (Event-Driven):** Sử dụng RabbitMQ để decouple (tách rời) luồng xử lý chính (Cập nhật tiến độ) và luồng phụ (Gửi Email/Thông báo thành tích), giúp giảm độ trễ API xuống mức thấp nhất.
- **Bảo toàn Dữ liệu Đồng thời (Concurrency Control):** Áp dụng cơ chế Optimistic Locking (JPA `@Version`) để ngăn chặn lỗi Race Condition khi trạng thái task bị cập nhật từ nhiều thiết bị cùng lúc.
- **Tối ưu hóa Truy vấn:** Ngăn chặn triệt để bài toán N+1 Query trong Hibernate bằng cách áp dụng Entity Graphs, kết hợp lưu trữ metadata linh hoạt thông qua kiểu dữ liệu JSONB của PostgreSQL.