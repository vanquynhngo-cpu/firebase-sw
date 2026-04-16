/**
 * ui.js
 * ─────────────────────────────────────────────
 * Các component UI tái sử dụng:
 *   - Popup thông báo
 *   - Loading state cho button
 *   - Status messages (auth, send-result)
 *   - Render meeting cards (admin & user)
 */

const UI = (() => {

  // ── POPUP ────────────────────────────────────

  let _popupTimer = null;

  function showPopup(title, body) {
    document.getElementById('popup-title').textContent = title;
    document.getElementById('popup-body').textContent  = body;
    const p = document.getElementById('popup');
    p.classList.add('show');
    clearTimeout(_popupTimer);
    _popupTimer = setTimeout(() => p.classList.remove('show'), CONFIG.POPUP_DURATION);
  }

  function closePopup() {
    document.getElementById('popup').classList.remove('show');
    clearTimeout(_popupTimer);
  }

  // ── STATUS MESSAGES ──────────────────────────

  function showAuthStatus(msg, type) {
    const el = document.getElementById('auth-status');
    el.textContent = msg;
    el.className   = 'status-msg ' + type;
  }

  function showSendResult(msg, type) {
    const el = document.getElementById('send-result');
    el.textContent = msg;
    el.className   = 'send-result ' + type;
    setTimeout(() => { el.style.display = 'none'; }, CONFIG.RESULT_DURATION);
  }

  // ── BUTTON LOADING STATE ─────────────────────

  /**
   * Set nút về trạng thái loading
   * @param {HTMLButtonElement} btn
   * @param {string} loadingText
   */
  function btnLoading(btn, loadingText = 'Đang xử lý...') {
    btn.disabled   = true;
    btn._origHTML  = btn.innerHTML;
    btn.innerHTML  = `<span class="loader"></span> ${loadingText}`;
  }

  /**
   * Khôi phục nút về trạng thái bình thường
   * @param {HTMLButtonElement} btn
   */
  function btnRestore(btn) {
    btn.disabled  = false;
    btn.innerHTML = btn._origHTML || btn.textContent;
  }

  // ── EMPTY STATE ──────────────────────────────

  function emptyState(message) {
    return `
      <div class="empty">
        <svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
        <p>${message}</p>
      </div>`;
  }

  function loadingState() {
    return '<div style="padding:24px;text-align:center;color:var(--ink3);font-size:13px">Đang tải...</div>';
  }

  // ── ICON SVGs ────────────────────────────────

  const ICON = {
    calendar: `<svg viewBox="0 0 24 24"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>`,
    clock:    `<svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>`,
    id:       `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>`,
  };

  // ── MEETING BADGE ────────────────────────────

  function _statusBadge(endDate) {
    const expired = endDate && new Date() > new Date(endDate);
    return `<span class="badge ${expired ? 'badge-expired' : 'badge-active'}">${expired ? 'Đã kết thúc' : 'Đang mở'}</span>`;
  }

  function _metaRow(m) {
    return `
      <div class="meeting-meta">
        ${m.startDate ? `<span>${ICON.calendar}${Utils.fmtDate(m.startDate)}</span>` : ''}
        ${m.endDate   ? `<span>${ICON.clock}Hạn: ${Utils.fmtDate(m.endDate)}</span>` : ''}
      </div>`;
  }

  // ── ADMIN CARD ───────────────────────────────

  function buildAdminCard(m) {
    const div = document.createElement('div');
    div.className = 'meeting-card';
    div.innerHTML = `
      <div class="meeting-header">
        <div class="meeting-title-row">
          <div class="meeting-name">${Utils.escHtml(m.title)}</div>
          <div class="meeting-body">${Utils.escHtml(m.body)}</div>
        </div>
        ${_statusBadge(m.endDate)}
      </div>
      ${_metaRow(m)}
      <div style="font-size:11px;color:var(--ink3);margin-bottom:12px">ID: ${Utils.escHtml(m.id)}</div>
      <div class="response-summary">
        <div class="res-chip yes">✅ Tham gia: ${m.yesCount || 0}</div>
        <div class="res-chip no">❌ Vắng mặt: ${m.noCount || 0}</div>
        <div class="res-chip pending">⏳ Chưa trả lời: ${m.pendingCount || '?'}</div>
      </div>`;
    return div;
  }

  // ── USER CARD ────────────────────────────────

  /**
   * @param {object} m - meeting data
   * @param {Function} onRSVP - callback(meetingId, response, btnEl)
   */
  function buildUserCard(m, onRSVP) {
    const div     = document.createElement('div');
    div.className = 'meeting-card';
    const expired = m.endDate && new Date() > new Date(m.endDate);
    

    div.innerHTML = `
      <div class="meeting-header">
        <div class="meeting-title-row">
          <div class="meeting-name">${Utils.escHtml(m.title)}</div>
          <div class="meeting-body">${Utils.escHtml(m.body)}</div>
        </div>
        ${_statusBadge(m.endDate)}
      </div>
      ${_metaRow(m)}
     ${m.myResponse
  ? `
    <div style="
      margin-top:10px;
      padding:10px 12px;
      border-radius:8px;
      background: var(--accent-s);
      color: var(--accent);
      font-size:13px;
      font-weight:500;
    ">
      ✅ Bạn đã tham gia bình chọn: <b>${Utils.escHtml(m.myResponse)}</b>
    </div>
  `
  : `
    <div class="rsvp-row" id="rsvp-${m.id}">
      <button class="btn-yes" data-response="Tham gia" ${expired ? 'disabled' : ''}>
        ✅ Tham gia
      </button>
      <button class="btn-no" data-response="Không tham gia" ${expired ? 'disabled' : ''}>
        ❌ Vắng mặt
      </button>
    </div>
  `
}

    // Bind RSVP click
    div.querySelectorAll('.rsvp-row button').forEach(btn => {
      btn.addEventListener('click', () => onRSVP(m.id, btn.dataset.response, btn));
    });

    return div;
  }

  /**
   * Cập nhật UI sau khi user RSVP thành công
   * @param {string} meetingId
   * @param {string} response
   */
  function markRSVPChosen(meetingId, response) {
    const row = document.getElementById(`rsvp-${meetingId}`);
    if (!row) return;
    row.querySelectorAll('button').forEach(b => {
      b.classList.toggle('chosen', b.dataset.response === response);
      b.disabled = true;
    });
    // Thêm note nếu chưa có
    if (!row.nextElementSibling || !row.nextElementSibling.dataset.rsvpNote) {
      const note = document.createElement('div');
      note.dataset.rsvpNote = '1';
      note.style.cssText    = 'font-size:12px;color:var(--ink3);margin-top:8px';
      note.innerHTML        = `Bạn đã trả lời: <b>${Utils.escHtml(response)}</b>`;
      row.after(note);
    }
  }

  return {
    showPopup, closePopup,
    showAuthStatus, showSendResult,
    btnLoading, btnRestore,
    emptyState, loadingState,
    buildAdminCard, buildUserCard, markRSVPChosen,
  };
})();
