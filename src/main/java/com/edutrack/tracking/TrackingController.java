package com.edutrack.tracking;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/v1/tracking")
public class TrackingController {

    private final TrackingService trackingService;

    public TrackingController(TrackingService trackingService) {
        this.trackingService = trackingService;
    }

    /**
     * TẠI SAO LẠI DÙNG CÁCH NÀY:
     * - Trả về 202 ACCEPTED do quá trình update trạng thái DB hoặc 
     *   bắn Event thông báo có thể xử lý background, client không cần chờ.
     */
    @PostMapping("/heartbeat")
    public ResponseEntity<Void> processHeartbeat(@Valid @RequestBody HeartbeatRequest request) {
        trackingService.processHeartbeat(request);
        return ResponseEntity.accepted().build();
    }
}
