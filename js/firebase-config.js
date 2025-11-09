// js/firebase-config.js

// Firebase конфигурациясы (сенің проектіңнен алынған)
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

// Firebase SDK (compat) нұсқасы арқылы инициализация
if (!window.firebaseAppsInitialized) {
  firebase.initializeApp(firebaseConfig);
  window.db = firebase.database(); // енді window.db арқылы базаға қатынай аламыз
  window.firebaseAppsInitialized = true;
  console.log("🔥 Firebase Ready!");
}
