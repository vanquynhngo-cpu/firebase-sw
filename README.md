# MeetSync — Cấu trúc dự án

```
meetsync/
├── index.html                  # HTML thuần, không có JS/CSS inline
├── firebase-messaging-sw.js    # Service Worker (background push)
│
├── css/
│   └── styles.css              # Toàn bộ CSS, tổ chức theo section
│
└── js/
    ├── config.js               # ⚙️  Cấu hình (GAS URL, Firebase, VAPID...)
    ├── utils.js                # 🔧 Hàm tiện ích thuần (format, escape, session...)
    ├── api.js                  # 🌐 Giao tiếp backend (tất cả fetch đến GAS)
    ├── ui.js                   # 🎨 UI components (popup, cards, button states...)
    ├── auth.js                 # 🔐 Xác thực (login, register, logout, session)
    ├── meetings.js             # 📅 Nghiệp vụ cuộc họp (tạo, load, RSVP)
    └── app.js                  # 🚀 Controller trung tâm (init, Firebase, routing)
```

---

## Thứ tự load script (quan trọng)

```
config → utils → api → ui → auth → meetings → app
```

Mỗi module phụ thuộc vào các module trước nó.

---

## Hướng dẫn mở rộng

### Thêm tính năng mới (VD: xem lịch sử)
1. Thêm function API trong `js/api.js`
2. Thêm render card/component trong `js/ui.js`
3. Thêm logic nghiệp vụ trong file mới `js/history.js`
4. Thêm HTML section vào `index.html`
5. Load script trong `index.html`

### Đổi backend
- Chỉ cần sửa `GAS_URL` trong `js/config.js`

### Đổi Firebase project
- Sửa `FIREBASE` và `VAPID` trong `js/config.js`
- Sửa config trong `firebase-messaging-sw.js`

### Thêm endpoint API mới
- Chỉ thêm function vào `js/api.js`, không động đến file khác

### Đổi giao diện
- Sửa `css/styles.css` — tổ chức theo section có comment rõ ràng

---

## Mô tả từng module

| File | Nhiệm vụ |
|------|----------|
| `config.js` | Tập trung hằng số cấu hình, không có logic |
| `utils.js` | Hàm thuần, không phụ thuộc DOM hay state |
| `api.js` | Toàn bộ `fetch()` đến GAS, mỗi endpoint = 1 function |
| `ui.js` | Render HTML, quản lý trạng thái UI, không có business logic |
| `auth.js` | Login/register flow, FCM token, session management |
| `meetings.js` | Tạo/load cuộc họp, RSVP — phụ thuộc Api + UI |
| `app.js` | Khởi tạo Firebase, routing màn hình, điều phối module |
