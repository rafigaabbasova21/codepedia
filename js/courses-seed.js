// js/courses-seed.js
(function () {
  // Егер cp_courses бұрыннан бар болса – тимейміз
  try {
    const raw = localStorage.getItem('cp_courses');
    if (raw) {
      // console.log('[cp] courses already exist in localStorage');
      return;
    }
  } catch (e) {
    console.error('localStorage error', e);
    return;
  }

  // Егер жоқ болса – реподан data/cp_courses.json файлын жүктейміз
  fetch('data/cp_courses.json')
    .then(r => r.json())
    .then(obj => {
      try {
        localStorage.setItem('cp_courses', JSON.stringify(obj));
        console.log('[cp] seeded courses from data/cp_courses.json');
      } catch (e) {
        console.error('Cannot save cp_courses to localStorage', e);
      }
    })
    .catch(err => {
      console.error('Failed to load data/cp_courses.json', err);
    });
})();
