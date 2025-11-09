
const $$ = sel => document.querySelector(sel);
function loadUsers(){ try{ return JSON.parse(localStorage.getItem('cp_users')||'[]'); }catch(e){ return []; } }
function saveUsers(u){ localStorage.setItem('cp_users', JSON.stringify(u)); }
function setCurrent(email){ localStorage.setItem('cp_current', email); }
function emailTaken(users, email){ return users.some(u=>u.email.toLowerCase()===email.toLowerCase()); }

const galleryEl = $$('#avatarGallery');
const galleryList = ['img/avatars/avatar1.svg','img/avatars/avatar2.svg','img/avatars/avatar3.svg','img/avatars/avatar4.svg'];
let selectedAvatar = null;
function renderGallery(){ galleryEl.innerHTML=''; galleryList.forEach(url=>{ const d=document.createElement('div'); d.className='thumb'; d.innerHTML=`<img src="${url}" style="width:100%;height:100%;object-fit:cover">`; d.addEventListener('click', ()=>{ selectedAvatar=url; document.querySelectorAll('.gallery .thumb').forEach(t=>t.classList.remove('selected')); d.addEventListener; d.classList.add('selected'); updatePreview(); }); galleryEl.appendChild(d); }); }
function updatePreview(){ $$('#avatarPreview').innerHTML = selectedAvatar ? `<img src="${selectedAvatar}" alt="avatar">` : `<span class="small">Сурет жоқ</span>`; }
renderGallery(); updatePreview();
const fileInput = $$('#avatarFile'); fileInput.addEventListener('change', (e)=>{ const file=e.target.files?.[0]; if(!file) return; const reader=new FileReader(); reader.onload=()=>{ selectedAvatar=reader.result; document.querySelectorAll('.gallery .thumb').forEach(t=>t.classList.remove('selected')); updatePreview(); }; reader.readAsDataURL(file); });
$$('#clearAvatar').addEventListener('click', ()=>{ selectedAvatar=null; fileInput.value=''; updatePreview(); document.querySelectorAll('.gallery .thumb').forEach(t=>t.classList.remove('selected')); });
function show(el, html, cls){ el.innerHTML = html ? `<div class="${cls}">${html}</div>` : ''; }
$$('#registerBtn').addEventListener('click', ()=>{ const name=$$('#regName').value.trim(); const email=$$('#regEmail').value.trim(); const klass=$$('#regClass').value; const pass=$$('#regPassword').value; const err=$$('#regError'); show(err,'',''); if(!name||!email||!pass||!klass||klass==='Таңдаңыз…'){ show(err,'Барлық міндетті өрістерді толтырыңыз.','error'); return; } if(pass.length<6){ show(err,'Құпиясөз кемі 6 таңба.','error'); return; } const users=loadUsers(); if(emailTaken(users,email)){ show(err,'Бұл email тіркелген. Кіруді қолданыңыз.','error'); return; } const user={ name,email,class:klass,password:pass,avatarUrl:selectedAvatar,createdAt:new Date().toISOString(), activity:{}, level:{ first:null, second:null }, lastLesson:null }; users.push(user); saveUsers(users); setCurrent(email); show(err,'Тіркелу сәтті! Дашбордқа өткіземіз…','notice'); setTimeout(()=> location.href='dashboard.html', 600); });
$$('#loginBtn').addEventListener('click', ()=>{ const email=$$('#loginEmail').value.trim(); const pass=$$('#loginPassword').value; const err=$$('#loginError'); show(err,'',''); const users=loadUsers(); const user=users.find(u=>u.email.toLowerCase()===email.toLowerCase()); if(!user){ show(err,'Мұндай email табылмады.','error'); return; } if(user.password!==pass){ show(err,'Құпиясөз қате.','error'); return; } setCurrent(email); show(err,'Кіру сәтті! Дашбордқа өткіземіз…','notice'); setTimeout(()=> location.href='dashboard.html', 600); });
