// js/firebase-config.js
(function () {
  // 🚀 Firebase конфигурациясы (сенің проектіңнен алынған)
  const firebaseConfig = {
    apiKey: "AIzaSyAJDgL2wnVFWhTv9f4f8kK2vC1lhNBHdeA",
    authDomain: "codepedia-d8ffd.firebaseapp.com",
    databaseURL: "https://codepedia-d8ffd-default-rtdb.firebaseio.com",
    projectId: "codepedia-d8ffd",
    storageBucket: "codepedia-d8ffd.appspot.com",
    messagingSenderId: "920050273655",
    appId: "1:920050273655:web:fb916c7622fe87c878652",
    measurementId: "G-3J4F7F7LC6"
  };

  // ⚙️ Firebase (compat API) инициализациясы — бір рет қана
  if (!window.firebaseAppsInitialized) {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // 🌍 Глобалды объект — басқа файлдар (teacher-admin.js, mycourse.js, lesson.js т.б.) қолданады
    window.cpFirebase = {
      db,
      ref: function (path) {
        return db.ref(path);
      },
      write: function (path, data) {
        return db.ref(path).set(data);
      },
      readOnce: function (path) {
        return db.ref(path).once('value');
      },
      onChange: function (path, callback) {
        db.ref(path).on('value', snap => callback(snap.val()));
      }
    };

    window.firebaseAppsInitialized = true;
    console.log("🔥 Firebase Ready! Connected to:", firebaseConfig.databaseURL);
  } else {
    console.log("⚠️ Firebase already initialized.");
  }
})();
