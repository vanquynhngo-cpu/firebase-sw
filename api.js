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

  // ── MEETINGS (CẦN SESSION TOKEN) ──────────────

  /**
   * Lấy danh sách tất cả cuộc họp
   * @returns {Promise<{meetings: Array}>}
   */
// ── MEETINGS (CẦN SESSION TOKEN) ──────────────

  /**
   * Lấy danh sách tất cả cuộc họp (Có Cache)
   * @param {boolean} forceRefresh - Bỏ qua cache và tải lại từ server
   * @returns {Promise<{meetings: Array}>}
   */
    async function getMeetings(forceRefresh = false) {
        const CACHE_KEY = 'meetings_data';

        // 1. Thử lấy từ cache trước (nếu không ép reload)
        if (!forceRefresh) {
            try {
            const cachedData = sessionStorage.getItem(CACHE_KEY);
            if (cachedData) return JSON.parse(cachedData);
            } catch {
            sessionStorage.removeItem(CACHE_KEY);
            }
        }

        // 2. Gọi API lấy data mới từ server
        const data = await _get({
            action: 'getMeetings',
            sessionToken: localStorage.getItem('sessionToken')
        });

        if (!data?.meetings) return data;

        // 3. Lưu cache phiên bản "slim" — bỏ 3 mảng tên user
        //    (chúng chỉ cần khi admin mở modal, không cần trong list view)
        try {
            const slim = {
            meetings: data.meetings.map(({ yesUsers, noUsers, pendingUsers, ...rest }) => rest)
            };
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(slim));
        } catch {
            // Data vẫn quá lớn (rất hiếm) → bỏ qua cache, không crash
            sessionStorage.removeItem(CACHE_KEY);
        }

        // 4. Trả về data đầy đủ (có cả 3 mảng tên) để dùng ngay trong session này
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
    
    // Xoá cache ngay sau khi submit thành công để lần gọi getMeetings tiếp theo phải lấy data mới
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

  return { login, register, getMeetings, createMeeting, submitRSVP, getStats };
})();
