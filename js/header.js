// js/header.js — OLD UI PRESERVED + robust user loader
(function(){
  if (window.__cp_header_bound__) return;
  window.__cp_header_bound__ = true;

  function readUsers() {
    // қолдаймыз: [] ИЛИ {list,byId}
    try {
      const raw = JSON.parse(localStorage.getItem('cp_users') || 'null');
      if (!raw) return { list: [], byId: {} };
      if (Array.isArray(raw)) {
        // ескі формат: [{email,name,...}]
        const byId = {};
        const list = [];
        raw.forEach(u => {
          if (!u || !u.email) return;
          const id = 'u:' + String(u.email).toLowerCase();
          byId[id] = {
            id,
            ...u
          };
          list.push(id);
        });
        return { list, byId };
      }
      // жаңа формат: {list:[], byId:{}}
      if (raw.list && raw.byId) return raw;
      return { list: [], byId: {} };
    } catch(_) {
      return { list: [], byId: {} };
    }
  }

  function normalizeUserId(cp_current) {
    if (!cp_current) return null;
    // ескіде cp_current = email, жаңада = 'u:email'
    if (cp_current.startsWith('u:')) return cp_current.toLowerCase();
    return ('u:' + cp_current).toLowerCase();
  }

  function getCurrentUser(){
    const cp = localStorage.getItem('cp_current');    // email ИЛИ 'u:email'
    const uid = normalizeUserId(cp);
    const db = readUsers();
    let me = uid ? db.byId[uid] : null;

    // Егер табылмаса, массив форматымен тікелей салыстырып көреміз (толық үйлесім үшін)
    if (!me && cp) {
      // try find by email field
      for (const id of db.list) {
        const u = db.byId[id];
        if ((u?.email||'').toLowerCase() === cp.toLowerCase()) { me = u; break; }
      }
    }
    // соңғы қорғаныс: аты-жөнін құрама
    if (me) {
      return {
        email: me.email || cp || '',
        name: me.name || (me.email ? me.email.split('@')[0] : 'Пайдаланушы'),
        avatarUrl: me.avatarUrl || '',
        ...me
      };
    }
    return null;
  }
  window.getCurrentUser = getCurrentUser;

  window.renderHeader = function renderHeader(opts={}){
    const {showMenu=true, showUser=true, showLogout=true} = opts;
    const me = getCurrentUser();
    const el = document.getElementById('appHeader');
    if(!el) return;

    el.innerHTML = `
      <header class="topbar">
        <div class="topbar-inner">
          ${showMenu ? `
            <button class="menu-btn" id="menuBtn" aria-label="Меню">
              <div class="menu-lines"><span></span><span></span><span></span></div>
            </button>` : ``}
          <a class="brand" href="dashboard.html">
            <div class="brand-badge">CP</div>
            <div class="brand-title">CODEPEDIA</div>
          </a>
          <div class="top-right">
            ${showUser && me ? `
              <div class="user-pill">
                <div class="avatar" id="topAvatar" style="${me.avatarUrl ? `background-image:url(${me.avatarUrl})` : ''}"></div>
                <div id="userName">${me.name}</div>
              </div>` : ``}
            ${showLogout && me ? `<button id="logoutBtn" class="btn danger">Шығу</button>` : ``}
          </div>
        </div>
      </header>`;

    const menuBtn = document.getElementById('menuBtn');
    if(menuBtn){
      menuBtn.addEventListener('click', ()=>{
        if (typeof window.toggleSidebar === 'function') {
          window.toggleSidebar();
        }
      });
    }
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn){
      logoutBtn.addEventListener('click', ()=>{
        localStorage.removeItem('cp_current');
        location.replace('auth.html');
      });
    }
  };
})();
