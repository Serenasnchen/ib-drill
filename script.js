var QUESTIONS = [];

function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch(e) { return []; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} }

var pool = [];
var current = null;
var currentIndex = 0;
var starred    = lsGet('ib_starred');
var reviewList = lsGet('ib_review');
var studyMode  = 'shuffle';

function getFilters() {
  return {
    cat:     document.getElementById('fCat').value,
    diff:    document.getElementById('fDiff').value,
    special: document.getElementById('fSpecial').value
  };
}

function applyFilter() {
  var f = getFilters();
  var q = (document.getElementById('searchInput').value || '').trim().toLowerCase();

  pool = QUESTIONS.filter(function(item) {
    if (f.cat !== 'all' && item.category !== f.cat) return false;
    if (f.diff !== 'all' && item.difficulty !== f.diff) return false;
    if (f.special === 'starred' && starred.indexOf(item.id) === -1) return false;
    if (f.special === 'review'  && reviewList.indexOf(item.id) === -1) return false;
    if (q) {
      var hay = (item.question + ' ' + item.answer_en + ' ' + item.answer_zh + ' ' + item.explanation_zh).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  });

  ['fCat','fDiff','fSpecial'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el.value !== 'all') el.classList.add('active'); else el.classList.remove('active');
  });

  var sc = document.getElementById('searchClear');
  sc.className = 'search-clear' + (q ? ' visible' : '');

  if (pool.length === 0) { showEmpty(); return; }

  if (studyMode === 'sequential') {
    currentIndex = 0;
  } else {
    currentIndex = Math.floor(Math.random() * pool.length);
  }
  current = pool[currentIndex];
  render();
}

function render() {
  if (!current) return;

  // stats
  document.getElementById('sIdx').textContent   = currentIndex + 1;
  document.getElementById('sTotal').textContent = pool.length;
  document.getElementById('sStar').textContent  = starred.length;
  document.getElementById('sRev').textContent   = reviewList.length;

  // progress bar
  var pct = pool.length > 1 ? (currentIndex / (pool.length - 1)) * 100 : 100;
  document.getElementById('progressFill').style.width = pct + '%';

  // badges
  document.getElementById('tagCat').textContent = current.category;
  var td = document.getElementById('tagDiff');
  td.textContent = current.difficulty;
  td.className = 'badge';
  td.classList.add(current.difficulty === 'Easy' ? 'badge-easy' : current.difficulty === 'Medium' ? 'badge-med' : 'badge-hard');

  document.getElementById('qId').textContent   = current.id.toUpperCase();
  document.getElementById('qText').textContent = current.question;

  // star
  var sb = document.getElementById('starBtn');
  var isStarred = starred.indexOf(current.id) !== -1;
  sb.textContent = isStarred ? '\u2605' : '\u2606';
  sb.className = 'star-btn' + (isStarred ? ' starred' : '');

  // review btn
  var rb = document.getElementById('btnReview');
  var isRev = reviewList.indexOf(current.id) !== -1;
  rb.textContent = isRev ? '\u2714 In Review' : '\ud83d\udccc Review Later';
  rb.className   = 'btn btn-outline' + (isRev ? ' active-review' : '');

  // reset answer state
  document.getElementById('answerSection').classList.remove('visible');
  var showBtn = document.getElementById('showBtn');
  showBtn.textContent = '\u2728 Reveal Answer';
  showBtn.disabled = false;
  showBtn.className = 'btn btn-primary';

  // fill answers
  document.getElementById('ansEn').textContent = current.answer_en;
  document.getElementById('ansZh').textContent = current.answer_zh;
  renderExp(current.explanation_zh);

  // collapse exp
  document.getElementById('expBody').classList.remove('open');
  document.getElementById('expChevron').classList.remove('open');

  // show/hide
  document.getElementById('qPanel').style.display    = '';
  document.getElementById('actionBar').style.display = '';
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('footerHint').style.display = '';

  // rotate hint
  var hints = [
    '\u518d\u5237\u4e00\u9898\uff0c\u8d8a\u6765\u8d8a\u719f\u7ec3 \u2728',
    '\u4f60\u6b63\u5728\u53d8\u5f97\u66f4\u597d \ud83c\udf31',
    'Keep going, you\u2019re doing great \ud83d\ude80',
    '\u5c31\u5dee\u8fd9\u4e00\u9898\uff0c\u52a0\u6cb9\uff01 \ud83d\udcaa',
    'One question at a time \u2728',
    '\u9762\u8bd5\u5b98\u4e5f\u66fe\u7ecf\u662f\u5c0f\u767d \ud83d\ude0a',
  ];
  var hint = hints[Math.floor(Math.random() * hints.length)];
  document.getElementById('footerHint').textContent = hint;
}

function renderExp(text) {
  var container = document.getElementById('expBody');
  var re = /\u3010([^\u3011]+)\u3011([^\u3010]*)/g;
  var m, html = '', found = false;
  var icons = { '\u8fd9\u9898\u5728\u8003\u4ec0\u4e48': '\ud83d\udccc', '\u6b63\u786e\u56de\u7b54\u903b\u8f91': '\ud83d\udcdd', '\u5bb9\u6613\u9519\u5728\u54ea\u91cc': '\u26a0\ufe0f' };
  while ((m = re.exec(text)) !== null) {
    found = true;
    var icon = icons[m[1]] || '\ud83d\udca1';
    html += '<div class="exp-segment"><div class="exp-seg-label">' +
            icon + ' ' + esc(m[1]) +
            '</div><div class="exp-seg-text">' + esc(m[2].trim()) + '</div></div>';
  }
  container.innerHTML = found ? html : '<div class="exp-seg-text">' + esc(text) + '</div>';
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function showEmpty() {
  document.getElementById('qPanel').style.display    = 'none';
  document.getElementById('answerSection').classList.remove('visible');
  document.getElementById('actionBar').style.display = 'none';
  document.getElementById('emptyState').style.display = '';
  document.getElementById('footerHint').style.display = 'none';
  document.getElementById('sIdx').textContent   = '0';
  document.getElementById('sTotal').textContent = '0';
  document.getElementById('progressFill').style.width = '0%';
}

function showAnswer() {
  document.getElementById('answerSection').classList.add('visible');
  var btn = document.getElementById('showBtn');
  btn.textContent = '\u2713 Answer Revealed';
  btn.disabled = true;
  btn.className = 'btn btn-primary answered';
}

function nextQuestion() {
  if (pool.length === 0) return;
  if (studyMode === 'sequential') {
    currentIndex = (currentIndex + 1) % pool.length;
  } else {
    currentIndex = Math.floor(Math.random() * pool.length);
  }
  current = pool[currentIndex];
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setMode(mode) {
  studyMode = mode;
  document.getElementById('modeShuffleBtn').className = 'mode-btn' + (mode === 'shuffle'    ? ' mode-active' : '');
  document.getElementById('modeSeqBtn').className     = 'mode-btn' + (mode === 'sequential' ? ' mode-active' : '');
  var pill = document.getElementById('statMode');
  pill.textContent = mode === 'sequential' ? 'SEQ' : 'SHFL';
  pill.className   = 'mode-pill' + (mode === 'sequential' ? ' seq' : '');
  if (pool.length === 0) return;
  if (mode === 'sequential') {
    var idx = pool.indexOf(current);
    currentIndex = idx !== -1 ? idx : 0;
    current = pool[currentIndex];
    render();
  }
}

function toggleStar() {
  if (!current) return;
  var i = starred.indexOf(current.id);
  if (i === -1) starred.push(current.id); else starred.splice(i, 1);
  lsSet('ib_starred', starred);
  var sb = document.getElementById('starBtn');
  var isStarred = starred.indexOf(current.id) !== -1;
  sb.textContent = isStarred ? '\u2605' : '\u2606';
  sb.className   = 'star-btn' + (isStarred ? ' starred' : '');
  document.getElementById('sStar').textContent = starred.length;
}

function toggleReview() {
  if (!current) return;
  var i = reviewList.indexOf(current.id);
  if (i === -1) reviewList.push(current.id); else reviewList.splice(i, 1);
  lsSet('ib_review', reviewList);
  var rb = document.getElementById('btnReview');
  var isRev = reviewList.indexOf(current.id) !== -1;
  rb.textContent = isRev ? '\u2714 In Review' : '\ud83d\udccc Review Later';
  rb.className   = 'btn btn-outline' + (isRev ? ' active-review' : '');
  document.getElementById('sRev').textContent = reviewList.length;
}

function toggleExp() {
  document.getElementById('expBody').classList.toggle('open');
  document.getElementById('expChevron').classList.toggle('open');
}

function startApp() {
  var ws = document.getElementById('welcomeScreen');
  var aw = document.getElementById('appWrap');
  ws.classList.add('hidden');
  aw.classList.add('visible');
  setTimeout(function() { ws.style.display = 'none'; }, 480);
}

fetch('questions.json')
  .then(function(r) { return r.json(); })
  .then(function(data) {
    QUESTIONS = data;
    applyFilter();
  });
