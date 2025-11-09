// js/python.js  — FULL REPLACEMENT

// ---- URL параметрі және сабақ нөмірі
const params = new URLSearchParams(window.location.search);
const lessonNumber = parseInt(params.get('lesson') || '1', 10);

// ---- Элементтер
const lessonTitle  = document.getElementById('lessonTitle');
const pdfEl        = document.getElementById('pdfFrame');         // <iframe> немесе <object>
const startBtn     = document.getElementById('startTestBtn');
const nextBtn      = document.getElementById('nextLessonBtn');
const testSection  = document.getElementById('testSection');
const questionsEl  = document.getElementById('questions');
const submitBtn    = document.getElementById('submitTestBtn');
const resultEl     = document.getElementById('result');
const progressPill = document.getElementById('progressPill');

// ---- Тақырып атауы
lessonTitle.textContent = `${lessonNumber}-сабақ: Python негіздері`;

// ---- PDF орнату (iframe немесе object болғанына қарамай)
const pdfUrl = `pdfs/lesson${lessonNumber}.pdf`;
(function setPdf() {
  if (!pdfEl) return;
  const tag = (pdfEl.tagName || '').toUpperCase();

  // Егер <object type="application/pdf" id="pdfFrame"> қолдансаңыз
  if (tag === 'OBJECT') {
    pdfEl.setAttribute('data', pdfUrl);
    const a = document.getElementById('pdfDownload');
    if (a) a.href = pdfUrl;
  } else {
    // Әдепкі: iframe
    pdfEl.src = pdfUrl;
  }
})();

// ---- User-ге байланған прогресс кілті
const currentUser = localStorage.getItem('cp_current') || 'guest';
const progressKey = `python_progress_${currentUser}`;

// ---- Тест деректері
let data = [];
let selections = [];

// ---- Алдыңғы прогресті қолдану (refresh-тен кейін де next ашық болсын)
function applySavedProgress() {
  const all = JSON.parse(localStorage.getItem(progressKey) || '{}');
  const saved = all[lessonNumber];
  if (!saved) return;

  if (saved.passed) {
    nextBtn.disabled = false;
    // Бұрынғы нәтижені көрсетіп қоямыз (қаласаң өшіре аласың)
    resultEl.innerHTML =
      `Алдыңғы нәтиже: <b>${saved.score}%</b> (${saved.date})<br>✅ Келесі сабақ ашық.`;
  }
}

// ---- Тестті бастау
startBtn.onclick = async () => {
  testSection.classList.remove('hidden');
  startBtn.disabled = true;

  const res = await fetch(`js/tests/lesson${lessonNumber}.json`);
  data = await res.json();

  selections = new Array(data.length).fill(null);
  progressPill.textContent = `0 / ${data.length}`;
  renderQuestions();
};

// ---- Сұрақтарды шығару
function renderQuestions() {
  questionsEl.innerHTML = '';
  data.forEach((q, i) => {
    const qWrap = document.createElement('div');
    qWrap.className = 'question';

    const title = document.createElement('div');
    title.className = 'question-title';
    title.textContent = `${i + 1}. ${q.question}`;

    const opts = document.createElement('div');
    opts.className = 'options';

    q.options.forEach((opt, idx) => {
      const card = document.createElement('div');
      card.className = 'option-card';
      card.dataset.q = i;
      card.dataset.idx = idx;

      const letter = document.createElement('div');
      letter.className = 'option-letter';
      letter.textContent = String.fromCharCode(65 + idx);

      const text = document.createElement('div');
      text.textContent = opt;

      card.appendChild(letter);
      card.appendChild(text);
      card.addEventListener('click', () => selectOption(i, idx));
      opts.appendChild(card);
    });

    qWrap.appendChild(title);
    qWrap.appendChild(opts);
    questionsEl.appendChild(qWrap);
  });
}

// ---- Таңдау
function selectOption(qIndex, optIndex) {
  selections[qIndex] = optIndex;
  const cards = questionsEl.querySelectorAll(`.option-card[data-q="${qIndex}"]`);
  cards.forEach(c => c.classList.remove('selected'));

  const selected = questionsEl.querySelector(
    `.option-card[data-q="${qIndex}"][data-idx="${optIndex}"]`
  );
  if (selected) selected.classList.add('selected');

  const answered = selections.filter(v => v !== null).length;
  progressPill.textContent = `${answered} / ${data.length}`;
}

// ---- Жіберу/бағалау
submitBtn.onclick = () => {
  if (!data.length) return;

  let correct = 0;
  data.forEach((q, i) => {
    const selectedIdx = selections[i];
    const cards = questionsEl.querySelectorAll(`.option-card[data-q="${i}"]`);

    cards.forEach(card => {
      card.style.pointerEvents = 'none';
      const idx = parseInt(card.dataset.idx, 10);
      if (idx === q.answer) card.classList.add('correct');
    });

    if (selectedIdx === q.answer) {
      correct++;
    } else if (selectedIdx !== null) {
      const wrong = questionsEl.querySelector(
        `.option-card[data-q="${i}"][data-idx="${selectedIdx}"]`
      );
      if (wrong) wrong.classList.add('incorrect');
    }
  });

  const score = Math.round((correct / data.length) * 100);
  resultEl.textContent = `Нәтиже: ${score}%`;
  saveProgress(score);
};

// ---- Прогресті сақтау
function saveProgress(score) {
  const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
  const date = new Date().toISOString().split('T')[0];

  progress[lessonNumber] = { score, passed: score >= 80, date };
  localStorage.setItem(progressKey, JSON.stringify(progress));

  if (score >= 80) {
    resultEl.innerHTML += '<br>✅ Келесі сабақ ашылды!';
    nextBtn.disabled = false;
  } else {
    resultEl.innerHTML += '<br>⚠️ Келесі сабаққа өту үшін 80% қажет.';
    nextBtn.disabled = true;
  }
}

// ---- Келесі сабаққа өту
nextBtn.onclick = () => {
  const next = lessonNumber + 1;
  if (next > 27) {
    alert('🎉 Құттықтаймыз! Барлық сабақ аяқталды!');
  } else {
    location.href = `python.html?lesson=${next}`;
  }
};

try {
  if (window.Telemetry) {
    Telemetry.pushEvent('lesson_test', {
      lesson: Number(lessonNumber),
      score:  Number(score),           // ⬅️ МАҢЫЗДЫ: сандарға мәжбүрлеу
      passed: Number(score) >= 80
    });
    Telemetry.aggregate();
  }
} catch (e) {
  console.warn('Telemetry error', e);
}



// ---- Бет жүктелгенде сақталған прогресті қолдан
applySavedProgress();
