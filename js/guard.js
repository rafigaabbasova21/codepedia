
function loadUsers(){ try{ return JSON.parse(localStorage.getItem('cp_users')||'[]'); }catch(e){ return []; } }
const currentEmail = localStorage.getItem('cp_current');
if(!currentEmail){ location.replace('auth.html'); }
else{
  const users = loadUsers();
  const me = users.find(u=>u.email.toLowerCase()===currentEmail.toLowerCase());
  if(!me){ localStorage.removeItem('cp_current'); location.replace('auth.html'); }
}
