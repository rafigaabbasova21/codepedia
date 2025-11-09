// js/quiz-editor.js
// ---------------------------------------------
// Бұл модуль тест (quiz) қадамын өңдеу үшін арналған.
// ---------------------------------------------

export function renderQuizEditor(step, mount){
  // Егер step бос болса — инициализация
  if (!step.question) step.question = '';
  if (!Array.isArray(step.options)) step.options = [];

  mount.innerHTML = '';

  // --- Сұрақ енгізу
  const qWrap = document.createElement('div');
  qWrap.style.margin = '8px 0';
  const qLabel = document.createElement('label');
  qLabel.textContent = 'Сұрақ';
  qLabel.style.display = 'block';
  const qInput = document.createElement('input');
  qInput.type = 'text';
  qInput.placeholder = 'Сұрақ мәтіні';
  qInput.value = step.question;
  qInput.style.cssText = 'width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:10px;';
  qInput.addEventListener('input', ()=> step.question = qInput.value);
  qWrap.append(qLabel,qInput);

  // --- Опциялар тізімі
  const list = document.createElement('div');
  list.style.display = 'grid';
  list.style.gap = '8px';

  function redraw(){
    list.innerHTML = '';
    if (step.options.length === 0){
      const empty = document.createElement('div');
      empty.style.color = '#64748b';
      empty.textContent = 'Опция жоқ — «+ Опция қосу» басыңыз.';
      list.appendChild(empty);
      return;
    }
    step.options.forEach((opt, idx)=>{
      const row = document.createElement('div');
      row.style.cssText = 'display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'quiz-correct-' + (step.id || 'x');
      radio.checked = !!opt.correct;
      radio.addEventListener('change', ()=>{
        step.options.forEach(o=> o.correct=false);
        opt.correct = true;
      });

      const inp = document.createElement('input');
      inp.type = 'text';
      inp.placeholder = `Жауап ${idx+1}`;
      inp.value = opt.text || '';
      inp.style.cssText = 'width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:10px;';
      inp.addEventListener('input', ()=> opt.text = inp.value);

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn ghost';
      del.textContent = 'Жою';
      del.addEventListener('click', ()=>{
        step.options.splice(idx,1);
        if (!step.options.some(o=>o.correct) && step.options[0]) step.options[0].correct = true;
        redraw();
      });

      row.append(radio, inp, del);
      list.appendChild(row);
    });
  }

  // --- "+ Опция қосу" батырмасы
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'btn ghost';
  addBtn.textContent = '+ Опция қосу';
  addBtn.addEventListener('click', ()=>{
    step.options.push({text:'', correct: step.options.length===0});
    redraw();
  });

  // --- Барлығын қосамыз
  mount.append(
    (()=>{ const t = document.createElement('div'); t.textContent='Тест'; t.style.fontWeight='800'; t.style.margin='6px 0 8px'; return t; })(),
    qWrap,
    (()=>{ const lab=document.createElement('label'); lab.textContent='Опциялар'; lab.style.display='block'; lab.style.margin='6px 0'; return lab; })(),
    list,
    addBtn,
    (()=>{ const hint=document.createElement('div'); hint.textContent='Дұрыс жауап ретінде бір радио-батырманы таңдаңыз.'; hint.style.color='#64748b'; hint.style.marginTop='4px'; return hint; })()
  );

  redraw();
}
