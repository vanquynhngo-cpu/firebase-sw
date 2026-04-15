/**
 * auth.js
 * ─────────────────────────────────────────────
 * Quản lý toàn bộ luồng xác thực:
 *   - Chuyển tab Login / Register
 *   - Xin quyền thông báo & lấy FCM token
 *   - Gọi API đăng nhập / đăng ký
 *   - Lưu/xóa session
 *
 * Phụ thuộc: CONFIG, Api, Utils, UI, App (callback)
 */

const Auth = (() => {

  let _isLogin  = true;       // true = login tab, false = register tab
  let _messaging = null;      // Firebase Messaging instance

  // ── INIT ─────────────────────────────────────

  function init(messagingInstance) {
    _messaging = messagingInstance;
  }

  // ── TAB SWITCH ───────────────────────────────

  function switchTab(mode) {
    _isLogin = (mode === 'login');
    document.getElementById('tab-login').classList.toggle('active',  _isLogin);
    document.getElementById('tab-reg').classList.toggle('active',   !_isLogin);
    document.getElementById('name-field').style.display = _isLogin ? 'none' : 'block';
    document.getElementById('auth-btn').textContent     = _isLogin ? 'Đăng nhập' : 'Tạo tài khoản';
    document.getElementById('auth-status').style.display = 'none';
  }

  // ── FCM TOKEN ────────────────────────────────

  async function _getFCMToken() {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      throw new Error('Vui lòng cho phép nhận thông báo để sử dụng ứng dụng.');
    }
    const swReg = await navigator.serviceWorker.register(CONFIG.SW_URL);
    await navigator.serviceWorker.ready;
    const token = await _messaging.getToken({
      vapidKey: CONFIG.VAPID,
      serviceWorkerRegistration: swReg,
    });
    if (!token) throw new Error('Không lấy được mã thiết bị. Thử lại sau.');
    return token;
  }

  // ── HANDLE AUTH (Login hoặc Register) ────────

  async function handleAuth() {
    const phone    = document.getElementById('auth-phone').value.trim();
    const password = document.getElementById('auth-password').value.trim();
    const name     = document.getElementById('auth-name').value.trim();

    // Validate
    if (!phone || !password) {
      return UI.showAuthStatus('Vui lòng nhập SĐT và mật khẩu!', 'error');
    }
    if (!_isLogin && !name) {
      return UI.showAuthStatus('Vui lòng nhập tên hiển thị!', 'error');
    }

    const btn = document.getElementById('auth-btn');
    UI.btnLoading(btn, _isLogin ? 'Đang đăng nhập...' : 'Đang tạo tài khoản...');

    try {
      UI.showAuthStatus('Đang thiết lập thiết bị...', 'info');
      const fcmToken = await _getFCMToken();

      UI.showAuthStatus('Đang xác thực...', 'info');

      let user;
      if (_isLogin) {
        const res = await Api.login(phone, password, fcmToken);
        if (!res.success) throw new Error(res.error || 'Xác thực thất bại.');
        user = res.user;
      } else {
        const res = await Api.register(phone, password, name, fcmToken);
        if (!res.success) throw new Error(res.error || 'Đăng ký thất bại.');
        user = { displayName: name, rule: 'user', userId: res.userId };
      }

      user.fcmToken = fcmToken;
      Utils.saveSession('user', user);

      // Callback sang App để hiển thị giao diện
      App.onLoginSuccess(user);

    } catch (err) {
      UI.showAuthStatus(err.message, 'error');
      UI.btnRestore(btn);
    }
  }

  // ── LOGOUT ───────────────────────────────────

  function logout() {
    Utils.clearSession('user');
    // Reset form
    document.getElementById('auth-phone').value    = '';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-name').value     = '';
    document.getElementById('auth-status').style.display = 'none';
    document.getElementById('auth-btn').disabled   = false;
    document.getElementById('auth-btn').textContent = 'Đăng nhập';

    document.getElementById('app-screen').classList.remove('visible');
    document.getElementById('auth-screen').style.display = 'flex';
  }

  // ── RESTORE SESSION ──────────────────────────

  function restoreSession() {
    const saved = Utils.loadSession('user');
    if (saved) {
      App.onLoginSuccess(saved);
      return true;
    }
    return false;
  }

  return { init, switchTab, handleAuth, logout, restoreSession };
})();
