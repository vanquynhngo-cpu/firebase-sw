/**
 * app.js
 * ─────────────────────────────────────────────
 * Điều phối trung tâm của ứng dụng:
 *   - Khởi tạo Firebase Messaging
 *   - Xử lý foreground push notification
 *   - Chuyển đổi màn hình (Auth ↔ App)
 *   - Cung cấp currentUser cho các module khác
 *
 * Phụ thuộc: CONFIG, Auth, Meetings, UI, Utils
 */

const App = (() => {

  let _currentUser = null;

  // ── GETTER ───────────────────────────────────

  function getCurrentUser() {
    return _currentUser;
  }

  // ── FIREBASE MESSAGING INIT ──────────────────

  function _initMessaging() {
    firebase.initializeApp(CONFIG.FIREBASE);
    const messaging = firebase.messaging();

    // Foreground message handler
    messaging.onMessage(payload => {
      const { title, body } = payload.notification;
      UI.showPopup(title, body);
      if (_currentUser) Meetings.loadMeetings();
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

  // ── VIEW SWITCH ──────────────────────────────

  function _showView(isAdmin) {
    document.getElementById('admin-view').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('user-view').style.display  = isAdmin ? 'none'  : 'block';

    if (isAdmin) {
      Meetings.loadAdminStats();
    }
    Meetings.loadMeetings();
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

    // Thử restore session
    Auth.restoreSession();
  }

  return { init, getCurrentUser, onLoginSuccess };
})();

// ── KHỞI ĐỘNG KHI DOM READY ──────────────────
window.addEventListener('load', () => App.init());
