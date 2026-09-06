package com.edutrack.plan;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class PlanService {

    private final PlanTemplateRepository planTemplateRepository;

    public PlanService(PlanTemplateRepository planTemplateRepository) {
        this.planTemplateRepository = planTemplateRepository;
    }

    /**
     * TẠI SAO LẠI CÓ HÀM NÀY:
     * - Khi tạo một Template, chúng ta đồng thời sinh ra toàn bộ danh sách DailyTasks dựa trên duration.
     * - Dùng @Transactional để đảm bảo nếu quá trình sinh task hoặc lưu xuống DB lỗi
     *   thì toàn bộ thay đổi sẽ được rollback (Atomic).
     * - Không gọi Repository của DailyTask riêng rẽ mà sử dụng CascadeType.ALL 
     *   từ PlanTemplate để tối ưu hóa việc quản lý vòng đời entity (Domain-Driven Design).
     */
    @Transactional
    public PlanTemplateResponse createPlanTemplate(PlanTemplateCreateRequest request) {
        PlanTemplate template = new PlanTemplate(
                request.name(),
                request.totalMinsPerDay(),
                request.durationDays()
        );

        LocalDate startDate = LocalDate.now();
        for (int i = 0; i < request.durationDays(); i++) {
            DailyTask task = new DailyTask(template, startDate.plusDays(i));
            template.addDailyTask(task);
        }

        PlanTemplate savedTemplate = planTemplateRepository.save(template);
        return PlanTemplateResponse.fromEntity(savedTemplate);
    }
}
