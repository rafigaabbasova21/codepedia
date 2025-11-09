document.addEventListener('DOMContentLoaded', () => {
  const email = localStorage.getItem('cp_current') || 'guest';

  // Қауіпсіз JSON parse көмекшісі
  const parse = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };

  // Мүмкін профиль көздері
  const profile   = parse(localStorage.getItem(`cp_profile_${email}`)) || {};
  const legacy    = parse(localStorage.getItem(`cp_user_${email}`))    || {};
  const cpNameKey = localStorage.getItem('cp_name');

  // Ең сенімді ретпен аламыз
  let name =
    (profile.name && String(profile.name).trim()) ||
    ([profile.firstName, profile.lastName].filter(Boolean).join(' ').trim()) ||
    (legacy.name && String(legacy.name).trim()) ||
    (cpNameKey && String(cpNameKey).trim()) ||
    (email.includes('@') ? email.split('@')[0] : '') ||
    'Қолданушы';

  const el = document.getElementById('heroUser');
  if (el) el.textContent = name;
});
