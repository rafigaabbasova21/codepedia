// ================== helpers ==================
const $ = s => document.querySelector(s);

// storage
function getStore(){
  try{
    return JSON.parse(localStorage.getItem('cp_courses') || '{}');
  }catch(_){
    return {};
  }
}

function setStore(x){
  // 1) Әдеттегідей localStorage-қа жазамыз (мұғалім өз браузерінде көре беруі үшін)
  try{
    localStorage.setItem('cp_courses', JSON.stringify(x));
  }catch(e){
    console.error(e);
    alert('Сақтау мүмкін емес: браузердің localStorage жадысы толып кетті. '
      + 'Кейбір ескі сабақтарды немесе үлкен суреттерді өшіру керек.');
  }

  // 2) Қосымша — Firebase-ке де жазамыз (барлық қолданушыларға ортақ болу үшін)
  if (window.db) {
    window.db.ref('cp_courses').set(x)
      .then(()=>{
        console.log('[cp] cp_courses Firebase-ке синхрондалды');
      })
      .catch(err=>{
        console.error('Firebase-ке жазу қатесі:', err);
        // Қаласаң, мына жерге alert қойсаң да болады
        // alert('Firebase-ке сақтай алмадық, кейін қайталап көріңіз');
      });
  } else {
    console.warn('Firebase db табылмады, тек localStorage-қа ғана сақталды');
  }
}


const COURSE_ID = (getStore().currentCourseId)||'python-0';

function listLessons(){
  const s = getStore();
  return s.courses?.[COURSE_ID]?.lessons || [];
}
function saveLessons(lessons){
  const s = getStore();
  s.courses = s.courses || {};
  s.courses[COURSE_ID] = s.courses[COURSE_ID] || {title:'Python 0-ден', lessons:[]};
  s.courses[COURSE_ID].lessons = lessons;
  setStore(s);

  // 🔁 Firebase-пен синхронизация (егер firebase-config.js қосылған болса)
  if (window.saveCoursesToFirebase) {
    try{
      window.saveCoursesToFirebase();
    }catch(err){
      console.error('Firebase-ке сақтау кезінде қате:', err);
    }
  }
}

// ================== modals ==================
function openPanel(id){
  const p  = document.getElementById(id);
  const bd = $('#backdrop');
  if(!p || !bd) return;
  bd.classList.add('open');
  p.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function closePanels(){
  $('#backdrop')?.classList.remove('open');
  document.querySelectorAll('.modal-panel').forEach(p=>p.style.display='none');
  document.body.style.overflow = '';
}
$('#backdrop')?.addEventListener('click', closePanels);
$('#closeLesson')?.addEventListener('click', closePanels);
$('#closeRatings')?.addEventListener('click', closePanels);

// ================== table render ==================
function renderLessonsTable(){
  const tbody = document.querySelector('#lessonsTable tbody');
  const nl = document.getElementById('noLessons');
  const lessons = listLessons();
  if(!tbody) return;

  if(!lessons.length){
    if(nl) nl.style.display = 'block';
    tbody.innerHTML = '';
    return;
  }
  if(nl) nl.style.display = 'none';

  tbody.innerHTML = lessons.map(l=>`
    <tr>
      <td>${l.id}</td>
      <td>${l.title||''}</td>
      <td>${(l.steps||[]).length}</td>
      <td>${Number(l.duration||0)} мин</td>
      <td>
        <button class="btn primary btn-edit" data-id="${l.id}">Өңдеу</button>
        <button class="btn ghost btn-del" data-id="${l.id}">Жою</button>
      </td>
    </tr>
  `).join('');
}

// ================== lesson modal logic ==================
function emptyLesson(){ return { id:'', title:'', duration:30, steps:[] }; }

// Defaults for steps
function ensureDefaults(st){
  if(st.type==='slide'){
    st.title = st.title ?? 'Жаңа слайд';
    st.src   = st.src   ?? '';

  } else if (st.type==='quiz'){
    // ---- QUIZ defaults + сурет қолдауы (ЖОЛ ретінде) ----
    // сұрақ суреті: мысалы "img/q1.png"
    st.questionImg = st.questionImg || '';

    // options: әр элемент { text, img } (img — файл жолы: "img/q1_opt1.png")
    if (!Array.isArray(st.options)) st.options = [];
    st.options = st.options.map(o=>{
      if (typeof o === 'string') return { text:o, img:'' };
      return { text:(o && o.text) || '', img:(o && o.img) || '' };
    });
    while (st.options.length < 2) st.options.push({ text:'', img:'' });

    st.answer   = Number.isInteger(st.answer) ? st.answer : 0;
    st.question = st.question || '';

  } else if(st.type==='code'){
    st.title    = st.title    ?? 'Код тапсырма';
    st.text     = st.text     ?? '';
    st.template = st.template ?? '';
    st.tests    = Array.isArray(st.tests) ? st.tests : [{in:'', out:''}];

  } else if(st.type==='match'){
    st.pairs    = Array.isArray(st.pairs) ? st.pairs : [{left:'', right:''}];
  }
  return st;
}

function headerLine(i, st){
  const t = st.type;
  const names = {slide:'slide', quiz:'quiz', code:'code', match:'match'};
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <strong>${i+1}. ${names[t]}</strong>
      <button class="btn ghost step-del" data-idx="${i}">Қадамды жою</button>
    </div>`;
}

function slideEditor(i, st){
  return `
    ${headerLine(i,st)}
    <div class="row">
      <label>Тақырып</label>
      <input type="text" class="step-input" data-idx="${i}" data-field="title" value="${st.title||''}">
    </div>
    <div class="row">
      <label>Google Slides embed URL</label>
      <input type="text" class="step-input" data-idx="${i}" data-field="src"
             placeholder="https://docs.google.com/presentation/.../embed" value="${st.src||''}">
    </div>`;
}

// ---- quizEditor ----
function quizEditor(i, st){
  // st.options: [{text, img}]  (img — реподағы сурет файлының жолы)
  const options = (st.options||[]).map((o,oi)=>`
    <div class="quiz-option-row" style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
      <input type="radio" name="quiz-correct-${i}" ${st.answer===oi?'checked':''}
             class="quiz-correct" data-idx="${i}" data-oi="${oi}">
      <div style="flex:1;display:flex;flex-direction:column;gap:4px">
        <input class="opt-input" data-idx="${i}" data-oi="${oi}"
               placeholder="Опция ${oi+1} (мәтін)"
               style="padding:10px;border:1px solid #e2e8f0;border-radius:10px"
               value="${o.text||''}">
        <input class="opt-img" data-idx="${i}" data-oi="${oi}"
               placeholder="Опция ${oi+1} сурет жолы (мыс: img/q${i+1}_opt${oi+1}.png)"
               style="padding:10px;border:1px solid #e2e8f0;border-radius:10px"
               value="${o.img||''}">
      </div>
      <button class="btn ghost del-option" data-idx="${i}" data-oi="${oi}">Жою</button>
    </div>
  `).join('');

  return `
    ${headerLine(i,st)}
    <div class="row">
      <label>Сұрақ</label>
      <input type="text" class="step-input" data-idx="${i}" data-field="question" value="${st.question||''}">
    </div>
    <div class="row">
      <label>Сұрақ суреті (файл жолы, қаласаңыз)</label>
      <input type="text"
             class="step-input"
             data-idx="${i}"
             data-field="questionImg"
             placeholder="мыс: img/q${i+1}.png"
             value="${st.questionImg||''}">
    </div>
    <div class="row">
      <label>Жауап нұсқалары</label>
      <div>${options}</div>
      <div><button class="btn ghost add-option" data-idx="${i}">+ Нұсқа қосу</button></div>
      <div class="muted">Дұрыс жауап ретінде бір радио-батырманы таңдаңыз. Сурет жолдары реподағы файлдарға сілтесін (мыс: img/quiz1_opt1.png).</div>
    </div>`;
}

// ---- codeEditor (есеп мәтіні + көпжолды тест кірісі) ----
function codeEditor(i, st){
  const tests = (st.tests||[]).map((t,ti)=>`
    <div class="card" style="margin:6px 0">
      <div style="display:flex;gap:8px;align-items:flex-end">
        <div class="row" style="flex:1">
          <label>Кіріс</label>
          <textarea class="test-in" data-idx="${i}" data-ti="${ti}"
                    style="min-height:60px;padding:10px;border:1px solid #e2e8f0;border-radius:10px">${t.in||''}</textarea>
        </div>
        <div class="row" style="flex:1">
          <label>Күтілетін шығыс</label>
          <textarea class="test-out" data-idx="${i}" data-ti="${ti}"
                    style="min-height:60px;padding:10px;border:1px solid #e2e8f0;border-radius:10px">${t.out||''}</textarea>
        </div>
        <button class="btn ghost del-test" data-idx="${i}" data-ti="${ti}">Жою</button>
      </div>
    </div>
  `).join('');
  return `
    ${headerLine(i,st)}
    <div class="row">
      <label>Тапсырма атауы</label>
      <input type="text" class="step-input" data-idx="${i}" data-field="title" value="${st.title||''}">
    </div>
    <div class="row">
      <label>Есеп мәтіні</label>
      <textarea class="step-input" data-idx="${i}" data-field="text"
                style="min-height:80px;padding:10px;border:1px solid #e2e8f0;border-radius:10px">${st.text||''}</textarea>
    </div>
    <div class="row">
      <label>Бастапқы код (template)</label>
      <textarea class="step-input" data-idx="${i}" data-field="template"
                style="min-height:100px;padding:10px;border:1px солid #e2e8f0;border-radius:10px">${st.template||''}</textarea>
    </div>
    <div class="row">
      <label>Тесттер</label>
      <div>${tests}</div>
      <button class="btn ghost add-test" data-idx="${i}">+ Тест қосу</button>
    </div>`;
}

function matchEditor(i, st){
  const pairs = (st.pairs||[]).map((p,pi)=>`
    <div class="quiz-option-row" style="margin-bottom:6px">
      <input type="text" class="pair-left"  data-idx="${i}" data-pi="${pi}"
             placeholder="Сол жақ"  style="flex:1;padding:10px;border:1px solid #e2e8f0;border-radius:10px" value="${p.left||''}">
      <span style="color:#94a3b8">↔</span>
      <input type="text" class="pair-right" data-idx="${i}" data-pi="${pi}"
             placeholder="Оң жақ"   style="flex:1;padding:10px;border:1px solid #e2e8f0;border-radius:10px" value="${p.right||''}">
      <button class="btn ghost del-pair" data-idx="${i}" data-pi="${pi}">Жою</button>
    </div>
  `).join('');
  return `
    ${headerLine(i,st)}
    <div class="row">
      <label>Жұптар</label>
      <div>${pairs}</div>
      <button class="btn ghost add-pair" data-idx="${i}">+ Жұп қосу</button>
    </div>`;
}

function stepEditor(i, st){
  st = ensureDefaults(st);
  if(st.type==='slide') return `<div class="card step" data-idx="${i}">${slideEditor(i,st)}</div>`;
  if(st.type==='quiz')  return `<div class="card step" data-idx="${i}">${quizEditor(i,st)}</div>`;
  if(st.type==='code')  return `<div class="card step" data-idx="${i}">${codeEditor(i,st)}</div>`;
  if(st.type==='match') return `<div class="card step" data-idx="${i}">${matchEditor(i,st)}</div>`;
  return `<div class="card step" data-idx="${i}">${headerLine(i,st)} <div class="muted">Белгісіз қадам</div></div>`;
}

function fillLessonForm(lesson){
  $('#formLessonId').value       = lesson.id||'';
  $('#formLessonTitle').value    = lesson.title||'';
  $('#formLessonDuration').value = Number(lesson.duration||30);

  const b = $('#stepsContainer');
  b.innerHTML = (lesson.steps||[]).map((st,i)=> stepEditor(i, st) ).join('');
}

function readLessonForm(cur){
  return {
    ...(cur||{}),
    id:   $('#formLessonId').value.trim(),
    title:$('#formLessonTitle').value.trim(),
    duration:Number($('#formLessonDuration').value||30),
    steps:(window.__editingLesson__?.steps)||[]
  };
}

// add step buttons
(function(){
  const add = (type, payload={})=>{
    const cur = window.__editingLesson__ || emptyLesson();
    cur.steps = (cur.steps||[]).concat([ ensureDefaults({type, ...payload}) ]);
    window.__editingLesson__ = cur;
    fillLessonForm(cur);
  };
  $('#btnAddSlide')?.addEventListener('click', ()=> add('slide',{title:'Жаңа слайд', src:''}));
  $('#btnAddQuiz') ?.addEventListener('click', ()=> add('quiz' ,{question:'', options:[{text:'',img:''},{text:'',img:''}], answer:0}));
  $('#btnAddCode') ?.addEventListener('click', ()=> add('code' ,{title:'Код', text:'', template:'', tests:[{in:'', out:''}]}));
  $('#btnAddMatch')?.addEventListener('click', ()=> add('match',{pairs:[{left:'', right:''}]}));
})();

// STEP editors — change handlers (делегация)
const stepsEl = $('#stepsContainer');

stepsEl?.addEventListener('input', (e)=>{
  const cur = window.__editingLesson__ || emptyLesson();
  const stepBox = e.target.closest('.step');
  if(!stepBox) return;
  const idx = Number(stepBox.dataset.idx);
  const st = ensureDefaults(cur.steps[idx]);

  // универсалды өріс (title, src, question, template, text, questionImg)
  if(e.target.classList.contains('step-input')){
    const field = e.target.dataset.field;
    st[field] = e.target.value;
  }

  // quiz option text
  if(e.target.classList.contains('opt-input')){
    const oi = Number(e.target.dataset.oi);
    if (!st.options[oi]) st.options[oi] = {text:'',img:''};
    st.options[oi].text = e.target.value;
  }

  // quiz option image PATH (мыс: img/q1_opt1.png)
  if(e.target.classList.contains('opt-img')){
    const oi = Number(e.target.dataset.oi);
    if (!st.options[oi]) st.options[oi] = {text:'',img:''};
    st.options[oi].img = e.target.value;
  }

  // code tests
  if(e.target.classList.contains('test-in')){
    const ti = Number(e.target.dataset.ti);
    st.tests[ti].in = e.target.value;
  }
  if(e.target.classList.contains('test-out')){
    const ti = Number(e.target.dataset.ti);
    st.tests[ti].out = e.target.value;
  }

  // match pairs
  if(e.target.classList.contains('pair-left')){
    const pi = Number(e.target.dataset.pi);
    st.pairs[pi].left = e.target.value;
  }
  if(e.target.classList.contains('pair-right')){
    const pi = Number(e.target.dataset.pi);
    st.pairs[pi].right = e.target.value;
  }

  cur.steps[idx] = st;
  window.__editingLesson__ = cur;
});

// change listener енді керек емес (файл жүктеу жоқ), сондықтан қоспаймыз

stepsEl?.addEventListener('click', (e)=>{
  const cur = window.__editingLesson__ || emptyLesson();
  // delete step
  const delStepBtn = e.target.closest('.step-del');
  if(delStepBtn){
    const idx = Number(delStepBtn.dataset.idx);
    cur.steps.splice(idx,1);
    window.__editingLesson__ = cur;
    fillLessonForm(cur);
    return;
  }

  // quiz correct
  if(e.target.classList.contains('quiz-correct')){
    const idx = Number(e.target.dataset.idx);
    const oi  = Number(e.target.dataset.oi);
    cur.steps[idx].answer = oi;
    return;
  }

  // add/del option
  if(e.target.classList.contains('add-option')){
    const idx = Number(e.target.dataset.idx);
    const st = ensureDefaults(cur.steps[idx]);
    if(st.options.length<8) st.options.push({text:'',img:''});
    window.__editingLesson__ = cur;
    fillLessonForm(cur);
    return;
  }
  if(e.target.classList.contains('del-option')){
    const idx = Number(e.target.dataset.idx);
    const oi  = Number(e.target.dataset.oi);
    const st = ensureDefaults(cur.steps[idx]);
    if(st.options.length>2){
      st.options.splice(oi,1);
      if(st.answer>=st.options.length) st.answer = st.options.length-1;
    }
    window.__editingLesson__ = cur;
    fillLessonForm(cur);
    return;
  }

  // add/del test
  if(e.target.classList.contains('add-test')){
    const idx = Number(e.target.dataset.idx);
    const st = ensureDefaults(cur.steps[idx]);
    st.tests.push({in:'', out:''});
    window.__editingLesson__ = cur;
    fillLessonForm(cur);
    return;
  }
  if(e.target.classList.contains('del-test')){
    const idx = Number(e.target.dataset.idx);
    const ti  = Number(e.target.dataset.ti);
    const st = ensureDefaults(cur.steps[idx]);
    if(st.tests.length>1) st.tests.splice(ti,1);
    window.__editingLesson__ = cur;
    fillLessonForm(cur);
    return;
  }

  // add/del pair
  if(e.target.classList.contains('add-pair')){
    const idx = Number(e.target.dataset.idx);
    const st = ensureDefaults(cur.steps[idx]);
    st.pairs.push({left:'', right:''});
    window.__editingLesson__ = cur;
    fillLessonForm(cur);
    return;
  }
  if(e.target.classList.contains('del-pair')){
    const idx = Number(e.target.dataset.idx);
    const pi  = Number(e.target.dataset.pi);
    const st = ensureDefaults(cur.steps[idx]);
    if(st.pairs.length>1) st.pairs.splice(pi,1);
    window.__editingLesson__ = cur;
    fillLessonForm(cur);
    return;
  }
});

// open/ratings/new
$('#btnAddLesson')?.addEventListener('click', ()=>{
  window.__editingLesson__ = emptyLesson();
  fillLessonForm(window.__editingLesson__);
  openPanel('lessonPanel');
});

document.getElementById('lessonsTable')?.addEventListener('click', (e)=>{
  const edit = e.target.closest('.btn-edit');
  const del  = e.target.closest('.btn-del');
  const id   = (edit||del)?.dataset.id;
  if(!id) return;

  const lessons = listLessons();
  const idx = lessons.findIndex(x=>x.id===id);
  if(idx<0) return;

  if(edit){
    window.__editingLesson__ = JSON.parse(JSON.stringify(lessons[idx]));
    // defaults into each step
    window.__editingLesson__.steps = (window.__editingLesson__.steps||[]).map(ensureDefaults);
    fillLessonForm(window.__editingLesson__);
    openPanel('lessonPanel');
  }
  if(del && confirm('Жоюға сенімдісіз бе?')){
    lessons.splice(idx,1);
    saveLessons(lessons);
    renderLessonsTable();
  }
});

// save lesson
$('#saveLesson')?.addEventListener('click', ()=>{
  const lessons = listLessons();
  const cur = readLessonForm(window.__editingLesson__||emptyLesson());
  const idx = lessons.findIndex(x=>x.id===cur.id);
  if(!cur.id){ alert('ID толтырыңыз'); return; }
  if(idx>=0) lessons[idx]=cur; else lessons.push(cur);
  saveLessons(lessons);
  renderLessonsTable();
  closePanels();
});

// ================== ratings (simple) ==================
function loadUsers(){ try{ return JSON.parse(localStorage.getItem('cp_users')||'[]'); }catch(_){ return []; } }
function userStepsDone(userEmail, lessonId){
  try{
    const key = `cp_steps__${userEmail}__${lessonId}`;
    const st = JSON.parse(localStorage.getItem(key)||'{"completed":[]}');
    return (st.completed||[]).length||0;
  }catch(_){ return 0; }
}
function renderRatings(){
  const body = $('#ratingsBody');
  const lessons = listLessons();
  const users = loadUsers();
  if(!body) return;
  body.innerHTML = '';

  users.forEach(u=>{
    lessons.forEach(l=>{
      const done = userStepsDone(u.email, l.id);
      const total = (l.steps||[]).length||0;
      const pct = total? Math.round(done*100/total):0;
      const score = Math.round(pct/10);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding:10px;border-bottom:1px solid #e2e8f0">${u.name||u.email}</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0">${l.title||l.id}</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0">${done}/${total}</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0">${pct}%</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0">${score}</td>
      `;
      body.appendChild(tr);
    });
  });
}

$('#btnRatings')?.addEventListener('click', ()=>{
  renderRatings();
  openPanel('ratingsPanel');
});

// 🔁 Firebase cp_courses_ready болғанда кестені қайта салу
window.addEventListener('cp_courses_ready', ()=>{
  console.log('[admin] cp_courses_ready → renderLessonsTable()');
  renderLessonsTable();
});

// ================== init ==================
document.addEventListener('DOMContentLoaded', ()=>{
  renderLessonsTable();
  console.log('[admin ready]',
    !!$('#btnAddLesson'),
    !!($('#lessonPanel')),
    !!($('#backdrop'))
  );
});

