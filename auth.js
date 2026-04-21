/**
 * auth.js
 * ─────────────────────────────────────────────
 * Quản lý toàn bộ luồng xác thực:
 * - Chuyển tab Login / Register
 * - Xin quyền thông báo & lấy FCM token
 * - Gọi API đăng nhập / đăng ký
 * - Lưu/xóa session
 * - Đăng xuất có gọi API giải phóng slot (giới hạn 30 user)
 *
 * Phụ thuộc: CONFIG, Api, Utils, UI, App (callback)
 *
 * Thay đổi so với phiên bản cũ:
 * - logout() gọi Api.logout() trước khi xóa dữ liệu local
 *   → giải phóng slot ngay lập tức thay vì chờ timeout 5 phút
 * - Xử lý thông báo quá tải rõ ràng hơn trong handleAuth()
 */

const Auth = (() => {

  let _isLogin   = true;   // true = login tab, false = register tab
  let _messaging = null;   // Firebase Messaging instance

  // ── INIT ─────────────────────────────────────

  function init(messagingInstance) {
    _messaging = messagingInstance;
  }

  // ── TAB SWITCH ───────────────────────────────

  function switchTab(mode) {
    _isLogin = (mode === 'login');
    document.getElementById('tab-login').classList.toggle('active',  _isLogin);
    document.getElementById('tab-reg').classList.toggle('active',   !_isLogin);
    document.getElementById('name-field').style.display    = _isLogin ? 'none'        : 'block';
    document.getElementById('auth-btn').textContent        = _isLogin ? 'Đăng nhập'   : 'Tạo tài khoản';
    document.getElementById('auth-status').style.display  = 'none';
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

    // Khai báo btn lên đầu để dùng được trong cả validate lẫn loading
    const btn = document.getElementById('auth-btn');

    // Validate — return sớm, chưa loading nên không cần btnRestore
    if (!phone || !password) {
      return UI.showAuthStatus('❌ Vui lòng nhập SĐT và mật khẩu!', 'error');
    }
    if (!_isLogin && !name) {
      return UI.showAuthStatus('❌ Vui lòng nhập tên hiển thị!', 'error');
    }

    UI.btnLoading(btn, _isLogin ? 'Đang đăng nhập...' : 'Đang tạo tài khoản...');

    try {
      UI.showAuthStatus('Đang thiết lập thiết bị...', 'info');
      const fcmToken = await _getFCMToken();

      UI.showAuthStatus('Đang xác thực...', 'info');

      let user;

      if (_isLogin) {
        const res = await Api.login(phone, password, fcmToken);

        // ── XỬ LÝ TRƯỜNG HỢP QUÁ TẢI (≥ 30 user đồng thời) ──
        // Server trả về success: false kèm thông báo số lượng
        // → Hiển thị rõ ràng, không nhầm với lỗi sai mật khẩu
        if (!res.success) {
          throw new Error(res.error || 'Xác thực thất bại.');
        }

        if (res.sessionToken) {
          localStorage.setItem('sessionToken', res.sessionToken);
        }

        user = res.user;

      } else {
        const res = await Api.register(phone, password, name, fcmToken);
        if (!res.success) throw new Error(res.error || 'Đăng ký thất bại.');
        user = { displayName: name, rule: 'user', userId: res.userId };
      }

      user.fcmToken = fcmToken;
      Utils.saveSession('user', user);
      App.onLoginSuccess(user);

    } catch (err) {
      UI.showAuthStatus('❌ ' + err.message, 'error');
      UI.btnRestore(btn);
    }
  }

  // ── LOGOUT ───────────────────────────────────

  async function logout() {
    const sessionToken = localStorage.getItem('sessionToken');

    // ── GỌI API TRƯỚC ĐỂ GIẢI PHÓNG SLOT NGAY LẬP TỨC ──
    // Không await lâu — dùng try/catch để không block UI nếu mạng yếu.
    // Dù API có lỗi hay không, vẫn xóa local session và về màn hình login.
    if (sessionToken) {
      try {
        await Api.logout(sessionToken);
      } catch (_) {
        // Bỏ qua lỗi mạng — local session vẫn bị xóa bình thường
      }
    }

    // ── XÓA TOÀN BỘ DỮ LIỆU LOCAL ──
    Utils.clearSession('user');
    localStorage.removeItem('sessionToken');
    sessionStorage.removeItem('meetings_data'); // Xóa cache cuộc họp

    // ── RESET FORM ──
    document.getElementById('auth-phone').value          = '';
    document.getElementById('auth-password').value       = '';
    document.getElementById('auth-name').value           = '';
    document.getElementById('auth-status').style.display = 'none';
    document.getElementById('auth-btn').disabled         = false;
    document.getElementById('auth-btn').textContent      = 'Đăng nhập';

    // ── CHUYỂN VỀ MÀN HÌNH LOGIN ──
    document.getElementById('app-screen').classList.remove('visible');
    document.getElementById('auth-screen').style.display = 'flex';
  }

  // ── RESTORE SESSION ──────────────────────────

  function restoreSession() {
    const saved        = Utils.loadSession('user');
    const sessionToken = localStorage.getItem('sessionToken');

    // Chỉ phục hồi khi có cả thông tin user (để hiển thị)
    // và sessionToken (để gọi API hợp lệ)
    if (saved && sessionToken) {
      App.onLoginSuccess(saved);
      return true;
    }
    return false;
  }

  return { init, switchTab, handleAuth, logout, restoreSession };
})();
