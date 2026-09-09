# Luồng Xử Lý & Các Tính Năng Hệ Thống

Tài liệu này trình bày chi tiết các tính năng cốt lõi của Hệ Thống Trắc Nghiệm Hiệu Suất Cao và theo dõi luồng xử lý từ Frontend tới các thành phần Backend với độ chi tiết đến từng function.

## 1. Xác Thực & Phân Quyền Theo Vai Trò (RBAC)
**Mô tả:** Hệ thống sử dụng xác thực JWT (JSON Web Token) không lưu trạng thái (stateless).
**Luồng xử lý cụ thể:**
- **Frontend:** File `Login.jsx` thu thập form data, gọi hàm `fetchApi('/auth/login')`.
- **Backend:**
  - `AuthController.java` (Controller): Chạy hàm `authenticateUser(@RequestBody LoginDto)`.
  - Bên trong Controller, gọi `AuthenticationManager.authenticate()` để kiểm tra tài khoản mật khẩu qua DB.
  - Nếu đúng, Controller gọi tiếp `JwtUtil.java` vào hàm `generateToken(userDetails)` để tạo token.
  - Controller trả về `ResponseEntity.ok(new AuthResponse(token, username, role))` ngược lại cho `Login.jsx`.
  - Từ các request sau: `JwtAuthenticationFilter.java` chạy hàm `doFilterInternal()` chặn request, trích xuất token, gọi `CustomUserDetailsService.loadUserByUsername()` để lấy thông tin từ DB, sau đó cấp quyền truy cập.

```mermaid
flowchart TD
    User(("🧑‍💻 Người dùng"))

    subgraph Client ["Frontend React"]
        UI["Login.jsx"]
    end

    subgraph API ["Backend Spring Boot"]
        Controller{"AuthController (authenticateUser)"}
        JWT["JwtUtil (generateToken)"]
    end

    subgraph Data ["Hệ Cơ Sở Dữ Liệu"]
        DB[("PostgreSQL (Users)")]
    end

    User -->|"Nhập User/Pass"| UI
    UI -->|"POST /api/v1/auth/login"| Controller
    Controller -->|"authenticate()"| DB
    DB -.->|"Trả về UserDetails"| Controller
    Controller <-->|"Gọi generateToken()"| JWT
    Controller -.->|"Trả AuthResponse"| UI
    UI -->|"Lưu token vào LocalStorage"| Client
```

## 2. Tạo Bài Thi Hàng Loạt
**Mô tả:** Quản trị viên tạo bài thi với nhiều câu hỏi. Backend dùng JSONB để lưu.
**Luồng xử lý cụ thể:**
- **Frontend:** `AdminDashboard.jsx` gọi hàm `handleCreateQuiz()`, gửi mảng JSON khổng lồ qua `POST /api/v1/quizzes`.
- **Backend:**
  - `QuizController.java` (Controller): Chạy hàm `createQuiz(@RequestBody QuizDto)`.
  - Controller gọi sang `QuizService.java` (Service) tại hàm `createQuiz(QuizDto)`.
  - Tại Service, lặp qua DTO, tạo mới đối tượng `Quiz` và danh sách `Question`. Các lựa chọn (options) được gán thẳng vào thuộc tính `details`.
  - Service gọi `QuizRepository.java` tại hàm `save(quiz)`. Hibernate tự động parse thuộc tính `details` thành JSONB để lưu xuống PostgreSQL.
  - Service trả đối tượng đã lưu ngược lại cho Controller, Controller trả `ResponseEntity.ok(QuizDto)` về cho giao diện báo thành công.

```mermaid
flowchart TD
    Admin(("👨‍💼 Admin"))

    subgraph Client ["Frontend React"]
        UI["AdminDashboard.jsx"]
    end

    subgraph API ["Backend Spring Boot"]
        Controller{"QuizController (createQuiz)"}
        Service["QuizService (createQuiz)"]
        Repo["QuizRepository (save)"]
    end

    subgraph Data ["Cơ Sở Dữ Liệu"]
        DB[("PostgreSQL (Lưu JSONB)")]
    end

    Admin -->|"Nhập thông tin đề"| UI
    UI -->|"POST /quizzes"| Controller
    Controller -->|"Gọi service.createQuiz()"| Service
    Service -->|"Map Entities & gọi save()"| Repo
    Repo -->|"Hibernate Insert JSONB"| DB
    DB -.->|"Lưu thành công"| Repo
    Repo -.->|"Trả về Entity"| Service
    Service -.->|"Trả về QuizDto"| Controller
    Controller -.->|"200 OK (Data mới)"| UI
```

## 3. Lưu Tự Động Siêu Nhanh (In-Memory Cache)
**Mô tả:** Auto-save đáp án vào Redis để tránh sập Database.
**Luồng xử lý cụ thể:**
- **Frontend:** `TakeQuiz.jsx` chạy hàm `handleSelectOption()` khi click đáp án, gọi `POST /exams/{quizId}/questions/{questionId}/answers`.
- **Backend:**
  - `ExamController.java` (Controller): Bắt request tại hàm `autoSaveAnswer()`, trích xuất ID người dùng từ `@AuthenticationPrincipal`.
  - Controller gọi sang `ExamService.java` (Service) tại hàm `autoSaveAnswer(...)`.
  - Service lấy Bean `StringRedisTemplate`, gọi hàm `opsForHash().put(key, questionId, answer)` để ghi đè đáp án vào RAM của Redis.
  - Hoàn thành, Service không trả data gì. Controller trả về `ResponseEntity.ok().build()` (HTTP 200 rỗng) cho Frontend.

```mermaid
flowchart LR
    User(("👨‍🎓 Học Sinh"))

    subgraph Client ["Frontend"]
        UI["TakeQuiz.jsx"]
    end

    subgraph API ["Backend"]
        Controller{"ExamController (autoSaveAnswer)"}
        Service["ExamService (autoSaveAnswer)"]
    end

    subgraph Cache ["Bộ nhớ đệm"]
        Redis[("Redis Cache (RAM)")]
    end

    User -->|"Click đáp án A"| UI
    UI -->|"POST /answers"| Controller
    Controller -->|"Gọi Service"| Service
    Service -->|"opsForHash.put()"| Redis
    Redis -.->|"Ghi thành công O(1)"| Service
    Service -.-> Controller
    Controller -.->|"200 OK rỗng"| UI
```

## 4. Chấm Điểm Bất Đồng Bộ (RabbitMQ)
**Mô tả:** Nộp bài đẩy vào hàng đợi Message Queue để không block luồng chính.
**Luồng xử lý cụ thể:**
- **Giai đoạn Nộp (Producer):**
  - `ExamController.java` chạy hàm `submitExam(quizId)`.
  - Controller gọi `ExamService.java` chạy hàm `submitExam()`. Service đóng gói data thành `ExamSubmittedEvent`.
  - Service gọi `RabbitTemplate.convertAndSend()` đẩy event vào Queue của RabbitMQ.
  - Service kết thúc liền, Controller trả về `ResponseEntity.accepted().build()` (HTTP 202) cho Frontend `TakeQuiz.jsx`.
- **Giai đoạn Chấm Điểm (Consumer):**
  - `ExamProcessorService.java` (Service background) có gắn `@RabbitListener` tự động nhận message từ Queue.
  - Chạy hàm `processExamSubmission(event)`: 
      1. Gọi `StringRedisTemplate.opsForHash().entries()` lấy toàn bộ đáp án từ Redis.
      2. Gọi `QuizRepository.findWithQuestionsById()` lấy đáp án chuẩn từ DB.
      3. Duyệt mảng so sánh, cộng điểm, gói jsonb `evidence`.
      4. Gọi `ExamResultRepository.save(result)` ghi xuống DB.

```mermaid
flowchart TD
    UI["TakeQuiz.jsx"]
    
    subgraph API ["Backend (Web Thread)"]
        Controller{"ExamController (submitExam)"}
        Service{"ExamService (Gửi Queue)"}
    end

    RMQ{{"RabbitMQ (Message Queue)"}}

    subgraph Worker ["Backend (Background Thread)"]
        Processor["ExamProcessorService (@RabbitListener)"]
    end

    Redis[("Redis")]
    DB[("PostgreSQL")]

    UI -->|"POST /submit"| Controller
    Controller -->|"Gọi Service"| Service
    Service -->|"Đẩy Event"| RMQ
    Service -.->|"Xong ngay"| Controller
    Controller -.->|"Trả 202 ACCEPTED"| UI

    RMQ -->|"Gửi Message"| Processor
    Processor -->|"Lấy Answers"| Redis
    Processor -->|"Lấy Đề / Lưu Điểm"| DB
```

## 5. Theo Dõi & Lịch Sử Bài Làm (Admin Review)
**Mô tả:** Admin xem chi tiết bài làm dựa trên lịch sử JSONB đã lưu.
**Luồng xử lý cụ thể:**
- **Frontend:** `AdminDashboard.jsx` gọi `fetchApi('/exams/results')` để lấy danh sách điểm. Khi bấm View Details, gọi tiếp `fetchApi('/quizzes/{id}')`.
- **Backend:**
  - `ExamController.java` chạy hàm `getAllResults()`, gọi `ExamResultRepository.findAll()` lấy dữ liệu thô (gồm cả cột JSONB `evidence` chứa bằng chứng). Trả danh sách `ExamResultDto` về lại UI.
  - `QuizController.java` chạy hàm `getQuiz(id)` để cung cấp đề thi gốc. Frontend kết hợp 2 cục data này để vẽ lại y hệt bài làm của thí sinh, tô đỏ/xanh các câu làm sai/đúng.

## 6. Hệ thống Thông Báo Thời Gian Thực (WebSocket)
**Mô tả:** Báo điểm ngay lập tức thông qua STOMP WebSocket sau khi RabbitMQ xử lý xong.
**Luồng xử lý cụ thể:**
- **Frontend:** `App.jsx` sử dụng `@stomp/stompjs` kết nối qua `ws://.../ws`. Header gửi kèm JWT. Gọi lệnh `client.subscribe('/user/queue/notifications')` để chờ tin.
- **Backend:**
  - Khi kết nối, `StompChannelInterceptor.java` chạy hàm `preSend()`, móc JWT ra, gọi `JwtUtil.validateToken()`, nếu đúng thì gán thông tin vào `accessor.setUser()`.
  - RabbitMQ chạy ngầm xong điểm trong `ExamProcessorService.processExamSubmission()`, nó sẽ gọi `NotificationService.sendNotification(user, message)`.
  - `NotificationService` chạy hàm `sendNotification()`: Lưu thông báo vô `NotificationRepository`, sau đó gọi `SimpMessagingTemplate.convertAndSendToUser()` bắn cục DTO tới user cụ thể.
  - Frontend nhận Message, chạy hàm `toast.success()` bật popup hiển thị báo điểm.

```mermaid
flowchart TD
    User(("🧑‍💻 Người dùng"))

    subgraph Client ["Frontend"]
        UI["App.jsx (STOMP Client)"]
    end

    subgraph API ["Backend (WebSocket)"]
        Interceptor["StompChannelInterceptor (Auth)"]
        Proc["ExamProcessorService"]
        NotifSvc["NotificationService (push message)"]
    end

    STOMP{{"STOMP Broker /queue/notifications"}}

    Proc -->|"1. Lưu kết quả xong"| NotifSvc
    NotifSvc -->|"2. convertAndSendToUser()"| STOMP
    
    User -->|"Connect /ws (Kèm JWT)"| Interceptor
    Interceptor -->|"Cho phép mở Session"| STOMP
    STOMP -.->|"3. Bắn Real-time Message qua socket"| UI
    UI -->|"4. Bật Toast UI"| User
```
