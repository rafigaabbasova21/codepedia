// ================= FIREBASE-CONFIG.JS =================
// CodePedia платформасы үшін Firebase байланысы және cp_courses синхронизациясы

// ⚙️ Firebase конфигурациясы
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

// 🧩 Firebase инициализациясы (бір рет қана)
if (!window.firebaseAppsInitialized) {
  firebase.initializeApp(firebaseConfig);
  window.db = firebase.database();
  window.firebaseAppsInitialized = true;
  console.log("🔥 Firebase Ready!");
}

// ======================================================
// 🔁 cp_courses дерегін бұлттан жүктеу және localStorage-қа жазу
// ======================================================

// Firebase → LocalStorage
function loadCoursesFromFirebase() {
  if (!window.db) return console.error("⚠️ Firebase DB дайын емес");

  db.ref("courses/python-0").on("value", snap => {
    const val = snap.val();
    if (val && typeof val === "object") {
      console.log("📦 Firebase-тан cp_courses жүктелді:", val);
      const store = {
        courses: {
          "python-0": val
        }
      };
      localStorage.setItem("cp_courses", JSON.stringify(store));

      // Барлық беттерге хабарлау (мысалы: mycourse.js, lesson.js)
      window.dispatchEvent(new Event("cp_courses_ready"));
    } else {
      console.warn("⚠️ Firebase-та курс дерегі бос немесе жарамсыз.");
    }
  });
}

// LocalStorage → Firebase
function saveCoursesToFirebase() {
  try {
    const s = JSON.parse(localStorage.getItem("cp_courses") || "{}");
    if (!s.courses || !s.courses["python-0"]) {
      console.warn("⚠️ Сақтайтын курс табылмады.");
      return;
    }
    db.ref("courses/python-0").set(s.courses["python-0"]);
    console.log("✅ cp_courses Firebase-ке жүктелді!");
  } catch (err) {
    console.error("❌ Firebase-ке сақтау қатесі:", err);
  }
}

// ======================================================
// 🔁 Авто-жүктеу және дайындық
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("🌐 Firebase-тан курс жүктеу...");
  loadCoursesFromFirebase(); // сайт ашылғанда автоматты түрде жүктеледі
});

// Қолдануға арналған экспорттар (teacher-admin және басқа беттер үшін)
window.loadCoursesFromFirebase = loadCoursesFromFirebase;
window.saveCoursesToFirebase  = saveCoursesToFirebase;

// ======================================================
// end of FIREBASE-CONFIG.JS
// ======================================================
