/**
 * config.js
 * ─────────────────────────────────────────────
 * Tập trung toàn bộ cấu hình ứng dụng.
 * Chỉ cần chỉnh sửa file này khi đổi backend/Firebase.
 */

const CONFIG = {
  /** URL Google Apps Script (backend) */
  GAS_URL: "https://script.google.com/macros/s/AKfycbwCjDARz2kho5xGlv7LhS9ZuZfnohxCiazxyV9dBEebCI4aUtbItUrvPcmJ_1SCdY7SMg/exec",

  /** VAPID key cho Firebase Cloud Messaging */
  VAPID: "BNL5Qb8_WQlsWgsbgzWY8iSpPMHmWFoUklwF9r2dk6dZkf6rfj6C1bUkO-6n11EGxGilAjYh-sjsZw_WCpJvC4k",

  /** Đường dẫn service worker */
  SW_URL: "./firebase-messaging-sw.js",

  /** Firebase project config */
  FIREBASE: {
    apiKey:            "AIzaSyCv_sjgaGsGsRgthyXGmE-eztH93RJlXUE",
    authDomain:        "thongbaocuochop-da595.firebaseapp.com",
    projectId:         "thongbaocuochop-da595",
    messagingSenderId: "361920499933",
    appId:             "1:361920499933:web:c994f744e2d64f0c6acb34"
  },

  /** Thời gian tự ẩn popup (ms) */
  POPUP_DURATION: 5000,

  /** Thời gian tự ẩn send-result (ms) */
  RESULT_DURATION: 6000,
};
