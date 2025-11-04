// js/theme-switcher.js

(function() {
    const themeToggleButton = document.getElementById('theme-toggle-btn');
    const currentTheme = localStorage.getItem('theme') || 'dark';

    // Áp dụng theme đã lưu ngay khi trang tải
    document.documentElement.setAttribute('data-theme', currentTheme);

    if (themeToggleButton) {
        // Cập nhật icon của nút bấm cho đúng với theme hiện tại
        themeToggleButton.innerHTML = currentTheme === 'light' 
            ? '🌙' // Icon mặt trăng cho chế độ Sáng
            : '☀️'; // Icon mặt trời cho chế độ Tối

        // Gắn sự kiện click
        themeToggleButton.addEventListener('click', () => {
            let newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            
            // Cập nhật thuộc tính trên thẻ <html>
            document.documentElement.setAttribute('data-theme', newTheme);
            
            // Lưu lựa chọn vào localStorage
            localStorage.setItem('theme', newTheme);

            // Cập nhật lại icon của nút bấm
            themeToggleButton.innerHTML = newTheme === 'light' ? '🌙' : '☀️';
        });
    }
})();