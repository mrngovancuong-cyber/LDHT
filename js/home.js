// /js/home.js - PHIÊN BẢN HOÀN CHỈNH, TỐI ƯU HÓA

/**
 * Hàm tạo PWA Manifest động. Đảm bảo ứng dụng PWA khi mở sẽ vào đúng lớp của học sinh.
 * @param {string} classCode - Mã lớp để đưa vào start_url.
 */
function generateDynamicManifest(classCode) {
    if (!classCode) return;
    const manifest = {
        "name": `LDHT - Lớp ${classCode}`,
        "short_name": `LDHT ${classCode}`,
        "start_url": `/Index.html?lop=${classCode}`, // Đảm bảo đây là đường dẫn tương đối
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
    //      PHẦN 1: KHỞI TẠO BIẾN VÀ CẤU HÌNH
    // =================================================================

    function getClassCodeFromURL() {
        const params = new URLSearchParams(window.location.search);
        const classCode = params.get('lop') || params.get('class');
        return classCode ? classCode.replace(/[^a-zA-Z0-9]/g, '') : null;
    }

    const classCode = getClassCodeFromURL();

    if (!classCode) {
        document.body.innerHTML = `<div style="text-align: center; padding: 50px; font-family: sans-serif; color: white;">
                                    <h1>Lỗi: Không tìm thấy mã lớp</h1>
                                    <p>Vui lòng truy cập trang web từ đường link được giáo viên cung cấp (Ví dụ: ...?lop=ten_lop).</p>
                                  </div>`;
        return; 
    }

    const API_URL = `/api/${classCode}/`;
    const STUDENT_INFO_KEY = `ldht-student-info-${classCode}`;
    generateDynamicManifest(classCode);

    const loginContainer = document.getElementById('login-container');
    const contentContainer = document.getElementById('content-container');
    const studentNameInput = document.getElementById('studentName');
    const studentIdInput = document.getElementById('studentId');
    const classNameInput = document.getElementById('className');
    const continueBtn = document.getElementById('continue-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const studentGreeting = document.getElementById('student-greeting');
    const examListContainer = document.getElementById('exam-list');
    const loadingContainer = document.getElementById('loading-container');

    // =================================================================
    //      PHẦN 2: CÁC HÀM XỬ LÝ LOGIC CHÍNH
    // =================================================================

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
        // Sau khi lưu, chuyển sang chế độ xem nội dung
        switchToContentView(studentInfo);
    }

    function logout() {
        if (confirm('Bạn có chắc chắn muốn xóa thông tin cá nhân trên trình duyệt này không?')) {
            localStorage.removeItem(STUDENT_INFO_KEY);
            // Sau khi xóa, chuyển về chế độ xem đăng nhập
            switchToLoginView();
        }
    }

    /**
     * Chuyển giao diện sang trạng thái ĐĂNG NHẬP.
     */
    function switchToLoginView() {
        contentContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        // Reset các ô input
        studentNameInput.value = '';
        studentIdInput.value = '';
        classNameInput.value = '';
        studentNameInput.focus(); // Tự động trỏ vào ô nhập tên
    }

    /**
     * Chuyển giao diện sang trạng thái XEM NỘI DUNG.
     * @param {object} studentInfo - Thông tin học sinh đã đăng nhập.
     */
    function switchToContentView(studentInfo) {
        loginContainer.classList.add('hidden');
        contentContainer.classList.remove('hidden');
        
        // Cập nhật lời chào
        if (studentGreeting) {
            studentGreeting.innerHTML = `Xin chào, ${studentInfo.name}!`;
        }

        // Tải danh sách bài tập
        fetchAndDisplayExams();
    }

    async function fetchAndDisplayExams() {
        try {
            examListContainer.classList.add('hidden');
            loadingContainer.classList.remove('hidden');
            
            const response = await fetch(`${API_URL}?action=getExamList`);
            if (!response.ok) throw new Error('Không thể kết nối đến máy chủ.');
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            const exams = result.data;
            
            examListContainer.innerHTML = ''; 
            if (exams.length === 0) {
                examListContainer.innerHTML = '<p style="text-align: center;">Hiện chưa có bài tập nào được giao.</p>';
            } else {
                exams.forEach(exam => {
                    const link = document.createElement('a');
                    link.className = 'exam-link';
                    link.href = `/Exam.html?examId=${exam.examId}&lop=${classCode}`;
                    link.innerHTML = `<h3>${exam.title}</h3><p>Thời gian làm bài: ${exam.durationMinutes} phút</p>`;
                    examListContainer.appendChild(link);
                });
            }

            loadingContainer.classList.add('hidden');
            examListContainer.classList.remove('hidden');

        } catch (error) {
            console.error("Lỗi khi tải danh sách bài tập:", error);
            loadingContainer.classList.add('hidden');
            examListContainer.innerHTML = `<p style="text-align: center; color: var(--bad);">Lỗi: ${error.message}. Vui lòng thử tải lại trang.</p>`;
            examListContainer.classList.remove('hidden');
        }
    }

    // =================================================================
    //      PHẦN 3: KHỞI TẠO TRANG
    // =================================================================

    function initializePage() {
        // Gắn sự kiện click
        continueBtn.addEventListener('click', saveAndProceed);
        logoutBtn.addEventListener('click', logout);

        // Gắn sự kiện phím Enter
        function handleEnterKey(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                saveAndProceed();
            }
        }
        studentNameInput.addEventListener('keydown', handleEnterKey);
        studentIdInput.addEventListener('keydown', handleEnterKey);
        classNameInput.addEventListener('keydown', handleEnterKey);

        // Kiểm tra thông tin đã lưu
        const savedInfoRaw = localStorage.getItem(STUDENT_INFO_KEY);
        if (savedInfoRaw) {
            try {
                const savedInfo = JSON.parse(savedInfoRaw);
                // Nếu có thông tin hợp lệ, chuyển thẳng vào xem nội dung
                switchToContentView(savedInfo);
            } catch (e) {
                localStorage.removeItem(STUDENT_INFO_KEY);
                // Nếu thông tin lỗi, hiển thị màn hình đăng nhập
                switchToLoginView();
            }
        } else {
            // Nếu chưa có thông tin, hiển thị màn hình đăng nhập
            switchToLoginView();
        }
    }

    // Chạy hàm khởi tạo
    initializePage();
});