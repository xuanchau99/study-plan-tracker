package com.edutrack.plan;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/plans/templates")
public class PlanController {

    private final PlanService planService;

    public PlanController(PlanService planService) {
        this.planService = planService;
    }

    /**
     * TẠI SAO LẠI DÙNG CÁCH NÀY:
     * - Endpoint RESTful nhận JSON DTO và trả về JSON DTO, giấu Entity bên trong.
     * - @Valid kết hợp với record DTO để validate dữ liệu đầu vào.
     * - Trả về format chuẩn (201 CREATED) khi thêm mới thành công.
     */
    @PostMapping
    public ResponseEntity<PlanTemplateResponse> createPlanTemplate(
            @Valid @RequestBody PlanTemplateCreateRequest request) {
        PlanTemplateResponse response = planService.createPlanTemplate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
