importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyCv_sjgaGsGsRgthyXGmE-eztH93RJlXUE",
  authDomain:        "thongbaocuochop-da595.firebaseapp.com",
  projectId:         "thongbaocuochop-da595",
  messagingSenderId: "361920499933",
  appId:             "1:361920499933:web:c994f744e2d64f0c6acb34"
});

const messaging = firebase.messaging();

// ==========================================
// 1. XỬ LÝ HIỂN THỊ THÔNG BÁO DƯỚI NỀN
// ==========================================
messaging.onBackgroundMessage((payload) => {
  console.log('Nhận được thông báo nền:', payload);

  const { title, body, icon } = payload.notification;
  const data = payload.data || {};

  // Tự động phân loại nút bấm
  let actions = [];
  if (data.type === 'meeting_rsvp') {
    actions = [
      { action: 'yes', title: '✅ Tham gia' },
      { action: 'no', title: '❌ Vắng mặt' }
    ];
  } else {
    actions = [
      { action: 'open', title: 'Mở ứng dụng' },
      { action: 'close', title: 'Đóng' }
    ];
  }

  self.registration.showNotification(title, {
    body:  body,
    icon:  icon || 'https://firebase.google.com/images/brand-guidelines/logo-logomark.png',
    badge: icon || '',
    data:  data, // Truyền dữ liệu ngầm vào để lát click còn lấy ra dùng
    actions: actions
  });
});

// ==========================================
// 2. XỬ LÝ SỰ KIỆN KHI BẤM NÚT YES / NO
// ==========================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  // Xử lý ĐIỂM DANH (Gửi ngầm, không mở app)
  if (action === 'yes' || action === 'no') {
    const responseValue = (action === 'yes') ? 'Tham gia' : 'Không tham gia';
    
    // URL API của Google Apps Script của bạn
    const gasApiUrl = "https://script.google.com/macros/s/AKfycbxSlMFplMk4uBq4sAPmsuSOhP0-VZRSjzP1K0l_X_C7EF0gIJFhX5ZCgVOfYjX0TX71kg/exec";

    event.waitUntil(
      fetch(gasApiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'submitResponse',
          notificationId: data.notificationId,
          response: responseValue,
          token: data.token // Dùng token để backend biết ai là người bấm
        })
      })
      .then(res => res.json())
      .then(resData => console.log("Gửi phản hồi thành công:", resData))
      .catch(err => console.error("Lỗi gửi phản hồi:", err))
    );
    return; // Dừng hàm, KHÔNG mở cửa sổ mới
  }

  // Xử lý các nút khác
  if (action === 'close') return;

  // Bấm vào thông báo chung -> Mở Web App
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        if (clients.openWindow) {
          return clients.openWindow('https://vanquynhngo-cpu.github.io/firebase-sw/');
        }
      })
  );
});
