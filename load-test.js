// Using native fetch (requires Node 18+)

// Configuration
const API_URL = 'http://localhost:8080/api/v1';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password';
const QUIZ_ID = 5; // Thay đổi ID bài quiz bạn muốn test
const CONCURRENT_USERS = 200; // Số lượng User (request) nộp bài cùng lúc

async function runLoadTest() {
    console.log(`🚀 Bắt đầu kịch bản Load Test: Nộp bài đồng loạt...`);
    
    const tempUser = 'loadtester_' + Date.now();
    
    // 1. Lấy Token (Dùng chung 1 token cho nhanh bằng cách tạo user ảo)
    console.log(`[1] Đang tạo User ảo (${tempUser}) để lấy JWT Token...`);
    const registerRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: tempUser, password: 'password' })
    });
    
    if (!registerRes.ok) {
        const text = await registerRes.text();
        console.error('Lỗi tạo user ảo:', registerRes.status, text);
        return;
    }
    
    const { token } = await registerRes.json();
    console.log(`✅ Đã lấy được Token thành công!`);

    // 2. Tạo mảng chứa hàng trăm Request
    console.log(`[2] Đang chuẩn bị bắn ${CONCURRENT_USERS} requests nộp bài (submit)...`);
    const requests = [];
    
    for (let i = 0; i < CONCURRENT_USERS; i++) {
        const req = fetch(`${API_URL}/exams/${QUIZ_ID}/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        requests.push(req);
    }

    // 3. Thực thi đồng loạt (Concurrent) và đo thời gian
    console.log(`[3] BÙM! 💣 Đang gửi đồng loạt...`);
    const startTime = Date.now();
    
    const responses = await Promise.all(requests);
    
    const endTime = Date.now();
    
    // Kiểm tra kết quả
    const successCount = responses.filter(r => r.status === 202).length;
    
    console.log(`\n🎉 KẾT QUẢ LOAD TEST:`);
    console.log(`- Tổng số Request đã gửi: ${CONCURRENT_USERS}`);
    console.log(`- Số Request thành công (HTTP 202 Accepted): ${successCount}`);
    console.log(`- Tổng thời gian phản hồi (Response Time): ${endTime - startTime} ms`);
    console.log(`\n👉 Giải thích: Mặc dù gửi ${CONCURRENT_USERS} request cùng lúc, Spring Boot trả kết quả gần như ngay lập tức (dưới 1 giây) vì hàm Submit chỉ đẩy message vào RabbitMQ rồi ngắt kết nối luôn. Quá trình chấm điểm nặng nhọc sẽ được Background Worker (RabbitMQ Consumer) từ từ xử lý ở phía sau.`);
    console.log(`\n💡 BÂY GIỜ HÃY MỞ ADMIN DASHBOARD LÊN VÀ XEM CÁI CHUÔNG THÔNG BÁO! 🔔 Mưa thông báo đang đổ về qua WebSocket!`);
}

runLoadTest().catch(console.error);
