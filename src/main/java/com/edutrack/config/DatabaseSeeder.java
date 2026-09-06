package com.edutrack.config;

import com.edutrack.plan.PlanService;
import com.edutrack.plan.PlanTemplateCreateRequest;
import com.edutrack.plan.PlanTemplateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);
    
    private final PlanService planService;
    private final PlanTemplateRepository planTemplateRepository;

    public DatabaseSeeder(PlanService planService, PlanTemplateRepository planTemplateRepository) {
        this.planService = planService;
        this.planTemplateRepository = planTemplateRepository;
    }

    @Override
    public void run(String... args) {
        if (planTemplateRepository.count() == 0) {
            log.info("⏳ Cơ sở dữ liệu đang trống, tiến hành tạo dữ liệu mẫu (Seed Data)...");
            
            // Khởi tạo Lộ trình 30 ngày y như lúc gọi POST API
            PlanTemplateCreateRequest request = new PlanTemplateCreateRequest(
                    "Giao tiếp công việc trong 30 ngày",
                    130, // 130 phút mỗi ngày
                    30   // 30 ngày
            );
            
            // Gọi qua Service sẽ tự động sinh luôn 30 DailyTask liên tục nhờ vòng lặp
            planService.createPlanTemplate(request);
            
            log.info("✅ Đã tạo thành công dữ liệu mẫu! Lộ trình và 30 Daily Tasks đã được lưu vào PostgreSQL.");
            log.info("👉 Task đầu tiên sẽ có ID = 1 (khớp với TASK_ID trong giao diện Frontend).");
            log.info("🚀 Bạn có thể mở trực tiếp file src/main/resources/static/index.html trên trình duyệt để Demo ngay!");
        } else {
            log.info("ℹ️ Cơ sở dữ liệu đã có sẵn dữ liệu, bỏ qua bước Seed Data.");
        }
    }
}
