function renderSidebar(){
  const el = document.getElementById('appSidebar');
  if(!el) return;

  el.innerHTML = `
    <aside class="sidebar-wrap" id="sidebarWrap">
      <div class="sidebar">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <div style="font-weight:800;letter-spacing:.3px">Мәзір</div>
        </div>
        <nav class="nav">
          <a href="dashboard.html">🏠 Басты бет</a>
          <a href="glossary.html">📘 Энциклопедия</a>
          <a href="mycourse.html">🧠 Python үйренеміз</a> 
          <a href="problems.html">💡 Олимпиадалық есептер</a>
          <a href="stats.html">📊 Прогресс</a>
        </nav>
        <div style="height:14px"></div>
        <div class="sidebar-footer">
          <div class="avatar" style="width:32px;height:32px;border-radius:50%;background:#e5e7eb" id="sideAvatar"></div>
          <div>
            <div style="font-weight:700" id="sideName">Қолданушы</div>
            <div class="badge" id="sideClass">Сынып</div>
          </div>
        </div>
      </div>
    </aside>
    <div class="scrim" id="scrim"></div>`;

  const wrap = document.getElementById('sidebarWrap');
  const scrim = document.getElementById('scrim');

  // toggleSidebar — ескі header-мен үйлесімді
  window.toggleSidebar = function(){
    const open = !wrap.classList.contains('open');
    wrap.classList.toggle('open', open);
    scrim.classList.toggle('visible', open);
  };
  scrim.addEventListener('click', ()=> window.toggleSidebar());

  // ----- ПАЙДАЛАНУШЫ ДЕРЕГІН БЕРІК ОҚУ (ескі [] және жаңа {list,byId} форматтарын да қолдайды)
  function readUsersDB(){
    try{
      const raw = JSON.parse(localStorage.getItem('cp_users')||'null');
      if(!raw) return {list:[], byId:{}};
      if(Array.isArray(raw)){
        // ескі формат: [{email,name,...}]
        const byId={}, list=[];
        raw.forEach(u=>{
          if(!u || !u.email) return;
          const id = ('u:'+u.email.toLowerCase());
          byId[id] = {...u, id};
          list.push(id);
        });
        return {list, byId};
      }
      if(raw.list && raw.byId) return raw; // жаңа формат
      return {list:[], byId:{}};
    }catch(_){ return {list:[], byId:{}}; }
  }
  function normalizeId(cp_current){
    if(!cp_current) return null;
    return cp_current.startsWith('u:') ? cp_current.toLowerCase()
                                      : ('u:'+cp_current.toLowerCase());
  }

  try{
    const cp = localStorage.getItem('cp_current');         // email немесе 'u:email'
    const uid = normalizeId(cp);
    const db = readUsersDB();

    let me = uid ? db.byId[uid] : null;

    // Таңдалмаған болса — email арқылы іздеп көреміз (аралас форматтарға төзімділік)
    if(!me && cp){
      for(const id of db.list){
        const u = db.byId[id];
        if((u?.email||'').toLowerCase() === cp.toLowerCase()){ me = u; break; }
      }
    }

    if(me){
      const sideName  = document.getElementById('sideName');
      const sideClass = document.getElementById('sideClass');
      const sideAvatar= document.getElementById('sideAvatar');

      if(sideName)  sideName.textContent  = me.name || (me.email||'Қолданушы');
      if(sideClass) sideClass.textContent = ((me.class||'—') + ' · оқушы');
      if(sideAvatar && me.avatarUrl){
        sideAvatar.style.backgroundImage = `url(${me.avatarUrl})`;
        sideAvatar.style.backgroundSize  = 'cover';
      }
    }
  }catch(_){}
}
