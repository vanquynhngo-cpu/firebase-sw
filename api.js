/**
 * api.js
 * ─────────────────────────────────────────────
 * Toàn bộ giao tiếp với Google Apps Script backend.
 * Thêm endpoint mới chỉ cần thêm function ở đây.
 *
 * Thay đổi so với phiên bản cũ:
 * - Thêm hàm logout() → gọi API giải phóng slot trên server
 * - Export thêm logout trong return
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
   * @param {string} token - FCM token (để nhận Push)
   * @returns {Promise<{success, user?, sessionToken?, error?}>}
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

  /**
   * Đăng xuất — gọi server để xóa Session Token & Last Active,
   * giải phóng slot trong giới hạn 30 user đồng thời.
   * @param {string} sessionToken
   * @returns {Promise<{success}>}
   */
  async function logout(sessionToken) {
    return _post({ action: 'logout', sessionToken });
  }

  // ── MEETINGS (CẦN SESSION TOKEN) ──────────────

  /**
   * Lấy danh sách tất cả cuộc họp
   * @param {boolean} forceRefresh - Bỏ qua cache và tải lại từ server
   * @returns {Promise<{meetings: Array}>}
   */
  async function getMeetings(forceRefresh = false) {
    const CACHE_KEY    = 'meetings_data';
    const sessionToken = localStorage.getItem('sessionToken');

    // Lấy thông tin user hiện tại để kiểm tra quyền
    const user    = JSON.parse(sessionStorage.getItem('user') || '{}');
    const isAdmin = user?.rule === 'admin';

    // ADMIN: Luôn gọi API để lấy dữ liệu mới nhất (bao gồm danh sách user điểm danh)
    if (isAdmin) {
      return await _get({ action: 'getMeetings', sessionToken });
    }

    // ── LUỒNG DÀNH CHO USER BÌNH THƯỜNG (CÓ CACHE) ──

    // 1. Thử lấy từ cache trước (nếu không ép reload)
    if (!forceRefresh) {
      try {
        const cachedData = sessionStorage.getItem(CACHE_KEY);
        if (cachedData) return JSON.parse(cachedData);
      } catch {
        sessionStorage.removeItem(CACHE_KEY);
      }
    }

    // 2. Gọi API nếu không có cache hoặc ép reload
    const data = await _get({ action: 'getMeetings', sessionToken });

    if (!data?.meetings) return data;

    // 3. Lưu slim cache (loại bỏ danh sách user chi tiết — chỉ dành cho User)
    try {
      const slim = {
        meetings: data.meetings.map(({ yesUsers, noUsers, pendingUsers, ...rest }) => rest)
      };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(slim));
    } catch {
      // Data quá lớn (rất hiếm) → bỏ qua cache, không crash
      sessionStorage.removeItem(CACHE_KEY);
    }

    // 4. Trả về data đầy đủ để dùng ngay trong lượt render hiện tại
    return data;
  }

  /**
   * Tạo thông báo cuộc họp mới (Admin)
   * @param {{title, body, startDate, endDate}} data
   * @returns {Promise<{success, message?, error?}>}
   */
  async function createMeeting({ title, body, startDate, endDate }) {
    return _post({
      action: 'createMeetingNotification',
      title,
      body,
      startDate,
      endDate,
      sessionToken: localStorage.getItem('sessionToken')
    });
  }

  /**
   * Gửi phản hồi tham gia / vắng mặt (User)
   * @param {string} notificationId
   * @param {string} response - 'Tham gia' | 'Không tham gia'
   * @returns {Promise<{success, error?}>}
   */
  async function submitRSVP(notificationId, response) {
    const result = await _post({
      action: 'submitResponse',
      notificationId,
      response,
      sessionToken: localStorage.getItem('sessionToken')
    });

    // Xoá cache ngay sau khi submit thành công
    // → lần gọi getMeetings tiếp theo bắt buộc lấy data mới từ server
    if (result.success) {
      sessionStorage.removeItem('meetings_data');
    }

    return result;
  }

  // ── STATS (CẦN SESSION TOKEN - Admin) ─────────

  /**
   * Lấy thống kê tổng quan (Admin)
   * @returns {Promise<{totalNotifications, totalUsers, activeToday}>}
   */
  async function getStats() {
    return _get({
      action: 'getStats',
      sessionToken: localStorage.getItem('sessionToken')
    });
  }

  // ─────────────────────────────────────────────
  return { login, register, logout, getMeetings, createMeeting, submitRSVP, getStats };
})();
