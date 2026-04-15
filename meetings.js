/**
 * meetings.js
 * ─────────────────────────────────────────────
 * Quản lý toàn bộ chức năng liên quan đến cuộc họp:
 *   - Admin: tạo thông báo, load danh sách, xem thống kê
 *   - User: load danh sách, gửi RSVP
 *
 * Phụ thuộc: Api, UI, Utils, App (cho currentUser)
 */

const Meetings = (() => {

  // ── ADMIN: LOAD STATS ────────────────────────

  async function loadAdminStats() {
    try {
      const res = await Api.getStats();
      if (!res) return;
      document.getElementById('stat-total').textContent  = res.totalNotifications ?? '—';
      document.getElementById('stat-users').textContent  = res.totalUsers ?? '—';
      document.getElementById('stat-active').textContent = res.activeToday ?? '—';
    } catch {
      // silent — stats không critical
    }
  }

  // ── ADMIN: CREATE MEETING ────────────────────

  async function createMeeting() {
    const title = document.getElementById('noti-title').value.trim();
    const body  = document.getElementById('noti-body').value.trim();
    const start = document.getElementById('noti-start').value;
    const end   = document.getElementById('noti-end').value;

    // Validate
    if (!title || !body) {
      return UI.showSendResult('Vui lòng nhập tiêu đề và nội dung!', 'error');
    }
    if (!start || !end) {
      return UI.showSendResult('Vui lòng chọn thời gian bắt đầu và deadline!', 'error');
    }
    if (new Date(end) <= new Date(start)) {
      return UI.showSendResult('Hạn đăng ký phải sau ngày bắt đầu!', 'error');
    }

    const btn = document.getElementById('send-btn');
    UI.btnLoading(btn, 'Đang gửi...');

    try {
      const res = await Api.createMeeting({ title, body, startDate: start, endDate: end });
      if (res.success) {
        UI.showSendResult('✅ ' + res.message, 'success');
        _resetCreateForm();
        loadMeetings();
        loadAdminStats();
      } else {
        throw new Error(res.error || 'Gửi thất bại.');
      }
    } catch (err) {
      UI.showSendResult('❌ ' + err.message, 'error');
    } finally {
      UI.btnRestore(btn);
    }
  }

  function _resetCreateForm() {
    ['noti-title', 'noti-body', 'noti-start', 'noti-end'].forEach(id => {
      document.getElementById(id).value = '';
    });
  }

  // ── LOAD MEETINGS (Admin & User) ─────────────

  async function loadMeetings() {
    const user    = App.getCurrentUser();
    const isAdmin = user && user.rule === 'admin';
    const listId  = isAdmin ? 'admin-meeting-list' : 'user-meeting-list';
    const el      = document.getElementById(listId);

    el.innerHTML = UI.loadingState();

    try {
      const res = await Api.getMeetings();
      if (!res || !res.meetings || res.meetings.length === 0) {
        el.innerHTML = UI.emptyState(
          isAdmin ? 'Chưa có cuộc họp nào. Tạo thông báo đầu tiên!' : 'Không có cuộc họp nào đang chờ xác nhận.'
        );
        return;
      }

      el.innerHTML = '';
      res.meetings.forEach(m => {
        const card = isAdmin
          ? UI.buildAdminCard(m)
          : UI.buildUserCard(m, _handleRSVP);
        el.appendChild(card);
      });

    } catch (err) {
      el.innerHTML = `<div class="empty"><p style="color:var(--red)">Lỗi: ${Utils.escHtml(err.message)}</p></div>`;
    }
  }

  // ── USER: RSVP ───────────────────────────────

  async function _handleRSVP(meetingId, response, btnEl) {
    const row = btnEl.closest('.rsvp-row');
    // Disable tất cả nút trong row khi đang gửi
    row.querySelectorAll('button').forEach(b => b.disabled = true);

    try {
      const user = App.getCurrentUser();
      const res  = await Api.submitRSVP(meetingId, response, user.fcmToken);

      if (res.success) {
        UI.markRSVPChosen(meetingId, response);
        UI.showPopup('Đã ghi nhận!', 'Phản hồi của bạn: ' + response);
      } else {
        throw new Error(res.error || 'Có lỗi khi gửi phản hồi.');
      }
    } catch (err) {
      alert(err.message);
      // Re-enable nút nếu lỗi
      row.querySelectorAll('button').forEach(b => b.disabled = false);
    }
  }

  return { loadMeetings, createMeeting, loadAdminStats };
})();
