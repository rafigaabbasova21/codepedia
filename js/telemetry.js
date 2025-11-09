/* telemetry.js — unified events + progress aggregator (safe & idempotent) */
(function (w) {
  const email = localStorage.getItem('cp_current') || 'guest';
  const EK = (e)=>`cp_events_${e}`;
  const SK = (e)=>`cp_stats_${e}`;

  function load(k, d) { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch { return d; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

  function pushEvent(type, meta = {}) {
    const evs = load(EK(email), []);
    evs.push({ ts: new Date().toISOString(), type, meta });
    save(EK(email), evs);
  }

  function markDailyVisit() {
    const dayKey = `cp_last_visit_${email}`;
    const today = new Date().toISOString().slice(0,10);
    const last = localStorage.getItem(dayKey);
    if (last !== today) {
      pushEvent('visit', { day: today });
      localStorage.setItem(dayKey, today);
    }
  }

  function aggregate() {
    const evs = load(EK(email), []);

    const stats = {
      // визиттер
      visitsByDay: {},
      streak: 0,
      maxStreak: 0,

      // арена
      arenaSolved: 0,
      arenaAttempts: 0,

      // сабақ тесттері
      lessonsPassed: 0,      // ≥80 өткен тесттер саны
      lessonsAvgScore: 0,    // ≥80 өткендердің орташа пайызы
      lastLesson: null
    };

    // ---- 1) EVENTS-тен есептеу
    const solvedSet = new Set();
    const attemptMap = {};
    const passedScores = []; // тек passed=true (≥80) нәтижелердің балдары

    evs.forEach(e => {
      const day = (e.ts || '').slice(0,10);
      if (day) {
        if (!stats.visitsByDay[day]) stats.visitsByDay[day] = 0;
        if (e.type === 'visit' || e.type === 'login') stats.visitsByDay[day]++; // тек visit/login-ды санаймыз
      }

      if (e.type === 'arena_attempt') {
        stats.arenaAttempts++;
        if (e.meta && e.meta.problemId) {
          attemptMap[e.meta.problemId] = (attemptMap[e.meta.problemId] || 0) + 1;
        }
      }
      if (e.type === 'arena_pass' && e.meta && e.meta.problemId) {
        solvedSet.add(e.meta.problemId);
      }

      if (e.type === 'lesson_test') {
        // ≥80 болса ғана passedScores-қа саламыз (орташа үшін)
        if (e.meta && e.meta.passed) {
          if (typeof e.meta.score === 'number') passedScores.push(e.meta.score);
        }
        // соңғы өткен lesson индикаторы
        if (e.meta && typeof e.meta.lesson === 'number') {
          stats.lastLesson = Math.max(stats.lastLesson || 0, e.meta.lesson);
        }
      }
    });

    // ---- 2) PROGRESS-тен (fallback/merge)
    // Арена (өткен әрекеттерден бастапқы дерек болсын)
    const PROGRESS_KEY = `arena_progress_${email}`;
    const prog = load(PROGRESS_KEY, {}); // { problemId: {status, attempts, last} }
    let solvedFromProgress = 0;
    let attemptsFromProgress = 0;
    Object.values(prog).forEach(p => {
      attemptsFromProgress += (p && p.attempts) ? p.attempts : 0;
      if (p && p.status === 'passed') solvedFromProgress++;
    });
    stats.arenaSolved   = Math.max(solvedSet.size, solvedFromProgress);
    stats.arenaAttempts = Math.max(stats.arenaAttempts, attemptsFromProgress);

    // Сабақтар: ≥80 орташа үшін python_progress_<email> те оқимыз
    const LPROG_KEY = `python_progress_${email}`;
    const lprog = load(LPROG_KEY, {}); // { "1": {score, passed, date}, ... }
    Object.values(lprog).forEach(p => {
      if (p && p.passed && typeof p.score === 'number') {
        passedScores.push(p.score);
      }
    });

    // ---- 3) Орташа және өткендер саны (≥80 ғана)
    stats.lessonsPassed = passedScores.length;
    stats.lessonsAvgScore = passedScores.length
      ? Math.round(passedScores.reduce((a,b)=>a+b, 0) / passedScores.length)
      : 0;

    // ---- 4) Streak/maxStreak есептеу
    const days = Object.keys(stats.visitsByDay || {}).sort();
    function prevDay(s){ const d=new Date(s); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); }

    const today = new Date().toISOString().slice(0,10);
    let cur = 0, dd = today;
    while (stats.visitsByDay[dd]) { cur++; dd = prevDay(dd); }
    stats.streak = cur;

    let maxs = 0, m = 0, last = null;
    days.forEach(day => {
      if (!last) m = 1;
      else m = (prevDay(last) === day) ? m + 1 : 1;
      last = day;
      if (m > maxs) maxs = m;
    });
    stats.maxStreak = Math.max(maxs, cur);

    save(SK(email), stats);
    return stats;
  }

  w.Telemetry = {
    email,
    pushEvent,
    markDailyVisit,
    aggregate,
    getStats(){ try { return JSON.parse(localStorage.getItem(SK(email)) || 'null'); } catch(e){ return null; } }
  };

  // auth.html-де емес басқа беттерде күндік кіргенін белгілейміз
  if (!location.pathname.endsWith('auth.html')) markDailyVisit();
})(window);
