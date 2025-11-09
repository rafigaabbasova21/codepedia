// js/courses-seed.js
// GitHub Pages үшін cp_courses.json -> localStorage синхронизациясы
(function () {
  const KEY = "cp_courses";              // барлық курстар сақталатын кілт
  const VERSION_KEY = "cp_courses_version"; // нұсқаны бөлек сақтаймыз
  const URL = "data/cp_courses.json";    // реподағы JSON файлының жолы

  function safeJSON(str, fb) {
    try {
      return JSON.parse(str);
    } catch (_) {
      return fb;
    }
  }

  function seedWith(remote) {
    const remoteVersion = remote.version || "1.0.0";

    try {
      localStorage.setItem(KEY, JSON.stringify(remote));
      localStorage.setItem(VERSION_KEY, remoteVersion);
      console.log("[cp] courses seeded/updated to version", remoteVersion);
      // localStorage жаңарғанын басқа скрипттерге хабарлау
     
      window.dispatchEvent(new Event('cp-courses-updated'));
      console.log('[cp] event cp-courses-updated dispatched');
      window.dispatchEvent(new Event('cp_courses_ready'));

    } catch (e) {
      console.error("[cp] localStorage save error:", e);
      alert(
        "Курсты сақтау мүмкін емес: браузердің localStorage жадысы толып кетті.\n" +
          "Кейбір ескі деректерді немесе суреттерді өшіру керек."
      );
    }
  }

  // 1) cp_courses.json файлын оқимыз
  fetch(URL, { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then((remote) => {
      if (!remote || typeof remote !== "object") {
        console.warn("[cp] remote cp_courses.json бос немесе қате форматта");
        return;
      }

      const remoteVersion = remote.version || "1.0.0";

      const localRaw = localStorage.getItem(KEY);
      const localData = safeJSON(localRaw, null);
      const localVersion =
        localStorage.getItem(VERSION_KEY) ||
        (localData && localData.version) ||
        null;

      // 2) Егер локалда курс мүлдем жоқ болса → бірден remote-пен толтырамыз
      if (!localData) {
        seedWith(remote);
        return;
      }

      // 3) Егер версиясы өзгерсе → жаңартамыз
      if (localVersion !== remoteVersion) {
        console.log(
          "[cp] version changed:",
          localVersion,
          "→",
          remoteVersion,
          "– updating localStorage"
        );
        seedWith(remote);
        return;
      }

      // 4) Әйтпесе ештеңе істемейміз – қолданушының прогресі мен басқа
      //   локал өзгерістерін құрметтейміз
      console.log("[cp] course data already up-to-date (version", localVersion, ")");
    })
    .catch((err) => {
      console.error("[cp] Failed to load cp_courses.json:", err);
    });
})();
