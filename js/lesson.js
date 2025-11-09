// ======================= LESSON.JS (dynamic + autosave) =======================

// ---- 0) Teacher дерегін оқу (cp_courses) және глобалға жазу
(function(){
  const params = new URLSearchParams(location.search);
  const LID = params.get('lesson') || 'py-01';
  try{
    // 🔧 1) Алдымен Firebase-тен келген глобалды объектіні қолданамыз
    const root   = window.CP_COURSES || JSON.parse(localStorage.getItem('cp_courses')||'null');
    const course = root && root.courses && root.courses['python-0'];
    if(!course) return;
    const lessons = course.lessons || [];
    const found   = lessons.find(l=>l.id===LID);
    if(found && Array.isArray(found.steps) && found.steps.length){
      window.STEPS        = found.steps;           // динамик қадамдар
      window.LESSON_ORDER = lessons.map(l=>l.id);  // рет
      // UI тақырыптары
      const t = document.getElementById('lessonTitle'); if(t && found.title) t.textContent = found.title;
      const lid = document.getElementById('lessonId');   if(lid) lid.textContent = found.id;
    }
  }catch(_){}
})();

// ---- 1) CONFIG & UTILS
// $ қайта жариялану қатесін болдырмау
window.$ = window.$ || ((s, ro=document)=> ro.querySelector(s));

const params    = new URLSearchParams(location.search);
const LESSON_ID = params.get('lesson') || 'py-01';

let USER = localStorage.getItem('cp_current') || 'guest';
localStorage.setItem('cp_current', USER);

const loadJSON = (k, fb=null)=>{ try{ const r=localStorage.getItem(k); return r?JSON.parse(r):fb }catch(_){ return fb } };
const saveJSON = (k,v)=> localStorage.setItem(k, JSON.stringify(v));

const courseKey   = u => `cp_course_progress__${u}`;
const stepKey     = (u,l)=> `cp_steps__${u}__${l}`;
const quizKey     = (u,l,q)=> `cp_quiz__${u}__${l}__${q}`;      // {score,picked,ts}
const quizSelKey  = (u,l,q)=> `cp_quiz_sel__${u}__${l}__${q}`;
const scoreKey    = (u,l)=> `cp_score__${u}__${l}`;            // total score per lesson
// Код/инпут/аутпут сақтау кілттері
const codeSrcKey  = (u,l,c)=> `cp_code_src__${u}__${l}__${c}`;
const codeInKey   = (u,l,c)=> `cp_code_in__${u}__${l}__${c}`;
const codeOutKey  = (u,l,c)=> `cp_code_out__${u}__${l}__${c}`;

// ---- QUIZ-ке арналған бірегей ключ (id + индекс)
function quizStorageId(st, idx){
  return (st.id || 'quiz') + '__' + idx;
}

// --- салыстыру көмекшілері (code тапсырмалар үшін)
function _norm(s){ return String(s||'').replace(/\r/g,'').replace(/\s+$/,''); }
function _eqOut(a,b){
  const A=_norm(a).split('\n'), B=_norm(b).split('\n');
  if(A.length!==B.length) return false;
  for(let i=0;i<A.length;i++){ if(A[i]!==B[i]) return false; }
  return true;
}
function _diffBox(actual, expected){
  const A=_norm(actual).split('\n'), B=_norm(expected).split('\n');
  let i=0, n=Math.max(A.length,B.length);
  while(i<n && A[i]===B[i]) i++;
  const exp = (B[i]??'∅'), got = (A[i]??'∅');
  return `
    <div class="bad" style="margin:8px 0">❌ Қате жауап</div>
    <div class="muted">Айырмашылық табылған жол: ${i+1}</div>
    <div style="display:grid;gap:6px;margin-top:6px">
      <pre class="io-area out">Күтілген: ${exp}</pre>
      <pre class="io-area out">Сенің:    ${got}</pre>
    </div>`;
}

// ---- 2) DEFAULTS (резерв шаблон)
const LESSON_ORDER_DEFAULT = ['py-01','py-02','py-03','py-04','py-05','py-06'];

const STEPS_DEFAULT = [
  {type:'slide', title:'Кіріспе: Python не үшін керек?',
   src:'https://docs.google.com/presentation/d/e/2PACX-1vQDemo/embed?start=false&loop=false&delayms=3000'},

  {type:'quiz', title:'Экранға шығару функциясы', id:'q1', score:1,
   question:'Python-да экранға шығару үшін қандай функция қолданылады?',
   options:['echo()','printf()','print()','show()'], answer:2}
];

// ---- 3) DYNAMIC adopt
const LESSON_ORDER = (window.LESSON_ORDER && window.LESSON_ORDER.length)
  ? window.LESSON_ORDER
  : LESSON_ORDER_DEFAULT;

const STEPS = (window.STEPS && window.STEPS.length)
  ? window.STEPS
  : STEPS_DEFAULT;

// ---- 4) STATE init
const titleEl = $('#lessonTitle');
if (titleEl && !titleEl.textContent.trim()) titleEl.textContent = 'Сабақ';
const lidEl = $('#lessonId'); if(lidEl) lidEl.textContent = LESSON_ID;

const COURSE = loadJSON(courseKey(USER)) || { currentLessonId: LESSON_ID, lessons:{} };
if(!COURSE.lessons[LESSON_ID]){
  COURSE.lessons[LESSON_ID] = { completedSteps:0, totalSteps:STEPS.length };
}
saveJSON(courseKey(USER), COURSE);

const STEPSTATE = loadJSON(stepKey(USER, LESSON_ID), { completed:[] });

function getTotalScore(){ return Number(localStorage.getItem(scoreKey(USER, LESSON_ID)) || '0'); }
function setTotalScore(v){ localStorage.setItem(scoreKey(USER, LESSON_ID), String(v)); updateScorePill(); }
function addScore(d){ setTotalScore(getTotalScore() + d); }
function updateScorePill(){ const s=$('#scorePill'); if(s) s.textContent = 'Балл: ' + getTotalScore(); }

// ---- 5) PROGRESS sync (ТЕК STEPS.length)
function syncCourseProgress(){
  const done  = STEPSTATE.completed.length;
  const total = STEPS.length;
  COURSE.currentLessonId = LESSON_ID;
  COURSE.lessons[LESSON_ID].completedSteps =
    Math.max(done, (COURSE.lessons?.[LESSON_ID]?.completedSteps || 0));
  COURSE.lessons[LESSON_ID].totalSteps = total;
  saveJSON(courseKey(USER), COURSE);
  const p=$('#topProgress'); if(p) p.style.width = Math.round((done/total)*100) + '%';
}

// ---- 6) Stepbar
const stepBar = $('#stepBar');
function renderStepbar(active){
  if(!stepBar) return;
  stepBar.innerHTML = '';
  const unlocked = STEPSTATE.completed.length;
  STEPS.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'stepdot' + (i===active?' active':'') + (STEPSTATE.completed.includes(i)?' done':'');
    b.textContent = i+1;
    b.style.cursor = i<=unlocked ? 'pointer' : 'not-allowed';
    b.title = i<=unlocked ? `Қадам ${i+1}` : 'Алдымен алдыңғы қадамды аяқтаңыз';
    if(i<=unlocked) b.addEventListener('click', ()=>{ IDX=i; render(); });
    stepBar.appendChild(b);
  });
}

let IDX = Math.min(STEPSTATE.completed.length, Math.max(0, STEPS.length-1));

function markDone(i){
  if(!STEPSTATE.completed.includes(i)){
    STEPSTATE.completed.push(i);
    saveJSON(stepKey(USER, LESSON_ID), STEPSTATE);
  }
}

function goNext(){
  markDone(IDX);
  if(IDX < STEPS.length-1){ IDX++; render(); }
  else { finished(); }
}

function goNextTopic(){
  markDone(IDX);
  const idx = LESSON_ORDER.indexOf(LESSON_ID);
  const next = idx>=0 && idx<LESSON_ORDER.length-1 ? LESSON_ORDER[idx+1] : null;
  location.href = next ? `lesson.html?lesson=${encodeURIComponent(next)}` : 'mycourse.html';
}

// ---- 7) RENDER
function render(){
  const st = STEPS[IDX];
  renderStepbar(IDX);
  syncCourseProgress();
  updateScorePill();

  const root = $('#stepRoot');
  let html = '';
  const labelNext = (IDX === STEPS.length - 1) ? 'Келесі тақырып' : 'Келесі';

  if(st.type==='slide'){
    html = `
      <h2 class="step-title">${st.title||''}</h2>
      <iframe class="slide-embed" src="${st.src||''}" allowfullscreen></iframe>
      <div class="step-actions"><button id="nextBtn" class="btn primary">${labelNext}</button></div>`;
  }

  // ---- QUIZ (бір мүмкіндік) + суреттер ----
  if (st.type === "quiz") {
    const qid = quizStorageId(st, IDX);
    const locked = !!localStorage.getItem(quizKey(USER, LESSON_ID, qid));
    const savedSel = localStorage.getItem(quizSelKey(USER, LESSON_ID, qid));

    // options массивін {text,img} формасына келтіреміз
    const opts = (st.options || []).map(o => {
      if (typeof o === "string") return { text: o, img: "" };
      return { text: (o && o.text) || "", img: (o && o.img) || "" };
    });

    const labelNext = IDX === STEPS.length - 1 ? "Келесі тақырып" : "Келесі";

    html = `
      <h2 class="step-title">${st.title || ""}</h2>
      <p class="note"><strong>Ереже:</strong> бір мүмкіндік. Таңдағаннан соң өзгермейді.</p>

      <p><strong>Сұрақ:</strong> ${st.question || ""}</p>

      ${st.questionImg
        ? `<div class="quiz-question-img-wrap">
             <img src="${st.questionImg}" class="quiz-question-img" alt="">
           </div>`
        : ""}

      <ul class="quiz-list" role="radiogroup">
        ${opts
          .map((o, i) => {
            const ck  = String(i) === savedSel ? 'aria-checked="true"' : "";
            const dis = locked ? 'aria-disabled="true"' : "";
            return `
              <li class="quiz-option" role="radio" data-idx="${i}" ${ck} ${dis}>
                <div class="quiz-option-inner">
                  <span class="quiz-option-text">${o.text || ""}</span>
                  ${o.img ? `<img src="${o.img}" class="quiz-option-img" alt="">` : ""}
                </div>
              </li>`;
          })
          .join("")}
      </ul>

      <div class="quiz-result" id="quizResult">
        ${locked ? "Жауап сақталды. Келесіге өтіңіз." : ""}
      </div>
      <div class="step-actions">
        <button id="nextBtn" class="btn primary" ${locked ? "" : "disabled"}>
          ${labelNext}
        </button>
      </div>`;
  }

  if (st.type === 'code') {
    const hasTests  = Array.isArray(st.tests) && st.tests.length > 0;
    const sampleIn  = hasTests ? (st.tests[0].in  || '') : (st.sampleInput  || '');
    const sampleOut = hasTests ? (st.tests[0].out || '') : (st.sampleOutput || '');
    const hintText  = st.hint || '';
    const taskText  = st.text || 'Тапсырма шарты көрсетілмеген.';

    html = `
      <h2 class="step-title">${st.title || ''}</h2>
      <p class="note">${taskText}</p>

      <div class="code-grid">
        <div>
          <textarea id="code" class="code-area" spellcheck="false">${st.template || ''}</textarea>
          <div class="hint">${hintText}</div>
        </div>

        <div>
          <label class="badge">Input</label>
          <textarea id="stdin" class="io-area" placeholder="${sampleIn}">${sampleIn}</textarea>

          <label class="badge" style="margin-top:8px;display:inline-block">Күтілетін Output</label>
          <pre id="expected" class="io-area out">${sampleOut}</pre>

          <label class="badge" style="margin-top:8px;display:inline-block">Нәтиже</label>
          <pre id="actual" class="io-area out"></pre>

          <div id="manualWrap" style="display:none;margin-top:8px">
            <label class="badge">Қолмен тексеру</label>
            <input id="manualOut" class="io-area" style="min-height:auto;height:44px" placeholder="Осында өз нәтижеңді жаз">
            <div id="codeFeedback" class="note" style="margin-top:8px"></div>
            <small class="hint">Компилятор жауап бермесе, өз нәтижеңді енгіз. Дұрыс болса ұпай беріледі.</small>
          </div>
        </div>
      </div>

      <div class="step-actions">
        <button class="btn ghost" id="runBtn">Іске қосу</button>
        <button class="btn primary" id="submitBtn" disabled>Жіберу</button>
        <button class="btn primary" id="nextBtn" disabled>${labelNext}</button>
        <button class="btn ghost" id="skipBtn">Өткізу (0 балл)</button>
      </div>

      <iframe src="compiler2.html" id="runner" style="width:0;height:0;border:0;visibility:hidden"></iframe>
    `;
  }

  if (st.type === 'match') {
    // pairs[] не left/right
    const pairs  = Array.isArray(st.pairs) ? st.pairs : null;
    const lefts  = pairs ? pairs.map(p => p.left  || '') : (st.left  || []);
    const rights = pairs ? pairs.map(p => p.right || '') : (st.right || []);

    // Оң жақ мәндерді араластыру
    const rightsShuffled = rights.slice();
    for(let i=rightsShuffled.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [rightsShuffled[i], rightsShuffled[j]] = [rightsShuffled[j], rightsShuffled[i]];
    }

    html = `
      <h2 class="step-title">${st.title || ''}</h2>
      <div class="code-grid" style="grid-template-columns:1fr 1fr">
        <div>${lefts.map(l=>`<div style="margin:6px 0"><span class="badge">${l}</span></div>`).join('')}</div>
        <div>${
          lefts.map((_,i)=>`
            <select class="match-select" data-li="${i}"
                    style="width:100%;padding:8px;border-radius:10px;border:1px solid #e2e8f0;margin:6px 0">
              <option value="">Таңдаңыз...</option>
              ${rightsShuffled.map(r=>`<option value="${r}">${r}</option>`).join('')}
            </select>
          `).join('')
        }</div>
      </div>
      <div class="step-actions"><button id="nextBtn" class="btn primary" disabled>${labelNext}</button></div>`;
  }

  root.innerHTML = html;
  attachEvents();
}

function finished(){
  syncCourseProgress();
  const score = getTotalScore();
  const idx = LESSON_ORDER.indexOf(LESSON_ID);
  const next = idx>=0 && idx<LESSON_ORDER.length-1 ? LESSON_ORDER[idx+1] : null;
  $('#stepRoot').innerHTML = `
    <h2 class="step-title">Құттықтаймыз! Сабақ аяқталды 🎉</h2>
    <p class="note">Жиналған балл: <strong>${score}</strong>.</p>
    <div class="step-actions">
      <a class="btn ghost" href="mycourse.html">Курстар</a>
      ${next?`<a class="btn primary" href="lesson.html?lesson=${encodeURIComponent(next)}">Келесі тақырып</a>`:''}
    </div>`;
}

// ---- Compiler messaging (compiler2.html: {cmd:'run'} -> {reply:'run', payload:{stdout,stderr}})
function runInCompiler(code, stdin){
  return new Promise(resolve=>{
    const timer = setTimeout(()=>resolve({stdout:'',stderr:'TIMEOUT'}), 3000);
    function onMsg(ev){
      if(!ev.data || ev.data.reply!=='run') return;
      window.removeEventListener('message', onMsg);
      clearTimeout(timer);
      resolve(ev.data.payload || {stdout:'',stderr:''});
    }
    window.addEventListener('message', onMsg);
    const runner = $('#runner');
    runner?.contentWindow?.postMessage({cmd:'run', lang:'python', code, stdin}, '*');
  });
}

// ---- 8) EVENTS
function attachEvents(){
  const st = STEPS[IDX];
  const next = $('#nextBtn');
  if(next) next.addEventListener('click', ()=>{ if(IDX===STEPS.length-1) goNextTopic(); else goNext(); });

  // QUIZ (бір мүмкіндік)
  if(st.type==='quiz'){
    const list   = document.querySelectorAll('.quiz-option');
    const qid    = quizStorageId(st, IDX);
    const qK     = quizKey(USER, LESSON_ID, qid);
    const sK     = quizSelKey(USER, LESSON_ID, qid);
    const locked = !!localStorage.getItem(qK);
    const res    = $('#quizResult');
    const nextBtn= $('#nextBtn');

    // ---- Дұрыс жауап индексін табу (teacher-admin.js -> st.answer)
    function getCorrectIndex(step){
      const opts = step.options || [];
      const n    = opts.length;

      // 1) Негізгі: st.answer (teacher-де осылай сақталады)
      if (Number.isInteger(step.answer)){
        let idx = step.answer;
        if (idx < 0) idx = 0;
        if (idx >= n) idx = n-1;
        return idx;
      }

      // 2) Қосымша safety: st.correct өрісі болса (ескі default)
      if (typeof step.correct !== 'undefined'){
        let idx = Number(step.correct);
        if (!Number.isNaN(idx)){
          if (idx < 0) idx = 0;
          if (idx >= n) idx = n-1;
          return idx;
        }
      }

      // 3) Егер мәтін ретінде сақталса (дұрыс жауаптың өзі)
      if (typeof step.answer === 'string' && step.answer){
        const byText = opts.indexOf(step.answer);
        if (byText >= 0) return byText;
        const num = parseInt(step.answer,10);
        if (!Number.isNaN(num)){
          let idx = num;
          if (idx < 0) idx = 0;
          if (idx >= n) idx = n-1;
          return idx;
        }
      }

      return 0;
    }

    const corrIdx = getCorrectIndex(st);

    list.forEach(li=>{
      li.addEventListener('click', ()=>{
        if(locked || localStorage.getItem(qK)) return;

        list.forEach(x=>x.removeAttribute('aria-checked'));
        li.setAttribute('aria-checked','true');

        const pick = Number(li.dataset.idx);
        const sc   = (pick === corrIdx) ? (st.score||1) : 0;

        saveJSON(qK, {score:sc, picked:pick, ts:Date.now()});
        localStorage.setItem(sK, String(pick));
        if (sc) addScore(sc);

        if(res) res.textContent = sc ? `✅ Дұрыс! +${sc} балл` : 'Қате. 0 балл';

        document.querySelectorAll('.quiz-option').forEach(x=>x.setAttribute('aria-disabled','true'));
        nextBtn && nextBtn.removeAttribute('disabled');
      });
    });
  }

  // MATCH
  if (st.type === 'match') {
    const selects = document.querySelectorAll('.match-select');
    const btn     = $('#nextBtn');
    const key     = quizKey(USER, LESSON_ID, st.id);
    const usePairs= Array.isArray(st.pairs);

    function allCorrect(){
      if (usePairs) {
        return Array.from(selects).every(sel=>{
          const i = Number(sel.dataset.li);
          return sel.value && sel.value === (st.pairs[i]?.right || '');
        });
      } else {
        const picked = {};
        selects.forEach(s => picked[s.dataset.li] = s.value);
        return Object.keys(st.answer||{}).every(k => String(picked[k])===String(st.answer[k]));
      }
    }

    function onChange(){
      const ok = allCorrect();
      if (ok) {
        if(!localStorage.getItem(key)){
          const picked = Array.from(selects).map(s=>s.value);
          const sc = st.score || 1;
          saveJSON(key, {score:sc, picked, ok:true, ts:Date.now()});
          addScore(sc);
        }
        btn && btn.removeAttribute('disabled');
      } else {
        btn && btn.setAttribute('disabled','');
      }
    }

    selects.forEach(s=> s.addEventListener('change', onChange));
  }

  // CODE + manual fallback + AUTОSAVE
  if(st.type==='code'){
    const runBtn    = $('#runBtn');
    const submitBtn = $('#submitBtn');
    const nextBtn   = $('#nextBtn');
    const skipBtn   = $('#skipBtn');
    const codeEl    = $('#code');
    const inEl      = $('#stdin');
    const outEl     = $('#actual');
    const expected  = _norm($('#expected')?.textContent || '');
    const manualWrap= $('#manualWrap');
    const manualOut = $('#manualOut');
    const feedback  = $('#codeFeedback');

    const srcK = codeSrcKey(USER, LESSON_ID, st.id);
    const inK  = codeInKey (USER, LESSON_ID, st.id);
    const outK = codeOutKey(USER, LESSON_ID, st.id);

    // Қалпына келтіру
    const savedSrc = localStorage.getItem(srcK); if (savedSrc !== null) codeEl.value = savedSrc;
    const savedIn  = localStorage.getItem(inK);  if (savedIn  !== null) inEl.value   = savedIn;
    const savedOut = localStorage.getItem(outK); if (savedOut !== null) outEl.textContent = savedOut;

    // Автосақтау
    let saveTimer=null;
    function autosave(){
      clearTimeout(saveTimer);
      saveTimer=setTimeout(()=>{
        localStorage.setItem(srcK, codeEl.value);
        localStorage.setItem(inK,  inEl.value);
      },500);
    }
    codeEl.addEventListener('input', autosave);
    inEl .addEventListener('input', autosave);

    runBtn?.addEventListener('click', async ()=>{
      outEl.textContent = 'Жіберіліп жатыр…';
      if(feedback) feedback.innerHTML='';
      try{
        const res = await runInCompiler(codeEl.value, inEl.value);
        const out = _norm(res.stdout || '');
        const err = (res.stderr || '').trim();
        const finalOut = out + (err && err!=='TIMEOUT' ? '\n[stderr]\n'+err : '');
        outEl.textContent = finalOut;
        localStorage.setItem(outK, finalOut);

        if(err==='TIMEOUT'){ manualWrap.style.display='block'; return; }

        const ok = _eqOut(out, expected);
        if(feedback){
          feedback.innerHTML = ok ? `<div class="ok">✅ Дұрыс! Жіберуге болады.</div>`
                                  : _diffBox(out, expected);
        }
        if(ok) submitBtn.removeAttribute('disabled');
        else   submitBtn.setAttribute('disabled','');
      }catch(e){
        outEl.textContent = 'Қате: '+(e?.message||e);
        localStorage.setItem(outK, outEl.textContent);
        manualWrap.style.display='block';
      }
    });

    manualOut?.addEventListener('input', ()=>{
      if(_norm(manualOut.value) === expected){ submitBtn.removeAttribute('disabled'); }
    });

    const attemptKey = `cp_code_${USER}_${LESSON_ID}_${st.id}`;
    const attempted  = !!localStorage.getItem(attemptKey);
    if (attempted) {
      submitBtn?.setAttribute('disabled','');
      nextBtn?.removeAttribute('disabled');
    }

    submitBtn?.addEventListener('click', ()=>{
      if(localStorage.getItem(attemptKey)) return;
      const actual = _norm((outEl.textContent || '').split('\n[stderr]')[0]);
      const ok = (actual && _eqOut(actual, expected)) || (manualOut && _eqOut(_norm(manualOut.value), expected));
      const sc = ok ? 1 : 0;
      localStorage.setItem(attemptKey, JSON.stringify({ok, sc, ts:Date.now()}));
      addScore(sc);
      localStorage.setItem(srcK, codeEl.value);
      localStorage.setItem(inK,  inEl.value);
      localStorage.setItem(outK, outEl.textContent.trim());
      nextBtn && nextBtn.removeAttribute('disabled');
    });

    skipBtn?.addEventListener('click', ()=>{
      if(!localStorage.getItem(attemptKey)){
        localStorage.setItem(attemptKey, JSON.stringify({ok:false, sc:0, skipped:true, ts:Date.now()}));
      }
      nextBtn && nextBtn.removeAttribute('disabled');
    });
  }
}

// ---- 9) Kick off
render();

// ===================== end of LESSON.JS =====================
