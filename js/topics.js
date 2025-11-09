
const currentUser = localStorage.getItem('cp_current') || 'guest';
const progressKey = `python_progress_${currentUser}`;
const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
const userInfo = document.getElementById('userInfo'); if(userInfo) userInfo.textContent = `Қолданушы: ${currentUser}`;
const topics = [
  { id:1,  title:'Python мен танысу', cover:'img/covers/1.svg' },
  { id:2,  title:'Синтаксис', cover:'img/covers/2.svg' },
  { id:3,  title:'Деректер типі', cover:'img/covers/3.svg' },
  { id:4,  title:'Арифметикалық өрнектер', cover:'img/covers/4.svg' },
  { id:5,  title:'Енгізу/Шығару', cover:'img/covers/5.svg' },
  { id:6,  title:'Алгоритмдер', cover:'img/covers/6.svg' },
  { id:7,  title:'Шартты операторлар', cover:'img/covers/7.svg' },
  { id:8,  title:'Циклдар', cover:'img/covers/8.svg' },
  { id:9,  title:'Функциялар', cover:'img/covers/9.svg' },
];
const grid = document.getElementById('grid');
topics.forEach((t, index)=>{
  const unlocked = index===0 ? true : (progress[t.id-1]?.passed === true);
  const my = progress[t.id] || null;
  const lastScore = my ? (my.score + '% · ' + (my.date||'')) : '0%';
  const status = my?.passed ? `<span class="status ok">Өтілді</span>` : `<span class="status fail">Әлі өтілмеген</span>`;
  const card = document.createElement('div');
  card.className = 'card topic';
  card.innerHTML = `
    <div class="cover"><img src="${t.cover}" alt=""></div>
    <div class="badge abs">#${t.id}</div>
    <div class="content"><h3 class="title">${t.title}</h3><div class="small">Соңғы нәтиже: ${lastScore}</div></div>
    <div class="footer"><div>${status}</div>
      ${ unlocked ? `<button class="btn primary" data-open="${t.id}">Ашу</button>` : `<button class="btn locked" disabled>Бұғатталған</button>` }
    </div>`;
  grid.appendChild(card);
});
grid.addEventListener('click', (e)=>{ const btn=e.target.closest('[data-open]'); if(!btn) return; const lesson=btn.getAttribute('data-open'); location.href = `python.html?lesson=${lesson}`; });
