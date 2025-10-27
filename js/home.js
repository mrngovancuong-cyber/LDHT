// /js/home.js - PHIÊN BẢN SỬA LỖI & HOÀN CHỈNH UX

/**
 * Hàm tạo PWA Manifest động.
 * Nó tạo ra một manifest "ảo" với start_url chứa mã lớp,
 * đảm bảo ứng dụng PWA khi mở sẽ vào đúng lớp của học sinh.
 * @param {string} classCode - Mã lớp để đưa vào start_url.
 */
function generateDynamicManifest(classCode) {
    if (!classCode) return;
    const manifest = {
        "name": `LDHT - Lớp ${classCode}`,
        "short_name": `LDHT ${classCode}`,
        "start_url": `/Index.html?lop=${classCode}`,
        "display": "standalone",
        "background_color": "#0b1220",
        "theme_color": "#0b1220",
        "scope": "/",
        "icons": [
            { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
            { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
        ]
    };
    const manifestString = JSON.stringify(manifest);
    const blob = new Blob([manifestString], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(blob);
    const manifestLink = document.getElementById('manifest-link');
    if (manifestLink) {
        manifestLink.href = manifestURL;
    }
}

// Bắt đầu thực thi sau khi toàn bộ cấu trúc HTML đã được tải
document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    //      PHẦN 1: KHỞI TẠO CÁC BIẾN VÀ CẤU HÌNH
    // =================================================================

    /**
     * Lấy mã lớp từ tham số 'lop' hoặc 'class' trên URL.
     * @returns {string | null} Mã lớp hoặc null nếu không tìm thấy.
     */
    function getClassCodeFromURL() {
        // SỬA LỖI: Chỉ dùng một "new" duy nhất.
        const params = new URLSearchParams(window.location.search);
        const classCode = params.get('lop') || params.get('class');
        if (classCode) {
            return classCode.replace(/[^a-zA-Z0-9]/g, '');
        }
        return null;
    }

    const classCode = getClassCodeFromURL();

    // Nếu không có mã lớp, hiển thị lỗi và dừng toàn bộ script
    if (!classCode) {
        document.body.innerHTML = `<div style="text-align: center; padding: 50px; font-family: sans-serif; color: white;">
                                    <h1>Lỗi: Không tìm thấy mã lớp</h1>
                                    <p>Vui lòng truy cập trang web từ đường link được giáo viên cung cấp (Ví dụ: ...?lop=ten_lop).</p>
                                  </div>`;
        return; 
    }

    // Thiết lập các biến toàn cục cho trang
    const API_URL = `/api/${classCode}/`;
    const STUDENT_INFO_KEY = `ldht-student-info-${classCode}`;
    
    // Kích hoạt PWA động
    generateDynamicManifest(classCode);

    // Khai báo các phần tử DOM để sử dụng nhiều lần
    const loginContainer = document.getElementById('login-container');
    const contentContainer = document.getElementById('content-container');
    const studentNameInput = document.getElementById('studentName');
    const studentIdInput = document.getElementById('studentId');
    const classNameInput = document.getElementById('className');
    const continueBtn = document.getElementById('continue-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const studentGreeting = document.getElementById('student-greeting');
    const examListContainer = document.getElementById('exam-list');
    const loadingMessage = document.getElementById('loading-message');

    // =================================================================
    //      PHẦN 2: CÁC HÀM XỬ LÝ LOGIC CHÍNH
    // =================================================================

    /**
     * Lấy thông tin từ form, kiểm tra, lưu vào Local Storage và cập nhật giao diện.
     */
    function saveAndProceed() {
        const studentInfo = {
            name: studentNameInput.value.trim(),
            id: studentIdInput.value.trim(),
            className: classNameInput.value.trim(),
        };
        if (!studentInfo.name || !studentInfo.id || !studentInfo.className) {
            alert('Vui lòng điền đầy đủ Họ và tên, Mã số học sinh và Lớp.');
            return;
        }
        localStorage.setItem(STUDENT_INFO_KEY, JSON.stringify(studentInfo));
        updateView(studentInfo);
    }

    /**
     * Xóa thông tin học sinh khỏi Local Storage và quay lại màn hình đăng nhập.
     */
    function logout() {
        if (confirm('Bạn có chắc chắn muốn xóa thông tin cá nhân trên trình duyệt này không?')) {
            localStorage.removeItem(STUDENT_INFO_KEY);
            updateView(null);
        }
    }

    /**
     * Điều khiển giao diện: Hiển thị form đăng nhập hoặc nội dung chính.
     * @param {object | null} studentInfo - Đối tượng thông tin học sinh hoặc null.
     */
    function updateView(studentInfo) {
        if (studentInfo && studentInfo.name) {
            // Trạng thái ĐÃ ĐĂNG NHẬP
            loginContainer.classList.add('hidden');
            contentContainer.classList.remove('hidden');
            studentGreeting.innerHTML = `Xin chào, <strong>${studentInfo.name}</strong> (${studentInfo.className} - ${studentInfo.id})`;
            fetchAndDisplayExams();
        } else {
            // Trạng thái CHƯA ĐĂNG NHẬP
            loginContainer.classList.remove('hidden');
            contentContainer.classList.add('hidden');
            studentNameInput.value = '';
            studentIdInput.value = '';
            classNameInput.value = '';
        }
    }

    /**
     * Gọi API để lấy danh sách bài tập và hiển thị ra màn hình.
     */
    async function fetchAndDisplayExams() {
        try {
            loadingMessage.style.display = 'block';
            examListContainer.innerHTML = ''; // Xóa danh sách cũ
            const response = await fetch(`${API_URL}?action=getExamList`);
            if (!response.ok) throw new Error('Không thể kết nối đến máy chủ.');
            const result = await response.json();
            if (!result.success) throw new Error(result.message);

            const exams = result.data;
            loadingMessage.style.display = 'none';

            if (exams.length === 0) {
                examListContainer.innerHTML = '<p style="text-align: center;">Hiện chưa có bài tập nào được giao.</p>';
                return;
            }

            exams.forEach(exam => {
                const link = document.createElement('a');
                link.className = 'exam-link';
                link.href = `/Exam.html?examId=${exam.examId}&lop=${classCode}`;
                link.innerHTML = `<h3>${exam.title}</h3><p>Thời gian làm bài: ${exam.durationMinutes} phút</p>`;
                examListContainer.appendChild(link);
            });
        } catch (error) {
            console.error("Lỗi khi tải danh sách bài tập:", error);
            loadingMessage.textContent = `Lỗi: ${error.message}. Vui lòng thử tải lại trang.`;
            loadingMessage.style.color = 'red';
        }
    }

    // =================================================================
    //      PHẦN 3: KHỞI TẠO TRANG
    // =================================================================

    /**
     * Hàm khởi tạo chính của trang: gắn sự kiện và kiểm tra trạng thái đăng nhập.
     */
    function initializePage() {
        continueBtn.addEventListener('click', saveAndProceed);
        logoutBtn.addEventListener('click', logout);

        const savedInfoRaw = localStorage.getItem(STUDENT_INFO_KEY);
        let savedInfo = null;
        if (savedInfoRaw) {
            try {
                savedInfo = JSON.parse(savedInfoRaw);
            } catch (e) {
                // Nếu dữ liệu trong localStorage bị lỗi, xóa nó đi
                localStorage.removeItem(STUDENT_INFO_KEY);
            }
        }
        // Cập nhật giao diện dựa trên thông tin đã lưu (hoặc không)
        updateView(savedInfo);
    }

    // Chạy hàm khởi tạo
    initializePage();
});