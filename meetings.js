const Meetings = (() => {

  let _meetingCache = {};
  
  // Các biến dùng cho Pagination
  let _allMeetings = [];
  let _displayedCount = 0;
  const LIMIT = 20;

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
      const res = await Api.createMeeting({
        title,
        body,
        startDate: start,
        endDate: end
      });

      if (!res.success) {
        throw new Error(res.error || 'Gửi thất bại');
      }

      UI.showSendResult('✅ ' + res.message, 'success');

      _resetForm();
      await loadMeetings();
      loadAdminStats();

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
    _meetingCache = {};
    _allMeetings = [];
    _displayedCount = 0;

    const user    = App.getCurrentUser();
    const isAdmin = user && user.rule === 'admin';

    const listId = isAdmin ? 'admin-meeting-list' : 'user-meeting-list';
    const el     = document.getElementById(listId);

    el.innerHTML = UI.loadingState();

    try {
      const res = await Api.getMeetings();

      if (!res?.meetings?.length) {
        el.innerHTML = UI.emptyState(
          isAdmin ? 'Chưa có cuộc họp nào.' : 'Không có cuộc họp cần phản hồi.'
        );
        return;
      }

      // Sắp xếp
      const meetings = [...res.meetings].sort((a, b) => {
        const now = new Date();
        const aExpired = a.endDate && new Date(a.endDate) < now;
        const bExpired = b.endDate && new Date(b.endDate) < now;

        if (aExpired !== bExpired) return aExpired ? 1 : -1;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });

      // Lọc meeting hết hạn đối với User
      if (!isAdmin) {
        _allMeetings = meetings.filter(m => !(m.endDate && new Date(m.endDate) < new Date()));
      } else {
        _allMeetings = meetings;
      }

      if (!_allMeetings.length) {
        el.innerHTML = UI.emptyState('Không có cuộc họp nào đang diễn ra');
        return;
      }

      el.innerHTML = '';
      
      // Gọi hàm render list theo cục (batch)
      _renderNextBatch(el, isAdmin);

    } catch (err) {
      el.innerHTML = `<div class="empty"><p style="color:red">${err.message}</p></div>`;
    }
  }

  // ==========================================
  // 🔥 CHỈ RENDER 20 ITEM VÀ XỬ LÝ LOAD MORE
  // ==========================================
  function _renderNextBatch(el, isAdmin) {
    // Xóa nút "Tải thêm" cũ trước khi append dữ liệu mới
    const oldLoadMoreBtn = document.getElementById('load-more-btn');
    if (oldLoadMoreBtn) oldLoadMoreBtn.remove();

    // Cắt mảng 20 phần tử tiếp theo
    const nextBatch = _allMeetings.slice(_displayedCount, _displayedCount + LIMIT);

    nextBatch.forEach(m => {
      _meetingCache[m.id] = m;
      const card = isAdmin
        ? _buildAdminCard(m)
        : UI.buildUserCard(m, _handleRSVP);
      el.appendChild(card);
    });

    _displayedCount += nextBatch.length;

    // Nếu vẫn còn dữ liệu chưa render, tạo nút "Tải thêm"
    if (_displayedCount < _allMeetings.length) {
      const btn = document.createElement('button');
      btn.id = 'load-more-btn';
      btn.className = 'btn-secondary'; // Dùng class có sẵn trong CSS của bạn
      btn.style.width = '100%';
      btn.style.padding = '10px';
      btn.style.marginTop = '15px';
      btn.style.borderRadius = '8px';
      btn.style.cursor = 'pointer';
      btn.textContent = `Tải thêm (${_allMeetings.length - _displayedCount} mục nữa)`;
      btn.onclick = () => _renderNextBatch(el, isAdmin);
      
      el.appendChild(btn);
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
        <div class="res-chip yes" onclick="Meetings.showUsers('yes', '${m.id}')">
          ✅ ${m.yesCount}
        </div>
        <div class="res-chip no" onclick="Meetings.showUsers('no', '${m.id}')">
          ❌ ${m.noCount}
        </div>
        <div class="res-chip pending" onclick="Meetings.showUsers('pending', '${m.id}')">
          ⏳ ${m.pendingCount}
        </div>
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
  async function _handleRSVP(meetingId, response, btn) {
        const cardElement = btn.closest('.meeting-card');
        const row = btn.closest('.rsvp-row');

        // ── LƯU TRẠNG THÁI CŨ ĐỂ ROLLBACK NẾU API THẤT BẠI ──
        const m = _meetingCache[meetingId];
        const previousResponse = m ? m.myResponse : null;

        // Disable tất cả button trong row, thêm class loading
        row.querySelectorAll('button').forEach(b => {
            b.disabled = true;
            b.style.opacity = '0.6';
        });

        // Hiển thị trạng thái đang gửi ngay lập tức (feedback nhanh cho user)
        btn.textContent = btn.dataset.response === 'Tham gia'
            ? '⏳ Đang gửi...'
            : '⏳ Đang gửi...';

        try {
            const res = await Api.submitRSVP(meetingId, response);

            if (!res.success) {
            throw new Error(res.error || 'Lỗi gửi phản hồi');
            }

            // ── API THÀNH CÔNG → CẬP NHẬT CACHE VÀ RENDER LẠI CARD ──
            if (m) {
            const isUpdate = !!m.myResponse;
            m.myResponse = response;

            const newCardElement = UI.buildUserCard(m, _handleRSVP);
            if (cardElement) cardElement.replaceWith(newCardElement);

            UI.showPopup(
                isUpdate ? 'Đã cập nhật' : 'Đã ghi nhận',
                'Bạn chọn: ' + response
            );
            }

        } catch (e) {
            // ── API THẤT BẠI → ROLLBACK VỀ TRẠNG THÁI CŨ ──
            if (m) {
            // Khôi phục myResponse về giá trị trước đó
            m.myResponse = previousResponse;

            // Render lại card với trạng thái cũ
            const rolledBackCard = UI.buildUserCard(m, _handleRSVP);
            if (cardElement) cardElement.replaceWith(rolledBackCard);
            } else {
            // Fallback nếu không có cache: chỉ re-enable button
            row.querySelectorAll('button').forEach(b => {
                b.disabled = false;
                b.style.opacity = '';
            });
            }

            // Hiển thị lỗi rõ ràng cho user
            UI.showPopup('❌ Gửi thất bại', e.message || 'Vui lòng thử lại.');
        }
    }

  // ─────────────────────────────
  // SHOW USERS (MODAL)
  // ─────────────────────────────
  function showUsers(type, meetingId) {
    const m = _meetingCache[meetingId];
    if (!m) return;

    let list = [];
    let title = '';

    if (type === 'yes') {
      list = m.yesUsers || [];
      title = 'Danh sách tham gia';
    }

    if (type === 'no') {
      list = m.noUsers || [];
      title = 'Danh sách vắng mặt';
    }

    if (type === 'pending') {
      list = m.pendingUsers || [];
      title = 'Chưa phản hồi';
    }

    UI.showUserModal(title, list);
  }

  return {
    loadMeetings,
    createMeeting,
    loadAdminStats,
    showUsers
  };

})();
