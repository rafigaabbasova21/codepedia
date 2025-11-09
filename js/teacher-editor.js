const $ = (s, ro=document)=>ro.querySelector(s);
const load = (k, fb=null)=>{ try{ const r=localStorage.getItem(k); return r?JSON.parse(r):fb }catch(_){ return fb } };
const save = (k, v)=> localStorage.setItem(k, JSON.stringify(v));
function getStore(){ return load('cp_courses'); }
function putStore(x){ save('cp_courses', x); }

const params = new URLSearchParams(location.search);
const LESSON_ID = params.get('id');

const e_id = $('#e_id');
const e_title = $('#e_title');
const e_dur = $('#e_dur');
const stepsWrap = $('#stepsWrap');

function fetchLesson(){
  const store = getStore();
  const C = store.courses['python-0'];
  const L = C.lessons.find(l=>l.id===LESSON_ID);
  return {store, C, L};
}

function stepCard(s, idx){
  // generic form per type
  const base = `
    <div class="step" data-idx="${idx}">
      <div class="row" style="grid-template-columns:160px 1fr 1fr auto">
        <div>
          <label>Тип</label>
          <select class="s_type">
            <option value="slide"${s.type==='slide'?' selected':''}>slide</option>
            <option value="quiz"${s.type==='quiz'?' selected':''}>quiz</option>
            <option value="code"${s.type==='code'?' selected':''}>code</option>
            <option value="match"${s.type==='match'?' selected':''}>match</option>
          </select>
        </div>
        <div><label>Атауы/Title</label><input class="s_title" value="${s.title||''}"></div>
        <div><label>ID (тек quiz/code/match)</label><input class="s_id" value="${s.id||''}"></div>
        <div style="align-self:end"><button class="btn ghost s_del">Жою</button></div>
      </div>
      <div class="row s_fields"></div>
    </div>`;
  const div = document.createElement('div');
  div.innerHTML = base;
  const fields = div.querySelector('.s_fields');

  function renderFields(){
    const t = div.querySelector('.s_type').value;
    let html = '';
    if(t==='slide'){
      html = `
        <label>Google Slides embed URL</label>
        <input class="s_src" placeholder="https://docs.google.com/presentation/.../embed" value="${s.src||''}">
      `;
    }
    if(t==='quiz'){
      html = `
        <label>Сұрақ</label>
        <textarea class="s_q">${s.question||''}</textarea>
        <label>Опциялар (әр жолда бір нұсқа)</label>
        <textarea class="s_opts">${(s.options||[]).join('\n')}</textarea>
        <label>Дұрыс индексі (0..3)</label>
        <input class="s_correct" type="number" value="${(typeof s.correct==='number')?s.correct:0}">
        <label>Ұпай</label>
        <input class="s_score" type="number" value="${s.score||1}">
      `;
    }
    if(t==='code'){
      html = `
        <label>Мәтін/Нұсқаулық</label>
        <textarea class="s_text">${s.text||''}</textarea>
        <label>Input (үлгі)</label>
        <textarea class="s_in">${s.sampleInput||''}</textarea>
        <label>Күтілетін Output</label>
        <textarea class="s_out">${s.sampleOutput||''}</textarea>
        <label>Hint</label>
        <input class="s_hint" value="${s.hint||''}">
        <label>Бастапқы код (template)</label>
        <textarea class="s_tpl">${s.template||''}</textarea>
        <label>ID</label>
        <input class="s_id2" value="${s.id||''}">
      `;
    }
    if(t==='match'){
      html = `
        <label>Сол жақ (әр жолда)</label>
        <textarea class="s_left">${(s.left||[]).join('\n')}</textarea>
        <label>Оң жақ (әр жолда)</label>
        <textarea class="s_right">${(s.right||[]).join('\n')}</textarea>
        <label>Дұрыс сәйкестендіру (мыс: 0:2,1:0,2:1)</label>
        <input class="s_answer" value="${s.answer?Object.entries(s.answer).map(([k,v])=>`${k}:${v}`).join(','):''}">
        <label>Ұпай</label>
        <input class="s_score" type="number" value="${s.score||1}">
        <label>ID</label>
        <input class="s_id2" value="${s.id||''}">
      `;
    }
    fields.innerHTML = html;
  }

  div.querySelector('.s_type').addEventListener('change', ()=>{ s.type = div.querySelector('.s_type').value; renderFields(); });
  div.querySelector('.s_del').addEventListener('click', ()=>{
    const i = Number(div.dataset.idx);
    const all = [...stepsWrap.querySelectorAll('.step')];
    all[i].remove();
    renumber();
  });

  renderFields();
  return div.firstElementChild;
}

function renumber(){
  [...stepsWrap.querySelectorAll('.step')].forEach((el,i)=> el.dataset.idx = i);
}

function loadPage(){
  const {L} = fetchLesson();
  if(!L){ alert('Сабақ табылмады'); location.href='teacher.html'; return; }
  e_id.value = L.id; e_title.value = L.title||''; e_dur.value = L.duration||30;

  stepsWrap.innerHTML = '';
  const steps = Array.isArray(L.steps) ? L.steps : (Number(L.steps)||0 ? Array.from({length:Number(L.steps)}, (_,k)=>({type:'slide', title:`Слайд ${k+1}`})) : []);
  steps.forEach((s,i)=> stepsWrap.appendChild(stepCard(s,i)));
}
loadPage();

$('#btnAddStep').addEventListener('click', ()=>{
  stepsWrap.appendChild(stepCard({type:'slide', title:''}, stepsWrap.children.length));
  renumber();
});

$('#btnSaveAll').addEventListener('click', ()=>{
  const {store, C, L} = fetchLesson();
  // meta
  L.title    = e_title.value.trim() || L.title;
  L.duration = Math.max(1, Number(e_dur.value||1));

  // steps read
  const steps = [];
  [...stepsWrap.querySelectorAll('.step')].forEach(step=>{
    const type = step.querySelector('.s_type').value;
    const title= step.querySelector('.s_title')?.value || '';
    const id1  = step.querySelector('.s_id')?.value || '';
    let obj = {type, title};
    if(type==='slide'){
      obj.src = step.querySelector('.s_src')?.value || '';
    }
    if(type==='quiz'){
      obj.id      = id1||'q'+Date.now();
      obj.question= step.querySelector('.s_q')?.value || '';
      obj.options = (step.querySelector('.s_opts')?.value || '').split('\n').filter(Boolean);
      obj.correct = Number(step.querySelector('.s_correct')?.value || 0);
      obj.score   = Math.max(0, Number(step.querySelector('.s_score')?.value || 1));
    }
    if(type==='code'){
      obj.id          = step.querySelector('.s_id2')?.value || id1 || 'c'+Date.now();
      obj.text        = step.querySelector('.s_text')?.value || '';
      obj.sampleInput = step.querySelector('.s_in')?.value || '';
      obj.sampleOutput= step.querySelector('.s_out')?.value || '';
      obj.hint        = step.querySelector('.s_hint')?.value || '';
      obj.template    = step.querySelector('.s_tpl')?.value || '';
    }
    if(type==='match'){
      obj.id    = step.querySelector('.s_id2')?.value || id1 || 'm'+Date.now();
      obj.left  = (step.querySelector('.s_left')?.value || '').split('\n').filter(Boolean);
      obj.right = (step.querySelector('.s_right')?.value || '').split('\n').filter(Boolean);
      const map = {};
      (step.querySelector('.s_answer')?.value || '').split(',').map(x=>x.trim()).filter(Boolean).forEach(p=>{
        const [k,v] = p.split(':').map(z=>Number(z.trim()));
        if(!Number.isNaN(k) && !Number.isNaN(v)) map[k]=v;
      });
      obj.answer = map;
      obj.score  = Math.max(0, Number(step.querySelector('.s_score')?.value || 1));
    }
    steps.push(obj);
  });

  L.steps = steps;
  putStore(store);
  save('cp_lesson_order', C.lessons.map(x=>x.id));

  alert('Сақталды!');
});
