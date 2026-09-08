# Luồng Xử Lý & Các Tính Năng Hệ Thống

Tài liệu này trình bày chi tiết các tính năng cốt lõi của Hệ Thống Trắc Nghiệm Hiệu Suất Cao và theo dõi luồng xử lý từ Frontend tới các thành phần Backend.

## 1. Xác Thực & Phân Quyền Theo Vai Trò (RBAC)
**Mô tả:** Hệ thống sử dụng xác thực JWT (JSON Web Token) không lưu trạng thái (stateless). Người dùng có thể đăng ký và đăng nhập. Quản trị viên (Admin) có quyền truy cập vào các trang quản lý, trong khi người dùng bình thường chỉ có quyền làm bài thi.
**Luồng xử lý:**
- **Frontend:**
  - Component: `frontend/src/pages/Login.jsx`
  - Luồng: Người dùng nhập thông tin -> gọi API `fetchApi('/auth/login')` hoặc `/auth/register`.
  - Trạng thái: Khi thành công, lưu `token`, `role` (vai trò), và `username` vào `localStorage` và cập nhật state toàn cục `user` trong `App.jsx`.
- **Backend:**
  - Controller: `AuthController.java` (`/api/v1/auth/login`, `/api/v1/auth/register`)
  - Service: `AuthService.java` (mã hóa mật khẩu, xác minh danh tính).
  - Security/Token: `JwtUtil.java` (tạo mã JWT có hiệu lực 24 giờ).
  - Interceptor: `JwtAuthenticationFilter.java` chặn mọi yêu cầu cần bảo mật, trích xuất JWT và xác thực nó qua `CustomUserDetailsService.java`.

**Sơ đồ luồng:**
```mermaid
flowchart TD
    User(("fa:fa-user Người dùng"))

    subgraph Client ["fa:fa-desktop Frontend React"]
        UI["Login.jsx"]
    end

    subgraph API ["fa:fa-server Backend Spring Boot"]
        Controller{"AuthController.java"}
        Service["AuthService.java"]
        JWT["JwtUtil.java"]
    end

    subgraph Data ["fa:fa-database Hệ Cơ Sở Dữ Liệu"]
        DB[("fa:fa-database PostgreSQL")]
    end

    User -->|"Nhập User/Pass"| UI
    UI -->|"POST /api/v1/auth/login"| Controller
    Controller -->|"Xử lý logic"| Service
    Service -->|"Truy vấn User"| DB
    DB -.->|"Trả về Data"| Service
    Service <-->|"Tạo và Ký Token"| JWT
    Service -.->|"AuthResponse Token"| Controller
    Controller -.->|"200 OK"| UI
    UI -->|"Lưu LocalStorage"| Client
```

## 2. Tạo Bài Thi Hàng Loạt
**Mô tả:** Quản trị viên có thể tạo nhiều bài thi và câu hỏi cùng lúc. Backend tận dụng kiểu dữ liệu JSONB của PostgreSQL để lưu trữ động nhiều câu hỏi và lựa chọn mà không bị giới hạn cứng bởi cấu trúc bảng.
**Luồng xử lý:**
- **Frontend:**
  - Component: `frontend/src/pages/AdminDashboard.jsx` (Tab Quizzes)
  - Luồng: Admin nhập số lượng câu hỏi -> sinh dữ liệu mẫu thành JSON -> gọi `fetchApi('/quizzes')`.
- **Backend:**
  - Controller: `QuizController.java` (`/api/v1/quizzes`)
  - Service: `QuizService.java` (duyệt qua payload, khởi tạo các entity `Quiz` và `Question`).
  - Entity/DB: Trường `details` trong `Question.java` dùng `@JdbcTypeCode(SqlTypes.JSON)` để lưu trữ trực tiếp cấu trúc đáp án và câu hỏi dưới dạng JSONB trong PostgreSQL.
  - Repository: `QuizRepository.java` lưu dữ liệu có cấu trúc lồng nhau này một cách tối ưu.

**Sơ đồ luồng:**
```mermaid
flowchart TD
    Admin(("fa:fa-user-tie Admin"))

    subgraph Client ["fa:fa-desktop Frontend React"]
        UI["AdminDashboard.jsx"]
    end

    subgraph API ["fa:fa-server Backend Spring Boot"]
        Controller{"QuizController.java"}
        Service["QuizService.java"]
        Repo["QuizRepository.java"]
    end

    subgraph Data ["fa:fa-database Hệ Cơ Sở Dữ Liệu"]
        DB[("fa:fa-database PostgreSQL JSONB")]
    end

    Admin -->|"Nhập số lượng & Bấm Tạo"| UI
    UI -->|"Sinh mảng JSON mẫu"| UI
    UI -->|"POST /api/v1/quizzes"| Controller
    Controller -->|"createQuiz"| Service
    Service -->|"Khởi tạo Entities"| Repo
    Repo -->|"Lưu Quiz và Questions"| DB
    DB -.->|"Lưu JSONB thành công"| Repo
    Repo -.->|"Saved Entity"| Service
    Service -.->|"QuizDto"| Controller
    Controller -.->|"200 OK"| UI
```

## 3. Lưu Tự Động Siêu Nhanh (Theo thời gian thực)
**Mô tả:** Khi người dùng chọn đáp án trong lúc thi, lựa chọn của họ được lưu lại ngay lập tức. Để tránh tình trạng khóa database và độ trễ cao, tính năng này sử dụng bộ nhớ đệm Redis.
**Luồng xử lý:**
- **Frontend:**
  - Component: `frontend/src/pages/TakeQuiz.jsx`
  - Luồng: User chọn đáp án -> `handleSelectOption` -> gọi `fetchApi('/exams/{quizId}/questions/{questionId}/answers')` bất đồng bộ.
- **Backend:**
  - Controller: `ExamController.java`
  - Service: `ExamService.java` (phương thức `autoSaveAnswer`).
  - Caching (Redis): Đáp án được đẩy ngay lập tức vào Redis Hash bằng `StringRedisTemplate.opsForHash().put(key, questionId, answer)`. Cấu trúc khóa (key) là `exam:{quizId}:user:{userId}`.

**Sơ đồ luồng:**
```mermaid
flowchart LR
    User(("fa:fa-user Người dùng"))

    subgraph Client ["fa:fa-desktop Frontend"]
        UI["TakeQuiz.jsx"]
    end

    subgraph API ["fa:fa-server Backend"]
        Controller{"ExamController.java"}
        Service["ExamService.java"]
    end

    subgraph Cache ["fa:fa-bolt Bộ nhớ đệm"]
        Redis[("fa:fa-server Redis Cache")]
    end

    User -->|"Click chọn 1 đáp án"| UI
    UI -->|"Update State hiển thị ngay"| UI
    UI -->|"POST /answers (Ngầm)"| Controller
    Controller -->|"autoSaveAnswer"| Service
    Service -->|"opsForHash.put"| Redis
    Redis -.->|"Ghi O1 thành công"| Service
    Service -.-> Controller
    Controller -.->|"200 OK"| UI
```

## 4. Chấm Điểm Bất Đồng Bộ (Dựa trên Sự Kiện)
**Mô tả:** Khi người dùng nộp bài, hệ thống không bắt họ phải chờ quá trình chấm điểm. Nó trả về ngay trạng thái 202 Accepted và đưa tác vụ chấm điểm vào hàng đợi tin nhắn (Message Queue) RabbitMQ để xử lý ngầm.
**Luồng xử lý:**
- **Frontend:**
  - Component: `frontend/src/pages/TakeQuiz.jsx`
  - Luồng: User bấm "Submit" -> gọi `fetchApi('/exams/{quizId}/submit')` -> hiển thị màn hình Thành công.
- **Backend (Producer):**
  - Controller: `ExamController.java`
  - Service: `ExamService.java` (phương thức `submitExam`). Tạo một sự kiện `ExamSubmittedEvent` và gửi nó lên RabbitMQ thông qua `RabbitTemplate.convertAndSend()`.
- **Backend (Consumer):**
  - Service: `ExamProcessorService.java`. Annotation `@RabbitListener` sẽ nhận sự kiện này bất đồng bộ.
  - Luồng: 
    1. Lấy toàn bộ đáp án của user từ Redis Hash với tốc độ O(1).
    2. So sánh đáp án của user với `correctAnswer` trong PostgreSQL.
    3. Tính toán điểm số và map các đáp án đã chọn thành một đối tượng `evidence` (bằng chứng).
    4. Lưu `ExamResult` (bao gồm `evidence` dạng JSONB) xuống Database.
    5. Dọn dẹp cache tạm trong Redis.

**Sơ đồ luồng:**
```mermaid
flowchart TD
    subgraph Client ["fa:fa-desktop Frontend"]
        UI["TakeQuiz.jsx"]
    end

    subgraph API ["fa:fa-server Backend"]
        Controller{"ExamController"}
        Service["ExamService"]
        Processor["ExamProcessorService"]
    end

    subgraph Broker ["fa:fa-envelope Message Queue"]
        RMQ{{"fa:fa-exchange-alt RabbitMQ"}}
    end

    subgraph Storage ["fa:fa-database Lưu trữ"]
        Redis[("fa:fa-server Redis")]
        DB[("fa:fa-database PostgreSQL")]
    end

    UI -->|"Bấm Nộp Bài"| Controller
    Controller -->|"Tạo Event"| Service
    Service -->|"Gửi Message"| RMQ
    Service -.->|"Trả về ngay lập tức"| Controller
    Controller -.->|"202 ACCEPTED"| UI

    RMQ -->|"Lắng nghe RabbitListener"| Processor
    Processor -->|"Lấy toàn bộ đáp án"| Redis
    Redis -.->|"Map đáp án O1"| Processor
    Processor -->|"Lấy đáp án đúng"| DB
    DB -.->|"Quiz Entity"| Processor
    Processor -->|"Chấm điểm và Tạo JSON"| Processor
    Processor -->|"Lưu ExamResult"| DB
    Processor -->|"Dọn dẹp"| Redis
```

## 5. Theo Dõi & Lịch Sử Bài Làm (Dành cho Admin)
**Mô tả:** Quản trị viên có thể xem chính xác những đáp án mà người dùng đã chọn để kiểm tra. Phần lịch sử (evidence) được lấy từ cột JSONB và render thành giao diện trực quan.
**Luồng xử lý:**
- **Frontend:**
  - Component: `frontend/src/pages/AdminDashboard.jsx` (Tab Results)
  - Luồng: Lấy danh sách kết quả. Khi bấm "View Details", nó gọi `fetchApi('/quizzes/{id}')` để lấy cấu trúc đề thi gốc, sau đó đắp dữ liệu `evidence` (JSON) lên form giao diện, làm nổi bật các câu đúng/sai.
- **Backend:**
  - Controller: `ExamController.java` (`/api/v1/exams/results`) -> trả về danh sách kết quả kèm JSONB `evidence`.
  - Repository: `ExamResultRepository.java`.

**Sơ đồ luồng:**
```mermaid
flowchart TD
    Admin(("fa:fa-user-tie Admin"))

    subgraph Client ["fa:fa-desktop Frontend"]
        UI["AdminDashboard.jsx"]
    end

    subgraph API ["fa:fa-server Backend"]
        ExamC{"ExamController"}
        QuizC{"QuizController"}
    end

    subgraph Data ["fa:fa-database Database"]
        DB[("fa:fa-database PostgreSQL")]
    end

    Admin -->|"Mở Tab Results"| UI
    UI -->|"GET /exams/results"| ExamC
    ExamC -->|"Lấy lịch sử"| DB
    DB -.->|"ExamResults kèm JSONB evidence"| ExamC
    ExamC -.->|"Mảng kết quả"| UI
    
    Admin -->|"Click View Details"| UI
    UI -->|"GET /quizzes/id"| QuizC
    QuizC -->|"Lấy cấu trúc đề thi"| DB
    DB -.->|"Quiz Entity"| QuizC
    QuizC -.->|"Câu hỏi, Options, Đáp án đúng"| UI
    
    UI -->|"Render Form"| UI
    UI -.->|"Hiển thị Modal Glassmorphism"| Admin
```
