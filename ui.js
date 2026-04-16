const UI = (() => {

  let _popupTimer = null;

  // ─────────────────────────────
  // POPUP
  // ─────────────────────────────
  function showPopup(title, body) {
    document.getElementById('popup-title').textContent = title;
    document.getElementById('popup-body').textContent  = body;

    const p = document.getElementById('popup');
    p.classList.add('show');

    clearTimeout(_popupTimer);
    _popupTimer = setTimeout(() => {
      p.classList.remove('show');
    }, CONFIG.POPUP_DURATION);
  }

  function closePopup() {
    document.getElementById('popup').classList.remove('show');
    clearTimeout(_popupTimer);
  }

  // ─────────────────────────────
  // STATUS
  // ─────────────────────────────
  function showAuthStatus(msg, type) {
    const el = document.getElementById('auth-status');
    el.textContent = msg;
    el.className   = 'status-msg ' + type;
  }

  function showSendResult(msg, type) {
    const el = document.getElementById('send-result');
    el.textContent = msg;
    el.className   = 'send-result ' + type;

    setTimeout(() => {
      el.style.display = 'none';
    }, CONFIG.RESULT_DURATION);
  }

  // ─────────────────────────────
  // BUTTON
  // ─────────────────────────────
  function btnLoading(btn, text = 'Đang xử lý...') {
    btn.disabled  = true;
    btn._origHTML = btn.innerHTML;
    btn.innerHTML = `<span class="loader"></span> ${text}`;
  }

  function btnRestore(btn) {
    btn.disabled  = false;
    btn.innerHTML = btn._origHTML || btn.textContent;
  }

  // ─────────────────────────────
  // EMPTY + LOADING
  // ─────────────────────────────
  function emptyState(message) {
    return `
      <div class="empty">
        <p>${message}</p>
      </div>
    `;
  }

  function loadingState() {
    return `<div style="padding:20px;text-align:center">Đang tải...</div>`;
  }

  // ─────────────────────────────
  // HELPER
  // ─────────────────────────────
  function _statusBadge(endDate) {
    const expired = endDate && new Date() > new Date(endDate);
    return `<span class="badge ${expired ? 'badge-expired' : 'badge-active'}">
      ${expired ? 'Đã kết thúc' : 'Đang mở'}
    </span>`;
  }

  function _metaRow(m) {
    return `
      <div class="meeting-meta">
        ${m.startDate ? `<span>📅 ${Utils.fmtDate(m.startDate)}</span>` : ''}
        ${m.endDate ? `<span>⏰ ${Utils.fmtDate(m.endDate)}</span>` : ''}
      </div>
    `;
  }

  // ─────────────────────────────
  // USER CARD
  // ─────────────────────────────
  function buildUserCard(m, onRSVP) {
    const div = document.createElement('div');
    div.className = 'meeting-card';

    const expired = m.endDate && new Date() > new Date(m.endDate);

    let rsvpHTML = '';

    if (m.myResponse) {
      const isYes = m.myResponse === 'Tham gia';
      const bg  = isYes ? 'var(--green-s)' : 'var(--red-s)';
      const col = isYes ? 'var(--green)'   : 'var(--red)';

      rsvpHTML = `
        <div style="
          margin-top:10px;
          padding:10px;
          border-radius:8px;
          background:${bg};
          color:${col};
        ">
          Bạn đã chọn: <b>${Utils.escHtml(m.myResponse)}</b>
        </div>
      `;
    } else {
      rsvpHTML = `
        <div class="rsvp-row">
          <button class="btn-yes" data-response="Tham gia" ${expired ? 'disabled' : ''}>✅ Tham gia</button>
          <button class="btn-no"  data-response="Không tham gia" ${expired ? 'disabled' : ''}>❌ Vắng mặt</button>
        </div>
      `;
    }

    div.innerHTML = `
      <div class="meeting-header">
        <div>
          <div class="meeting-name">${Utils.escHtml(m.title)}</div>
          <div class="meeting-body">${Utils.escHtml(m.body)}</div>
        </div>
        ${_statusBadge(m.endDate)}
      </div>

      ${_metaRow(m)}
      ${rsvpHTML}
    `;

    if (!m.myResponse) {
      div.querySelectorAll('.rsvp-row button').forEach(btn => {
        btn.addEventListener('click', () =>
          onRSVP(m.id, btn.dataset.response, btn)
        );
      });
    }

    return div;
  }

  // ─────────────────────────────
  // MODAL USER LIST
  // ─────────────────────────────
  function showUserModal(title, users) {
    const modal   = document.getElementById('user-modal');
    const titleEl = document.getElementById('modal-title');
    const content = document.getElementById('modal-content');

    titleEl.textContent = title;

    if (!users || users.length === 0) {
      content.innerHTML = `<div>Không có dữ liệu</div>`;
    } else {
      content.innerHTML = users.map(u =>
        `<div class="modal-user">• ${Utils.escHtml(u)}</div>`
      ).join('');
    }

    modal.classList.add('show');
  }

  function closeUserModal() {
    document.getElementById('user-modal').classList.remove('show');
  }

  return {
    showPopup,
    closePopup,
    showAuthStatus,
    showSendResult,
    btnLoading,
    btnRestore,
    emptyState,
    loadingState,
    buildUserCard,
    showUserModal,
    closeUserModal
  };

})();
