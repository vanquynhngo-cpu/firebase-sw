/**
 * app.js
 * ─────────────────────────────────────────────
 * Điều phối trung tâm của ứng dụng:
 * - Khởi tạo Firebase Messaging
 * - Xử lý foreground push notification
 * - Chuyển đổi màn hình (Auth ↔ App)
 * - Cung cấp currentUser và sessionToken cho các module khác
 *
 * Phụ thuộc: CONFIG, Auth, Meetings, UI, Utils
 */

const App = (() => {

  let _currentUser = null;

  // ── GETTER ───────────────────────────────────

  function getCurrentUser() {
    return _currentUser;
  }

  // Thêm hàm lấy sessionToken để các API hoặc Module khác có thể sử dụng
  function getSessionToken() {
    return localStorage.getItem('sessionToken');
  }

  // ── FIREBASE MESSAGING INIT ──────────────────

  function _initMessaging() {
    firebase.initializeApp(CONFIG.FIREBASE);
    const messaging = firebase.messaging();

    // Foreground message handler
    messaging.onMessage(payload => {
      const { title, body } = payload.notification;
      UI.showPopup(title, body);
      
      if (_currentUser) {
        // Load lại danh sách với sessionToken hiện tại
        const sessionToken = localStorage.getItem('sessionToken');
        if (sessionToken) Meetings.loadMeetings(sessionToken);
      }
    });

    return messaging;
  }

  // ── ON LOGIN SUCCESS (callback từ Auth) ──────

  function onLoginSuccess(user) {
    _currentUser = user;
    _renderTopbar(user);
    _showView(user.rule === 'admin');
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').classList.add('visible');
  }

  // ── TOPBAR RENDER ────────────────────────────

  function _renderTopbar(user) {
    const name    = user.displayName || 'Người dùng';
    const isAdmin = user.rule === 'admin';

    document.getElementById('user-display-name').textContent = name;
    document.getElementById('avatar-letter').textContent      = Utils.getInitial(name);

    const pill = document.getElementById('role-pill');
    pill.textContent = isAdmin ? 'Admin' : 'User';
    pill.className   = 'role-pill ' + (isAdmin ? 'admin' : 'user');
  }

  // ── VIEW SWITCH & LOAD USER DATA ─────────────

  function _showView(isAdmin) {
    document.getElementById('admin-view').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('user-view').style.display  = isAdmin ? 'none'  : 'block';

    // ==========================================
    // LOAD USER / DATA VỚI SESSION TOKEN
    // ==========================================
    const sessionToken = localStorage.getItem('sessionToken');

    // Chỉ load dữ liệu khi tồn tại sessionToken để đảm bảo gọi API không bị lỗi Unauthorized
    if (sessionToken) {
      if (isAdmin) {
        // Truyền sessionToken sang module Meetings (nếu module Meetings yêu cầu)
        Meetings.loadAdminStats(sessionToken);
      }
      Meetings.loadMeetings(sessionToken);
    } else {
      // Nếu không có sessionToken (bị mất/xóa), ép đăng xuất
      Auth.logout();
    }
  }

  // ── INIT ─────────────────────────────────────

  function init() {
    // Kiểm tra hỗ trợ trình duyệt
    if (!Utils.checkBrowserSupport()) {
      UI.showAuthStatus('Trình duyệt không hỗ trợ. Dùng Chrome hoặc Edge.', 'error');
      document.getElementById('auth-btn').disabled = true;
      return;
    }

    const messaging = _initMessaging();
    Auth.init(messaging);

    // Thử restore session từ Auth (Auth sẽ check cả user info và sessionToken)
    Auth.restoreSession();
  }

  return { 
    init, 
    getCurrentUser, 
    getSessionToken, // Export ra ngoài để các module khác dùng
    onLoginSuccess 
  };
})();

// ── KHỞI ĐỘNG KHI DOM READY ──────────────────
window.addEventListener('load', () => App.init());
