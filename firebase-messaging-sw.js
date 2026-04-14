importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyAx-a9RjUY_l3SXI-0APMj4a9aRyDGZYQQ",           // từ firebaseConfig
  authDomain:        "AIzaSyAx-a9RjUY_l3SXI-0APMj4a9aRyDGZYQQ",
  projectId:         "thongbaocuochop",
  messagingSenderId: "241732431165",
  appId:             "1:241732431165:web:2e16e5ffeb2de9d536e954"
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
          return clients.openWindow('YOUR_APPS_SCRIPT_WEB_APP_URL');
        }
      })
  );
});
