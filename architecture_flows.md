# Sơ đồ Kiến trúc & Luồng xử lý Hệ thống Study Plan Tracker

Dưới đây là các sơ đồ trực quan (Mermaid Diagrams) mô tả chi tiết cách hệ thống giải quyết các bài toán về hiệu năng và logic nghiệp vụ cho từng luồng chức năng (Flow).

## 1. Flow Khởi tạo Lộ trình (Plan Creation Flow)
Luồng này xử lý yêu cầu tạo một lộ trình học tập mới, tự động sinh ra các nhiệm vụ hàng ngày (Daily Tasks) theo khối lượng khổng lồ nhưng vẫn đảm bảo tính toàn vẹn dữ liệu.

```mermaid
sequenceDiagram
    participant C as Client (Web/App)
    participant Ctrl as PlanController
    participant Svc as PlanService
    participant DB as PostgreSQL

    C->>Ctrl: POST /api/v1/plans/templates<br>(Name, Target Mins, Days)
    Ctrl->>Svc: createPlanTemplate(request)
    
    rect rgb(240, 248, 255)
        Note over Svc, DB: Xử lý trong 1 Transaction duy nhất
        Svc->>DB: INSERT PlanTemplate
        loop 30 lần (30 ngày)
            Svc->>Svc: Tính toán ngày học (Task Date)
            Svc->>DB: INSERT DailyTask (Status: TODO)
        end
    end
    
    Svc-->>Ctrl: PlanTemplateResponse
    Ctrl-->>C: 201 Created (Kèm thông tin Lộ trình)
```

## 2. Flow Ghi nhận Heartbeat (High-Throughput Tracking)
Đây là luồng "xương sống" xử lý tải trọng cao. Dữ liệu được ghi liên tục lên thanh RAM (thông qua Redis) thay vì ghi trực tiếp xuống ổ cứng (PostgreSQL) để hệ thống có thể chịu tải hàng chục nghìn người cùng học.

```mermaid
sequenceDiagram
    participant C as Client (Web/App)
    participant Ctrl as TrackingController
    participant Svc as TrackingService
    participant Redis as Redis (In-Memory)
    participant DB as PostgreSQL
    participant MQ as RabbitMQ

    C->>Ctrl: POST /api/v1/tracking/heartbeat (TaskId)
    Ctrl->>Svc: processHeartbeat(taskId, 1 phút)
    
    Svc->>Redis: HINCRBY daily_task_progress {taskId} 1
    Redis-->>Svc: Trả về tổng số phút hiện tại (VD: 130)
    
    alt Tổng phút >= 130 (Đạt định mức Lộ trình)
        Svc->>DB: SELECT DailyTask by ID
        Svc->>DB: UPDATE DailyTask (Status = DONE)
        Svc->>MQ: Publish DailyGoalAchievedEvent
    end
    
    Svc-->>Ctrl: void
    Ctrl-->>C: 202 Accepted
```

## 3. Flow Xử lý Sự kiện Bất đồng bộ (Event-Driven Notification)
Kiến trúc tách rời (Decoupled). Khi một Task hoàn thành, API không bắt người dùng phải "chờ" Server gửi Email xong mới trả kết quả. Thay vào đó, một Event được ném vào Message Broker (RabbitMQ) và xử lý chạy ngầm độc lập.

```mermaid
flowchart LR
    Publisher(TrackingService) -->|Publish Event| Exchange((Direct Exchange))
    Exchange -->|Routing Key: goal.achieved| Queue[notification.daily_goal.queue]
    Queue -->|Consume Message| Listener(NotificationListener)
    
    subgraph Xử lý Độc lập (Consumer)
        Listener --> Email[Gửi Email chúc mừng]
        Listener --> Push[Đẩy Push Notification]
        Listener --> Log[Ghi Log hệ thống]
    end
```

## 4. Flow Đồng bộ Dữ liệu Ban đêm (Background Sync Job)
Dữ liệu đang nằm rải rác trên RAM (Redis) vào ban ngày sẽ được thu gom và sao lưu vĩnh viễn xuống PostgreSQL vào lúc thấp điểm (2h sáng) để giải phóng bộ nhớ.

```mermaid
sequenceDiagram
    participant Cron as RedisSyncScheduler
    participant Redis as Redis
    participant DB as PostgreSQL

    Note over Cron: Kích hoạt tự động lúc 02:00 AM
    Cron->>Redis: HSCAN lấy toàn bộ tiến độ (taskId -> mins)
    Redis-->>Cron: Map<String, String> (Dữ liệu chưa đồng bộ)
    
    loop Duyệt qua từng TaskId
        Cron->>DB: Kiểm tra trạng thái DailyTask (Optional)
        Cron->>Cron: Khởi tạo Entity StudyLog<br>(kèm Metadata chuẩn JSONB)
    end
    
    Cron->>DB: BATCH INSERT dữ liệu vào bảng StudyLog
    
    alt Lưu DB thành công
        Cron->>Redis: HDEL (Xóa các Key đã đồng bộ để giải phóng RAM)
    end
```
