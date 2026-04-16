const Meetings = (() => {

  // ─────────────────────────────
  // ADMIN: LOAD STATS
  // ─────────────────────────────
  async function loadAdminStats() {
    try {
      const res = await Api.getStats();
      if (!res) return;

      document.getElementById('stat-total').textContent  = res.totalNotifications ?? '—';
      document.getElementById('stat-users').textContent  = res.totalUsers ?? '—';
      document.getElementById('stat-active').textContent = res.activeToday ?? '—';
    } catch {}
  }

  // ─────────────────────────────
  // ADMIN: CREATE MEETING
  // ─────────────────────────────
  async function createMeeting() {
    const title = document.getElementById('noti-title').value.trim();
    const body  = document.getElementById('noti-body').value.trim();
    const start = document.getElementById('noti-start').value;
    const end   = document.getElementById('noti-end').value;

    if (!title || !body) {
      return UI.showSendResult('Vui lòng nhập tiêu đề và nội dung!', 'error');
    }

    if (!start || !end) {
      return UI.showSendResult('Vui lòng chọn thời gian!', 'error');
    }

    if (new Date(end) <= new Date(start)) {
      return UI.showSendResult('Deadline phải sau ngày bắt đầu!', 'error');
    }

    const btn = document.getElementById('send-btn');
    UI.btnLoading(btn, 'Đang gửi...');

    try {
      const user = App.getCurrentUser();

      const res = await Api.createMeeting({
        title,
        body,
        startDate: start,
        endDate: end,
        token: user?.fcmToken
      });

      if (res.success) {
        UI.showSendResult('✅ ' + res.message, 'success');
        _resetForm();
        await loadMeetings(); // reload ngay
        loadAdminStats();
      } else {
        throw new Error(res.error || 'Gửi thất bại');
      }

    } catch (err) {
      UI.showSendResult('❌ ' + err.message, 'error');
    } finally {
      UI.btnRestore(btn);
    }
  }

  function _resetForm() {
    ['noti-title', 'noti-body', 'noti-start', 'noti-end']
      .forEach(id => document.getElementById(id).value = '');
  }

  // ─────────────────────────────
  // LOAD MEETINGS
  // ─────────────────────────────
  async function loadMeetings() {
    const user    = App.getCurrentUser();
    const isAdmin = user && user.rule === 'admin';

    const listId = isAdmin ? 'admin-meeting-list' : 'user-meeting-list';
    const el     = document.getElementById(listId);

    el.innerHTML = UI.loadingState();

    try {
      const res = await Api.getMeetings(user?.fcmToken);

      if (!res?.meetings?.length) {
        el.innerHTML = UI.emptyState(
          isAdmin ? 'Chưa có cuộc họp nào.' : 'Không có cuộc họp cần phản hồi.'
        );
        return;
      }

      el.innerHTML = '';

      res.meetings.forEach(m => {
        const card = isAdmin
          ? _buildAdminCard(m)
          : UI.buildUserCard(m, _handleRSVP);

        el.appendChild(card);
      });

    } catch (err) {
      el.innerHTML = `<div class="empty"><p style="color:red">${err.message}</p></div>`;
    }
  }

  // ─────────────────────────────
  // ADMIN CARD
  // ─────────────────────────────
  function _buildAdminCard(m) {
    const div = document.createElement('div');
    div.className = 'meeting-card';

    const expired = m.endDate && new Date() > new Date(m.endDate);

    div.innerHTML = `
      <div class="meeting-header">
        <div>
          <div class="meeting-name">${Utils.escHtml(m.title)}</div>
          <div class="meeting-body">${Utils.escHtml(m.body)}</div>
        </div>
        <span class="badge ${expired ? 'badge-expired' : 'badge-active'}">
          ${expired ? 'Đã kết thúc' : 'Đang mở'}
        </span>
      </div>

      <div class="meeting-meta">
        ${m.startDate ? `<span>📅 ${Utils.fmtDate(m.startDate)}</span>` : ''}
        ${m.endDate ? `<span>⏰ Hạn: ${Utils.fmtDate(m.endDate)}</span>` : ''}
      </div>

      <div style="font-size:11px;color:#888;margin-bottom:10px">
        ID: ${m.id}
      </div>

      <div class="response-summary">
        <div class="res-chip yes">✅ ${m.yesCount}</div>
        <div class="res-chip no">❌ ${m.noCount}</div>
        <div class="res-chip pending">⏳ ${m.pendingCount}</div>
      </div>

      <div style="margin-top:10px;font-size:12px;color:#555">
        % tham gia: <b>${m.percentYes ?? 0}%</b>
      </div>
    `;

    return div;
  }

  // ─────────────────────────────
  // USER RSVP
  // ─────────────────────────────
  async function _handleRSVP(meetingId, response, btnEl) {
    const row = btnEl.closest('.rsvp-row');

    row.querySelectorAll('button').forEach(b => b.disabled = true);

    try {
      const user = App.getCurrentUser();

      const res = await Api.submitRSVP(
        meetingId,
        response,
        user.fcmToken
      );

      if (!res.success) {
        throw new Error(res.error || 'Lỗi gửi phản hồi');
      }

      UI.showPopup('Đã ghi nhận', 'Bạn chọn: ' + response);

      // 🔥 QUAN TRỌNG: reload lại list để cập nhật myResponse
      await loadMeetings();

    } catch (err) {
      alert(err.message);
      row.querySelectorAll('button').forEach(b => b.disabled = false);
    }
  }

  return {
    loadMeetings,
    createMeeting,
    loadAdminStats
  };

})();
