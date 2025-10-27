// /js/home.js - PHIÊN BẢN NÂNG CẤP HOÀN CHỈNH

document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    //      PHẦN 1: KHỞI TẠO CÁC BIẾN TOÀN CỤC VÀ CẤU HÌNH
    // =================================================================

    // === KHỐI CODE API ĐỘNG VÀ PWA MANIFEST (Đã chính xác) ===
    function getClassCodeFromURL() {
        const params = new new URLSearchParams(window.location.search);
        const classCode = params.get('lop') || params.get('class');
        if (classCode) {
            return classCode.replace(/[^a-zA-Z0-9]/g, '');
        }
        return null;
    }

    const classCode = getClassCodeFromURL();

    if (!classCode) {
        const loadingMessage = document.getElementById('loading-message');
        if(loadingMessage) {
            loadingMessage.innerHTML = '<h2>Chào mừng bạn đến với Lưu Dấu Học Tập!</h2><p>Vui lòng sử dụng đường link do giáo viên của bạn cung cấp để xem danh sách bài tập.</p>';
            loadingMessage.style.color = '#e5e7eb';
            const studentLoginSection = document.getElementById('student-login-section');
            if (studentLoginSection) studentLoginSection.hidden = true;
        }
        throw new Error("Mã lớp không được cung cấp cho trang chủ.");
    }

    const API_URL = `/api/${classCode}/`;
    generateDynamicManifest(classCode);
    // === KẾT THÚC KHỐI KHỞI TẠO API VÀ PWA ===


    // === KHAI BÁO CÁC PHẦN TỬ DOM CẦN THIẾT ===
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

    const STUDENT_INFO_KEY = `ldht-student-info-${classCode}`;


    // =================================================================
    //      PHẦN 2: CÁC HÀM XỬ LÝ LOGIC CHÍNH
    // =================================================================

    /**
     * Lấy thông tin từ form, kiểm tra và lưu vào Local Storage.
     * Sau đó gọi updateUI để cập nhật giao diện.
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
     * Xóa thông tin học sinh khỏi Local Storage khi người dùng xác nhận.
     * Sau đó gọi updateUI để quay lại trạng thái "chưa đăng nhập".
     */
    function logout() {
        if (confirm('Bạn có chắc chắn muốn xóa thông tin cá nhân trên trình duyệt này không?')) {
            localStorage.removeItem(STUDENT_INFO_KEY);
            updateView(null);
        }
    }

    /**
     * Hàm trung tâm, quyết định giao diện sẽ hiển thị như thế nào
     * dựa vào việc có thông tin học sinh hay không.
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
     * Hàm này chỉ được gọi khi học sinh đã lưu thông tin.
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
    //      PHẦN 3: KHỞI TẠO TRANG VÀ GẮN SỰ KIỆN
    // =================================================================

    /**
     * Hàm khởi tạo chính của trang
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
                localStorage.removeItem(STUDENT_INFO_KEY);
            }
        }
        updateView(savedInfo);
    }

    initializePage();
});

// Hàm tạo PWA Manifest động (giữ nguyên, đã chính xác)
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