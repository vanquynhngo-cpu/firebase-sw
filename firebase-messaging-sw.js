importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyCv_sjgaGsGsRgthyXGmE-eztH93RJlXUE",           // từ firebaseConfig
  authDomain:        "thongbaocuochop-da595.firebaseapp.com",
  projectId:         "thongbaocuochop-da595",
  messagingSenderId: "361920499933",
  appId:             "1:361920499933:web:c994f744e2d64f0c6acb34"
});

const messaging = firebase.messaging();

// Xử lý thông báo khi app đang chạy nền (background)
messaging.onBackgroundMessage((payload) => {
  console.log('Nhận được thông báo nền:', payload);

  const { title, body, icon } = payload.notification;

  self.registration.showNotification(title, {
    body:  body,
    icon:  icon || 'https://firebase.google.com/images/brand-guidelines/logo-logomark.png',
    badge: icon || '',
    data:  payload.data || {},
    actions: [
      { action: 'open', title: 'Mở ứng dụng' },
      { action: 'close', title: 'Đóng' }
    ]
  });
});

// Khi người dùng bấm vào thông báo
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  // Mở Web App khi bấm vào thông báo
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Nếu app đang mở thì focus vào
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        // Nếu chưa mở thì mở tab mới — thay URL bằng Web App của bạn
        if (clients.openWindow) {
          return clients.openWindow('https://script.google.com/macros/s/AKfycbxquzejQCD3GQYdQR7gyyT4_Fhutu9HLJZ3BkIsKVNfx2UfQMoO7PvMps3mxCufTvWASg/exec');
        }
      })
  );
});
