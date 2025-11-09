// js/mycourse.js
(function(){
  const $ = (s, ro=document)=>ro.querySelector(s);
  const load = (k, fb=null)=>{ try{ const r=localStorage.getItem(k); return r?JSON.parse(r):fb }catch(_){ return fb } };
  const USER = localStorage.getItem('cp_current') || 'guest';

  // 1) Курсты оқу
  const store = load('cp_courses') || {};
  const course = store.courses && store.courses['python-0'];
  const lessons = (course && Array.isArray(course.lessons)) ? course.lessons : [];

  // 2) Контейнер дайындау
  let grid = $('#lessonsGrid');
  if(!grid){
    // hero-дан кейін қоямыз
    const hero = document.querySelector('.hero, .course-hero, .banner') || $('main .container') || document.body;
    grid = document.createElement('div');
    grid.id = 'lessonsGrid';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
    grid.style.gap = '16px';
    hero.parentNode.insertBefore(grid, hero.nextSibling);
  }
  grid.innerHTML = '';

  // 3) Көмекші: бір сабақтың прогресін есептеу
  function lessonProgress(lesson){
    const k = `cp_steps__${USER}__${lesson.id}`;
    const st = load(k, {completed:[]});
    const done = (st.completed||[]).length;
    const total = (lesson.steps||[]).length || 0;
    const pct = total? Math.round(done*100/total) : 0;
    return {done,total,pct};
  }

  // 4) Карточка жасау
  function cardHTML(l){
    const {done,total,pct} = lessonProgress(l);
    const levelBadge = `<span class="badge">Бастапқы</span>`;
    return `
      <div class="card" style="background:#fff;border:1px solid #e2e8f0;border-radius:20px;box-shadow:0 8px 24px rgba(15,23,42,.06);padding:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          ${levelBadge}
          <span class="badge" style="background:#eef6ff">${total||0} қадам</span>
        </div>
        <h3 style="margin:4px 0 6px;font-size:20px;font-weight:800">${l.title||l.id}</h3>
        <div class="muted" style="font-size:13px;margin-bottom:10px">${(l.duration||0)} мин</div>
        <div style="font-size:13px;margin-bottom:10px">${done}/${total} қадам</div>
        <div style="height:8px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin-bottom:12px">
          <span style="display:block;height:100%;background:linear-gradient(90deg,#2563eb,#06b6d4);width:${pct}%"></span>
        </div>
        <button data-id="${l.id}" class="startBtn"
          style="border:0;border-radius:12px;padding:10px 14px;font-weight:800;cursor:pointer;background:linear-gradient(90deg,#2563eb,#06b6d4);color:#fff">
          ${done? 'Жалғастыру':'Бастау'}
        </button>
      </div>`;
  }

  const HIDE_KEY = 'cp_hidden_lessons';
  const getHidden = () => new Set(JSON.parse(localStorage.getItem(HIDE_KEY) || '[]'));
  const setHidden = (set) => localStorage.setItem(HIDE_KEY, JSON.stringify([...set]));

  // 5) Рендер
  if(!lessons.length){
    grid.innerHTML = `<div class="card" style="padding:16px;border-radius:20px;border:1px dashed #cbd5e1;background:#fff">
      Әзірге жарияланған сабақ жоқ. <a href="teacher.html">Мұғалім режимінде</a> сабақ қосыңыз.</div>`;
    return;
  }
  grid.innerHTML = lessons.map(cardHTML).join('');

  // 6) Батырма әрекеті
  grid.addEventListener('click', (e)=>{
    const btn = e.target.closest('.startBtn');
    if(!btn) return;
    const id = btn.getAttribute('data-id');
    // lesson.html оқи алуы үшін LESSON_ORDER-ды да localStorage-қа жазып қояйық
    const order = lessons.map(l=>l.id);
    localStorage.setItem('cp_lesson_order', JSON.stringify(order));
    location.href = `lesson.html?lesson=${encodeURIComponent(id)}`;
  });

  // 7) Хедердегі курс прогресін (бар болса) жаңарту
  const totalSteps = lessons.reduce((a,l)=> a + ((l.steps||[]).length||0), 0);
  const doneSteps = lessons.reduce((a,l)=> a + (lessonProgress(l).done||0), 0);
  const pct = totalSteps? Math.round(doneSteps*100/totalSteps) : 0;

  // Жолақтың енін жаңарту
  const bar = document.querySelector('.progress > span');
  if(bar) bar.style.width = pct + '%';

  // Пайыз мәтінін (0%) жаңарту – мүмкін болатын бірнеше класс/ID тексереміз
  const pctText =
    document.querySelector('.progress-percent') ||
    document.querySelector('.progress-value')   ||
    document.querySelector('.progress-label')   ||
    document.querySelector('#courseProgressPct');

  if(pctText) pctText.textContent = pct + '%';
})();
