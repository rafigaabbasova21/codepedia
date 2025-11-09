const $ = (s, ro=document) => ro.querySelector(s);
const saveJSON = (k,v)=> localStorage.setItem(k, JSON.stringify(v));
const loadJSON = (k, fb=null)=>{ try{ const r=localStorage.getItem(k); return r?JSON.parse(r):fb }catch(_){ return fb } };

const KEY = 'cp_courses';        // бүкіл курстар осында
const COURSE_ID = 'python-0';    // біздің курс

// Жұмыс объектісі (бір сабақты құрастырып жатырмыз)
let builder = { id:'', title:'', duration:30, steps:[] };

function renderStepFields(){
  const type = $('#stepType').value;
  const host = $('#stepFields');
  let html = '';

  if(type==='slide'){
    html = `
      <div class="row"><label>Тақырып</label><input id="f_title" placeholder="Слайд атауы"></div>
      <div class="row"><label>Google Slides embed URL</label><input id="f_src" placeholder="https://docs.google.com/presentation/.../embed"></div>`;
  }
  if(type==='quiz'){
    html = `
      <div class="row"><label>Сұрақ</label><textarea id="f_question"></textarea></div>
      <div class="row"><label>Нұсқалар (әр жолға біреу)</label><textarea id="f_opts"></textarea></div>
      <div class="row"><label>Дұрыс жауап индексі (0..n-1)</label><input id="f_correct" type="number" value="0"></div>
      <div class="row"><label>Ұпай</label><input id="f_score" type="number" value="1"></div>`;
  }
  if(type==='code'){
    html = `
      <div class="row"><label>Тақырып</label><input id="f_title" placeholder="Есеп атауы"></div>
      <div class="row"><label>Мәтін</label><textarea id="f_text"></textarea></div>
      <div class="row"><label>Бастапқы код (template)</label><textarea id="f_template"></textarea></div>
      <div class="row"><label>Күтілетін input</label><textarea id="f_in"></textarea></div>
      <div class="row"><label>Күтілетін output</label><textarea id="f_out"></textarea></div>
      <div class="row"><label>Қысқа кеңес (hint)</label><input id="f_hint" placeholder="Мыс: // және % қолданыңыз"></div>`;
  }
  if(type==='match'){
    html = `
      <div class="row"><label>Тақырып</label><input id="f_title" placeholder="Сәйкестендіру атауы"></div>
      <div class="row"><label>Сол жақ (әр жолға бір элемент)</label><textarea id="f_left" placeholder="int\nfloat\nstr\nbool"></textarea></div>
      <div class="row"><label>Оң жақ (әр жолға бір элемент)</label><textarea id="f_right" placeholder="бүтін сан\nондық сан\nжол\nлогикалық"></textarea></div>
      <div class="row"><label>Жауап (сол жақ индексі:оң жақ индексі, үтірмен)</label>
        <input id="f_answer" placeholder="0:2,1:3,2:0,3:1"></div>
      <div class="row"><label>Ұпай</label><input id="f_score" type="number" value="1"></div>`;
  }

  host.innerHTML = html;
}
renderStepFields();
$('#stepType').addEventListener('change', renderStepFields);

function refreshPreview(){
  $('#pvId').textContent = builder.id || 'py-??';
  $('#pvTitle').textContent = builder.title || 'Атауы';
  $('#pvLen').textContent = (builder.duration||0) + ' мин';

  const list = $('#stepsList');
  list.innerHTML = builder.steps.map((s, i)=> {
    if(s.type==='slide') return `<div class="item"><span class="badge">#${i+1} SLIDE</span> — ${s.title||''}</div>`;
    if(s.type==='quiz')  return `<div class="item"><span class="badge">#${i+1} QUIZ</span> — ${s.question?.slice(0,80)||''}</div>`;
    if(s.type==='code')  return `<div class="item"><span class="badge">#${i+1} CODE</span> — ${s.title||''}</div>`;
    if(s.type==='match') return `<div class="item"><span class="badge">#${i+1} MATCH</span> — ${s.title||''}</div>`;
    return '';
  }).join('');
}
refreshPreview();

// Қадам қосу
$('#addStepBtn').addEventListener('click', ()=>{
  const type = $('#stepType').value;
  if(!builder.id) builder.id = $('#lessonId').value.trim();
  builder.title = $('#lessonTitle').value.trim();
  builder.duration = Number($('#lessonDuration').value||0);

  if(!builder.id){ alert('Алдымен Сабақ ID енгізіңіз (мыс: py-01)'); return; }

  if(type==='slide'){
    builder.steps.push({type:'slide', title: $('#f_title').value.trim(), src: $('#f_src').value.trim()});
  }
  if(type==='quiz'){
    const opts = $('#f_opts').value.split('\n').filter(Boolean);
    builder.steps.push({
      type:'quiz', id:`q${Date.now()}`, title: 'Тест', score:Number($('#f_score').value||1),
      question: $('#f_question').value.trim(), options: opts, correct: Number($('#f_correct').value||0)
    });
  }
  if(type==='code'){
    builder.steps.push({
      type:'code', id:`c${Date.now()}`, title: $('#f_title').value.trim(),
      text: $('#f_text').value.trim(), template: $('#f_template').value,
      sampleInput: $('#f_in').value, sampleOutput: $('#f_out').value, hint: $('#f_hint').value||''
    });
  }
  if(type==='match'){
    const left = $('#f_left').value.split('\n').filter(Boolean);
    const right = $('#f_right').value.split('\n').filter(Boolean);
    const ans = {};
    ($('#f_answer').value||'').split(',').map(x=>x.trim()).filter(Boolean).forEach(pair=>{
      const [l,r]=pair.split(':').map(n=>Number(n.trim())); ans[l]=r;
    });
    builder.steps.push({ type:'match', id:`m${Date.now()}`, title: $('#f_title').value.trim(),
      left, right, answer: ans, score:Number($('#f_score').value||1) });
  }

  refreshPreview();
});

// Қадамдарды тазалау
$('#clearStepsBtn').addEventListener('click', ()=>{
  if(confirm('Барлық қадамды өшіреміз бе?')){ builder.steps=[]; refreshPreview(); }
});

// Сабақты сақтау (draft)
$('#saveLessonBtn').addEventListener('click', ()=>{
  builder.id = $('#lessonId').value.trim();
  builder.title = $('#lessonTitle').value.trim();
  builder.duration = Number($('#lessonDuration').value||0);
  if(!builder.id){ alert('Сабақ ID керек'); return; }

  const store = loadJSON(KEY) || { currentCourseId: COURSE_ID, courses: { [COURSE_ID]: { title:'Python 0-ден', lessons: [] } } };
  const course = store.courses[COURSE_ID] || (store.courses[COURSE_ID]={ title:'Python 0-ден', lessons: [] });

  const i = course.lessons.findIndex(x=>x.id===builder.id);
  if(i>=0) course.lessons[i] = JSON.parse(JSON.stringify(builder));
  else course.lessons.push(JSON.parse(JSON.stringify(builder)));

  saveJSON(KEY, store);
  $('#saveInfo').textContent = new Date().toLocaleString();
  alert('Сақталды!');
  renderPublished();
});

// Publish (lesson.js пайдаланатын дерек)
$('#publishBtn').addEventListener('click', ()=>{
  const store = loadJSON(KEY); if(!store){ alert('Алдымен сақтаңыз'); return; }
  // Негізі publish бөлек керек емес — lesson.js cp_courses ішін бірден оқиды.
  alert('Жарияланды! Енді lesson.html осы деректерді автоматты алады.');
  renderPublished();
});

// Export / Import
$('#exportBtn').addEventListener('click', ()=>{
  const data = loadJSON(KEY) || {};
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cp_courses.json';
  a.click();
});

$('#importFile').addEventListener('change', async (e)=>{
  const f = e.target.files[0]; if(!f) return;
  const txt = await f.text();
  try{
    const obj = JSON.parse(txt);
    saveJSON(KEY, obj);
    alert('Импорт сәтті!');
    renderPublished();
  }catch(err){ alert('JSON қате: '+err.message); }
});

// Published күйін көрсету
function renderPublished(){
  const data = loadJSON(KEY) || {};
  $('#jsonView').textContent = JSON.stringify(data, null, 2);
}
renderPublished();

// Бастапқы өрістерді превьюмен синхрондау
['lessonId','lessonTitle','lessonDuration'].forEach(id=>{
  $('#'+id).addEventListener('input', ()=>{
    if(id==='lessonId') builder.id = $('#lessonId').value.trim();
    if(id==='lessonTitle') builder.title = $('#lessonTitle').value.trim();
    if(id==='lessonDuration') builder.duration = Number($('#lessonDuration').value||0);
    refreshPreview();
  });
});
