// /js/home.js

document.addEventListener('DOMContentLoaded', () => {
    // API_URL trỏ đến Netlify proxy của chúng ta
    // ===== START: API URL Động cho Multi-Tenant =====
function getClassCodeFromURL() {
  const params = new URLSearchParams(window.location.search);
  const classCode = params.get('lop') || params.get('class');
  if (classCode) {
    return classCode.replace(/[^a-zA-Z0-9]/g, '');
  }
  return null;
}

const classCode = getClassCodeFromURL();

// Nếu trang chủ không có mã lớp, ta có thể hiển thị một thông báo chung
if (!classCode) {
    const loadingMessage = document.getElementById('loading-message');
    if(loadingMessage) {
        loadingMessage.innerHTML = '<h2>Chào mừng bạn đến với Lưu Dấu Học Tập!</h2><p>Vui lòng sử dụng đường link do giáo viên của bạn cung cấp để xem danh sách bài tập.</p>';
        loadingMessage.style.color = '#e5e7eb';
    }
    // Ném lỗi để dừng việc thực thi script, không gọi API nữa.
    throw new Error("Mã lớp không được cung cấp cho trang chủ.");
}

const API_URL = classCode ? `/api/${classCode}/` : "/api/default/";
// ===== END: API URL Động cho Multi-Tenant ===== 
    const examListContainer = document.getElementById('exam-list');
    const loadingMessage = document.getElementById('loading-message');

    /**
     * Hàm này sẽ gọi API để lấy danh sách các bài kiểm tra
     * và sau đó hiển thị chúng ra màn hình.
     */
    async function fetchAndDisplayExams() {
        try {
            // Gọi API bằng fetch chuẩn
            const response = await fetch(`${API_URL}?action=getExamList`);
            if (!response.ok) {
                throw new Error('Không thể kết nối đến máy chủ.');
            }
            const result = await response.json();

            // Nếu API trả về lỗi (ví dụ: action không hợp lệ)
            if (!result.success) {
                throw new Error(result.message);
            }

            const exams = result.data;
            loadingMessage.style.display = 'none'; // Ẩn thông báo "Đang tải" khi đã có dữ liệu

            // Nếu không có bài tập nào
            if (exams.length === 0) {
                examListContainer.innerHTML = '<p style="text-align: center;">Hiện chưa có bài tập nào được giao.</p>';
                return;
            }

            // Xóa nội dung cũ trong container (nếu có)
            examListContainer.innerHTML = '';

            // Lặp qua danh sách các bài tập và tạo link cho mỗi bài
            exams.forEach(exam => {
                const link = document.createElement('a');
                link.className = 'exam-link';
                // Tạo link dẫn đến trang làm bài, kèm theo examId
                link.href = `/Exam.html?examId=${exam.examId}&lop=${classCode}`;
                
                // Sử dụng template literal để tạo nội dung HTML bên trong thẻ <a>
                link.innerHTML = `
                    <h3>${exam.title}</h3>
                    <p>Thời gian làm bài: ${exam.durationMinutes} phút</p>
                `;

                // Thêm link vừa tạo vào container
                examListContainer.appendChild(link);
            });

        } catch (error) {
            // Hiển thị thông báo lỗi nếu có vấn đề xảy ra
            console.error("Lỗi khi tải danh sách bài tập:", error);
            loadingMessage.textContent = `Lỗi: ${error.message}. Vui lòng thử tải lại trang.`;
            loadingMessage.style.color = 'red';
        }
    }

    // Gọi hàm để bắt đầu quá trình tải và hiển thị
    fetchAndDisplayExams();
});