/**
 * utils.js
 * ─────────────────────────────────────────────
 * Các hàm tiện ích dùng chung toàn ứng dụng.
 * Không phụ thuộc vào state hay DOM cụ thể.
 */

const Utils = (() => {

  /**
   * Format ngày giờ sang tiếng Việt
   * @param {string|Date} str
   * @returns {string}
   */
  function fmtDate(str) {
    if (!str) return '';
    const d = new Date(str);
    return d.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  /**
   * Escape HTML để tránh XSS
   * @param {string} s
   * @returns {string}
   */
  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Lấy chữ cái đầu viết hoa của tên
   * @param {string} name
   * @returns {string}
   */
  function getInitial(name) {
    return (name || '?').charAt(0).toUpperCase();
  }

  /**
   * Kiểm tra trình duyệt có hỗ trợ PWA không
   * @returns {boolean}
   */
  function checkBrowserSupport() {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Lưu dữ liệu vào sessionStorage (JSON)
   * @param {string} key
   * @param {*} value
   */
  function saveSession(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  /**
   * Đọc dữ liệu từ sessionStorage
   * @param {string} key
   * @returns {*|null}
   */
  function loadSession(key) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Xóa dữ liệu sessionStorage
   * @param {string} key
   */
  function clearSession(key) {
    sessionStorage.removeItem(key);
  }

  return { fmtDate, escHtml, getInitial, checkBrowserSupport, saveSession, loadSession, clearSession };
})();
