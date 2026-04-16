/**
 * api.js
 * ─────────────────────────────────────────────
 * Toàn bộ giao tiếp với Google Apps Script backend.
 * Thêm endpoint mới chỉ cần thêm function ở đây.
 */

const Api = (() => {

  // ── PRIVATE: raw request helpers ────────────

  async function _post(payload) {
    const r = await fetch(CONFIG.GAS_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }

  async function _get(params) {
    const qs = new URLSearchParams(params).toString();
    const r  = await fetch(CONFIG.GAS_URL + '?' + qs);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }

  // ── AUTH ─────────────────────────────────────

  /**
   * Đăng nhập tài khoản
   * @param {string} phone
   * @param {string} password
   * @param {string} token - FCM token
   * @returns {Promise<{success, user?, error?}>}
   */
  async function login(phone, password, token) {
    return _post({ action: 'login', phone, password, token });
  }

  /**
   * Đăng ký tài khoản mới
   * @param {string} phone
   * @param {string} password
   * @param {string} displayName
   * @param {string} token - FCM token
   * @returns {Promise<{success, userId?, error?}>}
   */
  async function register(phone, password, displayName, token) {
    return _post({ action: 'saveToken', phone, password, displayName, token });
  }

  // ── MEETINGS ─────────────────────────────────

  /**
   * Lấy danh sách tất cả cuộc họp
   * @returns {Promise<{meetings: Array}>}
   */
  async function getMeetings(token) {
    return _get({ action: 'getMeetings', token });
  }

  /**
   * Tạo thông báo cuộc họp mới (Admin)
   * @param {{title, body, startDate, endDate}} data
   * @returns {Promise<{success, message?, error?}>}
   */
  async function createMeeting({ title, body, startDate, endDate }) {
    return _post({ action: 'createMeetingNotification', title, body, startDate, endDate });
  }

  /**
   * Gửi phản hồi tham gia / vắng mặt (User)
   * @param {string} notificationId
   * @param {string} response - 'Tham gia' | 'Không tham gia'
   * @param {string} token - FCM token của user
   * @returns {Promise<{success, error?}>}
   */
  async function submitRSVP(notificationId, response, token) {
    return _post({ action: 'submitResponse', notificationId, response, token });
  }

  // ── STATS (Admin) ─────────────────────────────

  /**
   * Lấy thống kê tổng quan (Admin)
   * @returns {Promise<{totalNotifications, totalUsers, activeToday}>}
   */
  async function getStats() {
    return _get({ action: 'getStats' });
  }

  return { login, register, getMeetings, createMeeting, submitRSVP, getStats };
})();
