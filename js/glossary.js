// Барлық әріптер
const LETTERS = ['А','Ә','Б','В','Г','Ғ','Д','Е','Ё','Ж','З','И','Й','К','Қ','Л','М','Н','Ң','О','Ө','П','Р','С','Т','У','Ұ','Ү','Ф','Х','Һ','Ц','Ч','Ш','Щ','Ы','І','Э','Ю','Я'];

const $bar   = document.getElementById('lettersBar');
const $terms = document.getElementById('terms');
const $title = document.getElementById('pageTitle');
const $count = document.getElementById('countInfo');

// URL параметрінен әріпті оқу (default: А)
const params = new URLSearchParams(location.search);
let currentLetter = params.get('l') || 'А';

// Әріптер панелі
function renderLetters() {
  $bar.innerHTML = '';
  LETTERS.forEach(l => {
    const a = document.createElement('a');
    a.className = 'chip' + (l === currentLetter ? ' active' : '');
    a.textContent = l;
    a.href = `glossary.html?l=${encodeURIComponent(l)}`;
    $bar.appendChild(a);
  });
}

// Терминдер жүктеу және көрсету
async function loadAndRender() {
  try {
    const res = await fetch('data/glossary.json', {cache: 'no-store'});
    const all = await res.json();
    const list = all[currentLetter] || [];

    $title.textContent = `📖 Глоссарий — ${currentLetter} әрпі`;
    $count.textContent = list.length ? `${currentLetter} әрпінен ${list.length} термин табылды` : `${currentLetter} әрпінен әзірше термин жоқ`;

    $terms.innerHTML = '';
    list.forEach(item => {
      const div = document.createElement('div');
      div.className = 'term';
      div.innerHTML = `<b>${item.t}</b> — ${item.d}`;
      $terms.appendChild(div);
    });
  } catch (e) {
    console.error(e);
    $terms.innerHTML = '<div class="term">Деректерді жүктеу кезінде қате кетті.</div>';
  }
}

// Бетті алғаш рет салу
renderLetters();
loadAndRender();
