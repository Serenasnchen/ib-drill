var QUESTIONS = [];

function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch(e) { return []; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} }

var pool = [];
var current = null;
var currentIndex = 0;
var starred    = lsGet('ib_starred');
var reviewList = lsGet('ib_review');
var studyMode  = 'shuffle';
var activeTab  = 'practice';
var answered   = lsGet('ib_answered');
var reviewMode = 'dashboard';
var reviewSubFilter = 'review';
var CATEGORIES = ['Accounting', 'Valuation', 'M&A', 'LBO', 'FIG', 'ECM / DCM / LevFin', 'Private Companies', 'Restructuring'];

// ── UI helpers (markup only) ────────────────────────────────────────────────
// Inline SVG icon from the sprite in index.html
function ic(name, cls) {
  return '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
}
var REDUCE_MOTION = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

function setStarBtn(isStarred) {
  var sb = document.getElementById('starBtn');
  sb.innerHTML = ic('star');
  sb.className = 'star-btn' + (isStarred ? ' starred' : '');
  sb.setAttribute('aria-pressed', isStarred ? 'true' : 'false');
  sb.setAttribute('aria-label', isStarred ? 'Unstar this question' : 'Star this question');
}

function setReviewBtn(isRev) {
  var rb = document.getElementById('btnReview');
  rb.innerHTML = ic(isRev ? 'bookmark-check' : 'bookmark') +
    '<span class="btn-label">' + (isRev ? 'In review' : 'Review later') + '</span><kbd class="kbd-hint">R</kbd>';
  rb.className = 'btn btn-outline' + (isRev ? ' active-review' : '');
  rb.setAttribute('aria-pressed', isRev ? 'true' : 'false');
}

function setShowBtn(revealed) {
  var btn = document.getElementById('showBtn');
  btn.innerHTML = revealed
    ? ic('check') + '<span class="btn-label">Answer shown</span>'
    : ic('eye') + '<span class="btn-label">Reveal answer</span><kbd class="kbd-hint">Space</kbd>';
  btn.disabled = revealed;
  btn.className = 'btn btn-primary' + (revealed ? ' answered' : '');
}

function diffClassOf(d) {
  return d === 'Easy' ? 'badge-easy' : d === 'Medium' ? 'badge-med' : 'badge-hard';
}

// Mobile filter panel toggle + active-filter count badge
function toggleFilters(force) {
  var tb = document.querySelector('.toolbar');
  var open = typeof force === 'boolean' ? force : !tb.classList.contains('filters-open');
  tb.classList.toggle('filters-open', open);
  document.getElementById('filterToggle').setAttribute('aria-expanded', open ? 'true' : 'false');
}

function updateFilterBadge() {
  var n = 0;
  ['fCat', 'fDiff', 'fSpecial'].forEach(function(id) {
    var el = document.getElementById(id);
    el.classList.toggle('active', el.value !== 'all');
    if (el.value !== 'all' && el.style.display !== 'none') n++;
  });
  var badge = document.getElementById('filterCount');
  if (badge) badge.textContent = n ? String(n) : '';
  var t = document.getElementById('filterToggle');
  if (t) t.setAttribute('aria-label', n ? 'Filters (' + n + ' active)' : 'Filters');
}

function getFilters() {
  return {
    cat:     document.getElementById('fCat').value,
    diff:    document.getElementById('fDiff').value,
    special: document.getElementById('fSpecial').value
  };
}

function applyFilter() {
  var f = getFilters();
  if (activeTab === 'review') f.special = reviewSubFilter;
  var q = (document.getElementById('searchInput').value || '').trim().toLowerCase();

  pool = QUESTIONS.filter(function(item) {
    if (f.cat !== 'all' && item.category !== f.cat) return false;
    if (f.diff !== 'all' && item.difficulty !== f.diff) return false;
    if (f.special === 'starred' && starred.indexOf(item.id) === -1) return false;
    if (f.special === 'review'  && reviewList.indexOf(item.id) === -1) return false;
    if (q && item._hay.indexOf(q) === -1) return false;
    return true;
  });

  ['fCat','fDiff','fSpecial'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el.value !== 'all') el.classList.add('active'); else el.classList.remove('active');
  });

  updateFilterBadge();

  var sc = document.getElementById('searchClear');
  sc.className = 'search-clear' + (q ? ' visible' : '');

  if (pool.length === 0) { showEmpty(); return; }

  if (studyMode === 'sequential') {
    currentIndex = 0;
  } else {
    currentIndex = randomIndex();
  }
  current = pool[currentIndex];
  render();
}

// Random index that avoids repeating the question currently on screen
function randomIndex() {
  if (pool.length < 2) return 0;
  var i;
  do { i = Math.floor(Math.random() * pool.length); } while (pool[i] === current);
  return i;
}

var searchTimer = null;
function onSearchInput() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(applyFilter, 150);
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
  td.className = 'badge ' + diffClassOf(current.difficulty);

  document.getElementById('qId').textContent   = current.id.toUpperCase();
  document.getElementById('qText').textContent = current.question;

  // star
  setStarBtn(starred.indexOf(current.id) !== -1);

  // review btn
  setReviewBtn(reviewList.indexOf(current.id) !== -1);

  // reset answer state + AI panel + notes
  closeAiPanel();
  closeNotesPanel();
  document.getElementById('answerSection').classList.remove('visible');
  loadNote();
  setShowBtn(false);

  // fill answers
  document.getElementById('ansEn').textContent = current.answer_en;
  document.getElementById('ansZh').textContent = current.answer_zh;
  renderExp(current.explanation_zh);

  // collapse exp
  document.getElementById('expBody').classList.remove('open');
  document.getElementById('expChevron').classList.remove('open');
  document.getElementById('expToggle').setAttribute('aria-expanded', 'false');

  // show/hide
  document.getElementById('qPanel').style.display    = '';
  document.getElementById('actionBar').style.display = '';
  document.querySelector('.card-notes').style.display = '';
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
  var kinds = {
    '\u8fd9\u9898\u5728\u8003\u4ec0\u4e48': ['seg-focus', 'target'],
    '\u6b63\u786e\u56de\u7b54\u903b\u8f91': ['seg-logic', 'list-checks'],
    '\u5bb9\u6613\u9519\u5728\u54ea\u91cc': ['seg-trap', 'alert']
  };
  while ((m = re.exec(text)) !== null) {
    found = true;
    var kind = kinds[m[1]] || ['seg-other', 'bulb'];
    html += '<div class="exp-segment ' + kind[0] + '"><div class="exp-seg-label">' +
            ic(kind[1]) + '<span>' + esc(m[1]) + '</span>' +
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
  document.querySelector('.card-notes').style.display = 'none';
  document.getElementById('emptyState').style.display = '';
  document.getElementById('footerHint').style.display = 'none';
  document.getElementById('sIdx').textContent   = '0';
  document.getElementById('sTotal').textContent = '0';
  document.getElementById('progressFill').style.width = '0%';

  var msg = '\u6ca1\u6709\u5339\u914d\u7684\u9898\u76ee\uff0c\u8bd5\u8bd5\u6362\u4e2a\u7b5b\u9009\u6761\u4ef6~';
  if (activeTab === 'review' && reviewSubFilter === 'review')
    msg = '\u8fd8\u6ca1\u6709\u5f85\u590d\u4e60\u7684\u9898\u76ee\uff0c\u53bb Practice \u6807\u8bb0\u5427';
  if (activeTab === 'review' && reviewSubFilter === 'starred')
    msg = '\u8fd8\u6ca1\u6709\u6536\u85cf\u7684\u9898\u76ee\uff0c\u53bb Practice \u6dfb\u52a0\u5427';
  document.getElementById('emptyState').querySelector('p').textContent = msg;
}

function showAnswer() {
  document.getElementById('answerSection').classList.add('visible');
  setShowBtn(true);
  if (current && answered.indexOf(current.id) === -1) {
    answered.push(current.id);
    lsSet('ib_answered', answered);
  }
}

function nextQuestion() {
  if (pool.length === 0) return;
  if (studyMode === 'sequential') {
    currentIndex = (currentIndex + 1) % pool.length;
  } else {
    currentIndex = randomIndex();
  }
  current = pool[currentIndex];
  render();
  window.scrollTo({ top: 0, behavior: REDUCE_MOTION ? 'auto' : 'smooth' });
}

function setMode(mode) {
  studyMode = mode;
  var shBtn = document.getElementById('modeShuffleBtn'), sqBtn = document.getElementById('modeSeqBtn');
  shBtn.className = 'mode-btn' + (mode === 'shuffle'    ? ' mode-active' : '');
  sqBtn.className = 'mode-btn' + (mode === 'sequential' ? ' mode-active' : '');
  shBtn.setAttribute('aria-pressed', mode === 'shuffle' ? 'true' : 'false');
  sqBtn.setAttribute('aria-pressed', mode === 'sequential' ? 'true' : 'false');
  var pill = document.getElementById('statMode');
  pill.textContent = mode === 'sequential' ? 'Sequential' : 'Shuffle';
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
  setStarBtn(starred.indexOf(current.id) !== -1);
  document.getElementById('sStar').textContent = starred.length;
  if (activeTab === 'review' && reviewSubFilter === 'starred' && reviewMode === 'drilling') applyFilter();
}

function toggleReview() {
  if (!current) return;
  var i = reviewList.indexOf(current.id);
  if (i === -1) reviewList.push(current.id); else reviewList.splice(i, 1);
  lsSet('ib_review', reviewList);
  setReviewBtn(reviewList.indexOf(current.id) !== -1);
  document.getElementById('sRev').textContent = reviewList.length;
  if (activeTab === 'review' && reviewSubFilter === 'review' && reviewMode === 'drilling') applyFilter();
}

function toggleExp() {
  var isOpen = document.getElementById('expBody').classList.toggle('open');
  document.getElementById('expChevron').classList.toggle('open', isOpen);
  document.getElementById('expToggle').setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function startApp() {
  var ws = document.getElementById('welcomeScreen');
  var aw = document.getElementById('appWrap');
  ws.classList.add('hidden');
  aw.classList.add('visible');
  setTimeout(function() { ws.style.display = 'none'; }, 480);
}

// ── My Notes ──────────────────────────────────────────────────────────────

function toggleNotes() {
  var body = document.getElementById('notesBody');
  var chevron = document.getElementById('notesChevron');
  var isOpen = body.classList.toggle('open');
  chevron.classList.toggle('open', isOpen);
  setNotesExpanded(isOpen);
  if (isOpen) {
    setTimeout(function() { document.getElementById('notesInput').focus(); }, 60);
  }
}

function closeNotesPanel() {
  var body = document.getElementById('notesBody');
  var chevron = document.getElementById('notesChevron');
  if (body) body.classList.remove('open');
  if (chevron) chevron.classList.remove('open');
  setNotesExpanded(false);
}

function setNotesExpanded(open) {
  var row = document.querySelector('.notes-toggle-row');
  if (row) row.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function loadNote() {
  if (!current) return;
  var key = 'ib_note_' + current.id;
  var saved = '';
  try { saved = localStorage.getItem(key) || ''; } catch(e) {}
  document.getElementById('notesInput').value = saved;
  document.getElementById('notesHint').textContent =
    saved ? '\u5df2\u6709\u7b14\u8bb0 \u00b7 \u70b9\u51fb\u67e5\u770b' : '\u70b9\u51fb\u8bb0\u5f55\u7b14\u8bb0';
}

function saveNote() {
  if (!current) return;
  var key = 'ib_note_' + current.id;
  var val = document.getElementById('notesInput').value;
  try { localStorage.setItem(key, val); } catch(e) {}
  document.getElementById('notesHint').textContent =
    val ? '\u5df2\u6709\u7b14\u8bb0 \u00b7 \u70b9\u51fb\u67e5\u770b' : '\u70b9\u51fb\u8bb0\u5f55\u7b14\u8bb0';
}

// ── Ask AI ────────────────────────────────────────────────────────────────

var AI_CHIPS = {
  'Accounting':           ['为什么这样分类？', '现金流影响是？', '面试怎么表达更好？'],
  'Valuation':            ['为什么用这个方法？', 'EV vs Equity Value?', '常见 multiples？'],
  'M&A':                  ['战略逻辑是什么？', '常见 synergies 类型？', '尽调重点在哪里？'],
  'LBO':                  ['为什么 LBO 有吸引力？', '杠杆结构怎么设计？', 'IRR 驱动因素？'],
  'FIG':                  ['银行估值有什么特殊？', 'Book Value 为什么重要？', '监管资本怎么理解？'],
  'ECM / DCM / LevFin':  ['IPO 流程是什么？', '债券定价逻辑？', 'Leveraged Loan 结构？'],
  'Private Companies':    ['如何估值非上市公司？', 'Liquidity Discount?', '可比公司怎么选？'],
  'Restructuring':        ['Chapter 11 流程？', 'Fulcrum Security?', '债务重组逻辑？']
};

function toggleAiPanel() {
  var panel = document.getElementById('aiPanel');
  var fab = document.getElementById('aiFab');
  if (panel.classList.contains('open')) {
    closeAiPanel();
    return;
  }
  if (!current) return;
  panel.classList.add('open');
  fab.classList.add('hidden');
  fab.setAttribute('aria-expanded', 'true');

  var chips = AI_CHIPS[current.category] || ['为什么这样？', '能举个例子吗？', '面试怎么答？'];
  document.getElementById('aiChips').innerHTML = chips.map(function(c) {
    return '<button class="ai-chip" onclick="submitAiQuestion(\'' +
           c.replace(/\\/g,'\\\\').replace(/'/g,"\\'") + '\')">' + esc(c) + '</button>';
  }).join('');

  document.getElementById('aiResponse').innerHTML = '';
  document.getElementById('aiInput').value = '';
  setTimeout(function() { document.getElementById('aiInput').focus(); }, 150);
}

function openAiPanel() { toggleAiPanel(); }

function closeAiPanel() {
  aiRequestId++;
  stopTypewriter();
  var panel = document.getElementById('aiPanel');
  var fab = document.getElementById('aiFab');
  if (panel) panel.classList.remove('open');
  if (fab) { fab.classList.remove('hidden'); fab.setAttribute('aria-expanded', 'false'); }
}

var aiRequestId = 0;
var typeTimer = null;

function stopTypewriter() {
  if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
}

function submitAiQuestion(q) {
  if (!current) return;
  var input = document.getElementById('aiInput');
  var question = (q || input.value).trim();
  if (!question) return;
  input.value = '';

  stopTypewriter();
  var reqId = ++aiRequestId;
  var revealed = document.getElementById('answerSection').classList.contains('visible');
  var resp = document.getElementById('aiResponse');
  resp.innerHTML = '<div class="ai-thinking">' +
    '<span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span>' +
    '</div>';

  var payload = {
    category:       current.category,
    question:       current.question,
    answer_en:      revealed ? current.answer_en : '',
    answer_zh:      revealed ? current.answer_zh : '',
    explanation_zh: current.explanation_zh,
    userQuestion:   question,
    revealed:       revealed
  };

  fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (reqId !== aiRequestId) return; // question changed or newer request sent
    var text = data.answer || data.error || '暂无回复，请重试。';
    renderAiReply(text, data.answer ? '— Powered by Gemini' : '');
  })
  .catch(function() {
    if (reqId !== aiRequestId) return;
    renderAiReply('网络错误，暂时无法连接 AI，请稍后重试。', '');
  });
}

function renderAiReply(text, meta) {
  var resp = document.getElementById('aiResponse');
  resp.innerHTML = '';
  var msgEl = document.createElement('div');
  msgEl.className = 'ai-msg';
  resp.appendChild(msgEl);
  if (meta) {
    var metaEl = document.createElement('div');
    metaEl.className = 'ai-msg-meta';
    metaEl.textContent = meta;
    resp.appendChild(metaEl);
  }
  typewriter(text, msgEl, resp);
}

function typewriter(text, el, scrollEl) {
  stopTypewriter();
  // Cap total animation at ~3s so long replies don't take half a minute
  var step = Math.max(1, Math.ceil(text.length / 160));
  var i = 0;
  typeTimer = setInterval(function() {
    i = Math.min(text.length, i + step);
    el.textContent = text.slice(0, i);
    if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
    if (i >= text.length) stopTypewriter();
  }, 18);
}

// ── Tab Navigation ───────────────────────────────────────────────────────────

function hideDrillUI() {
  var ids = ['qPanel', 'actionBar', 'footerHint', 'emptyState'];
  for (var i = 0; i < ids.length; i++) document.getElementById(ids[i]).style.display = 'none';
  document.querySelector('.card-notes').style.display = 'none';
  document.getElementById('answerSection').classList.remove('visible');
  document.getElementById('aiPanel').classList.remove('open');
  document.querySelector('.toolbar').style.display = 'none';
}

function hideAllViews() {
  document.getElementById('reviewDashboard').style.display = 'none';
  document.getElementById('notesListView').style.display = 'none';
  document.getElementById('progressView').style.display = 'none';
  var backBtn = document.getElementById('reviewBackBtn');
  if (backBtn) backBtn.style.display = 'none';
}

function setActiveTab(tab) {
  var items = document.querySelectorAll('.tab-item');
  for (var i = 0; i < items.length; i++) {
    var on = items[i].getAttribute('data-tab') === tab;
    items[i].className = 'tab-item' + (on ? ' active' : '');
    if (on) items[i].setAttribute('aria-current', 'page'); else items[i].removeAttribute('aria-current');
  }
}

function switchTab(tab) {
  activeTab = tab;

  // update tab button active states
  setActiveTab(tab);

  hideDrillUI();
  hideAllViews();
  closeAiPanel();

  var fab = document.getElementById('aiFab');
  fab.style.display = (tab === 'practice' || tab === 'review') ? '' : 'none';

  if (tab === 'practice') {
    document.querySelector('.toolbar').style.display = '';
    document.getElementById('fSpecial').style.display = '';
    applyFilter();
  } else if (tab === 'review') {
    reviewMode = 'dashboard';
    document.getElementById('reviewDashboard').style.display = '';
    renderReviewDashboard();
  } else if (tab === 'notes') {
    document.getElementById('notesListView').style.display = '';
    renderNotesList();
  } else if (tab === 'progress') {
    document.getElementById('progressView').style.display = '';
    renderProgress();
  }

  window.scrollTo(0, 0);
}

// ── Review Center ────────────────────────────────────────────────────────────

function renderReviewDashboard() {
  var revCount = reviewList.length;
  var starCount = starred.length;
  var activeCount = reviewSubFilter === 'review' ? revCount : starCount;
  var reviewedCount = 0;
  for (var i = 0; i < reviewList.length; i++) {
    if (answered.indexOf(reviewList[i]) !== -1) reviewedCount++;
  }

  var html = '';
  html += '<header class="view-head">';
  html += '<p class="view-eyebrow">Review</p>';
  html += '<h1 class="view-title">复习中心</h1>';
  html += '<p class="view-sub">把标记过的题再过一遍，记得更牢。</p>';
  html += '</header>';

  // summary tiles
  html += '<div class="view-grid">';
  html += '<div class="view-card tone-amber"><div class="view-card-num">' + revCount + '</div><div class="view-card-label">待复习</div></div>';
  html += '<div class="view-card tone-pink"><div class="view-card-num">' + starCount + '</div><div class="view-card-label">收藏题</div></div>';
  html += '<div class="view-card tone-green"><div class="view-card-num">' + reviewedCount + '</div><div class="view-card-label">已复习</div></div>';
  html += '</div>';

  // set picker
  html += '<h2 class="view-section-title">选择题集</h2>';
  html += '<div class="review-sub-pills" role="radiogroup" aria-label="题集">';
  html += reviewPill('review', 'bookmark', '待复习', revCount);
  html += reviewPill('starred', 'star', '收藏题', starCount);
  html += '</div>';

  // start button
  var label = reviewSubFilter === 'review' ? '开始复习' : '开始刷收藏题';
  html += '<button class="review-start-btn" onclick="startReviewDrill()"' + (activeCount === 0 ? ' disabled' : '') + '>';
  html += ic('play') + '<span>' + label + ' · ' + activeCount + ' 题</span></button>';

  // empty encouragement
  if (activeCount === 0) {
    html += '<div class="view-empty review-empty">';
    html += '<div class="view-empty-icon">' + ic(reviewSubFilter === 'review' ? 'bookmark' : 'star') + '</div>';
    html += '<div class="view-empty-text">' +
      (reviewSubFilter === 'review'
        ? '暂无待复习题目<br>在 Practice 中点击「Review later」添加'
        : '暂无收藏题目<br>在 Practice 中点击星标收藏') +
      '</div></div>';
  }

  document.getElementById('reviewDashboard').innerHTML = html;
}

function reviewPill(key, icon, title, count) {
  var on = reviewSubFilter === key;
  return '<button class="review-pill' + (on ? ' active' : '') + '" role="radio" aria-checked="' + on + '" onclick="setReviewSubFilter(\'' + key + '\')">' +
    '<span class="review-pill-icon">' + ic(icon) + '</span>' +
    '<span class="review-pill-text"><span class="review-pill-title">' + title + '</span>' +
    '<span class="review-pill-count">' + count + ' 题</span></span>' +
    '<span class="review-pill-radio">' + ic('check') + '</span>' +
    '</button>';
}

function setReviewSubFilter(f) {
  reviewSubFilter = f;
  renderReviewDashboard();
}

function startReviewDrill() {
  reviewMode = 'drilling';
  document.getElementById('reviewDashboard').style.display = 'none';

  // show drill UI with back button
  document.querySelector('.toolbar').style.display = '';
  document.getElementById('fSpecial').style.display = 'none';

  // inject back button if not exists
  var main = document.querySelector('.main');
  var backBtn = document.getElementById('reviewBackBtn');
  if (!backBtn) {
    backBtn = document.createElement('button');
    backBtn.id = 'reviewBackBtn';
    backBtn.className = 'review-back-btn';
    backBtn.innerHTML = ic('arrow-left') + '<span>\u8fd4\u56de\u590d\u4e60\u4e2d\u5fc3</span>';
    backBtn.onclick = backToReviewDashboard;
    main.insertBefore(backBtn, main.firstChild);
  }
  backBtn.style.display = '';

  applyFilter();
}

function backToReviewDashboard() {
  reviewMode = 'dashboard';
  hideDrillUI();
  var backBtn = document.getElementById('reviewBackBtn');
  if (backBtn) backBtn.style.display = 'none';
  document.getElementById('reviewDashboard').style.display = '';
  renderReviewDashboard();
  window.scrollTo(0, 0);
}

// ── Notes List ───────────────────────────────────────────────────────────────

function renderNotesList() {
  var items = [];
  for (var i = 0; i < QUESTIONS.length; i++) {
    var q = QUESTIONS[i];
    var note = '';
    try { note = localStorage.getItem('ib_note_' + q.id) || ''; } catch(e) {}
    if (note) items.push({ q: q, note: note });
  }

  var html = '';
  html += '<header class="view-head notes-list-header">';
  html += '<p class="view-eyebrow">Notes</p>';
  html += '<h1 class="view-title notes-list-title">我的笔记</h1>';
  html += '<p class="view-sub notes-list-count">共 ' + items.length + ' 条 · 点击任意一条回到题目</p>';
  html += '</header>';

  if (items.length === 0) {
    html += '<div class="view-empty notes-list-empty">';
    html += '<div class="view-empty-icon">' + ic('pen') + '</div>';
    html += '<div class="view-empty-text">还没有笔记<br>在 Practice 中记录你的思考吧</div>';
    html += '</div>';
  } else {
    html += '<div class="notes-list">';
    for (var j = 0; j < items.length; j++) {
      var item = items[j];
      html += '<button class="notes-list-item" onclick="goToQuestion(\'' + item.q.id + '\')">';
      html += '<span class="notes-item-badges">';
      html += '<span class="badge badge-cat">' + esc(item.q.category) + '</span>';
      html += '<span class="badge ' + diffClassOf(item.q.difficulty) + '">' + esc(item.q.difficulty) + '</span>';
      html += '<span class="notes-item-go">打开' + ic('arrow-right') + '</span>';
      html += '</span>';
      html += '<span class="notes-item-q">' + esc(item.q.question) + '</span>';
      html += '<span class="notes-item-preview">' + esc(item.note.substring(0, 160)) + (item.note.length > 160 ? '…' : '') + '</span>';
      html += '</button>';
    }
    html += '</div>';
  }

  document.getElementById('notesListView').innerHTML = html;
}

function goToQuestion(id) {
  var q = null;
  for (var i = 0; i < QUESTIONS.length; i++) {
    if (QUESTIONS[i].id === id) { q = QUESTIONS[i]; break; }
  }
  if (!q) return;

  // switch to practice tab
  activeTab = 'practice';
  setActiveTab('practice');

  hideAllViews();

  // set current question and render
  current = q;
  currentIndex = pool.indexOf(q);
  if (currentIndex === -1) {
    // question might not be in current pool, reset pool to all
    document.getElementById('fCat').value = 'all';
    document.getElementById('fDiff').value = 'all';
    document.getElementById('fSpecial').value = 'all';
    document.getElementById('searchInput').value = '';
    pool = QUESTIONS.slice();
    currentIndex = pool.indexOf(q);
  }

  document.querySelector('.toolbar').style.display = '';
  document.getElementById('fSpecial').style.display = '';
  updateFilterBadge();
  render();
  window.scrollTo(0, 0);
}

// ── Progress View ────────────────────────────────────────────────────────────

function renderProgress() {
  var catTotal = {}, catAnswered = {};
  for (var c = 0; c < CATEGORIES.length; c++) {
    catTotal[CATEGORIES[c]] = 0;
    catAnswered[CATEGORIES[c]] = 0;
  }

  var noteCount = 0;
  for (var i = 0; i < QUESTIONS.length; i++) {
    var q = QUESTIONS[i];
    if (catTotal[q.category] !== undefined) catTotal[q.category]++;
    if (answered.indexOf(q.id) !== -1 && catAnswered[q.category] !== undefined) catAnswered[q.category]++;
    try { if (localStorage.getItem('ib_note_' + q.id)) noteCount++; } catch(e) {}
  }

  var total = QUESTIONS.length;
  var done = answered.length;
  var pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // SVG ring
  var r = 42, circ = 2 * Math.PI * r;
  var offset = circ - (pct / 100) * circ;

  var html = '';
  html += '<header class="view-head">';
  html += '<p class="view-eyebrow">Progress</p>';
  html += '<h1 class="view-title">学习进度</h1>';
  html += '<p class="view-sub">每看一次答案就算完成一题。</p>';
  html += '</header>';

  // completion ring
  html += '<section class="progress-hero">';
  html += '<div class="progress-ring-wrap">';
  html += '<svg class="progress-ring-svg" viewBox="0 0 100 100" aria-hidden="true">';
  html += '<circle class="progress-ring-bg" cx="50" cy="50" r="' + r + '"/>';
  html += '<circle class="progress-ring-fill" cx="50" cy="50" r="' + r + '" stroke-dasharray="' + circ + '" stroke-dashoffset="' + offset + '"/>';
  html += '</svg>';
  html += '<div class="progress-ring-pct"><span>' + pct + '<small>%</small></span></div>';
  html += '</div>';
  html += '<div class="progress-hero-text">';
  html += '<div class="progress-ring-label">已完成</div>';
  html += '<div class="progress-hero-frac">' + done + ' <span>/ ' + total + ' 题</span></div>';
  html += '<div class="progress-hero-note">' + (pct >= 100 ? '全部完成，太棒了！' : '还剩 ' + Math.max(0, total - done) + ' 题，继续加油') + '</div>';
  html += '</div>';

  // insights (inside the hero card)
  html += '<dl class="progress-insights" aria-label="学习洞察">';
  html += '<div class="tone-pink"><dt>收藏题</dt><dd>' + starred.length + '</dd></div>';
  html += '<div class="tone-amber"><dt>待复习</dt><dd>' + reviewList.length + '</dd></div>';
  html += '<div class="tone-green"><dt>笔记</dt><dd>' + noteCount + '</dd></div>';
  html += '</dl>';
  html += '</section>';

  // category progress bars (clickable to expand)
  html += '<h2 class="view-section-title">分类进度 <span>点击查看题目</span></h2>';
  html += '<div class="progress-cat-list">';
  for (var k = 0; k < CATEGORIES.length; k++) {
    var cat = CATEGORIES[k];
    var ct = catTotal[cat], ca = catAnswered[cat];
    if (ct === 0) continue;
    var cpct = ct > 0 ? Math.round((ca / ct) * 100) : 0;
    var isOpen = expandedCat === cat;
    html += '<div class="progress-cat-section">';
    html += '<button class="progress-cat-row progress-cat-clickable' + (isOpen ? ' progress-cat-expanded' : '') + '" aria-expanded="' + isOpen + '" aria-controls="catDetail_' + k + '" onclick="toggleCatDetail(\'' + cat.replace(/'/g, "\\'") + '\')">';
    html += '<span class="progress-cat-top"><span class="progress-cat-name">' + esc(cat) + '</span>';
    html += '<span class="progress-cat-frac"><span><b>' + ca + '</b> / ' + ct + '</span>' + ic('chevron-right', 'progress-cat-chevron' + (isOpen ? ' open' : '')) + '</span></span>';
    html += '<span class="progress-bar-track" style="display:block"><span class="progress-bar-fill" style="display:block;width:' + cpct + '%"></span></span>';
    html += '</button>';
    html += '<div class="progress-cat-detail" id="catDetail_' + k + '"' + (isOpen ? '' : ' style="display:none"') + '>';
    if (isOpen) {
      html += buildCatDetailHTML(cat);
    }
    html += '</div>';
    html += '</div>';
  }
  html += '</div>';

  // mode
  html += '<h2 class="view-section-title">当前设置</h2>';
  html += '<div class="progress-setting">';
  html += '<span>刷题模式</span>';
  html += '<span class="progress-setting-value">' + (studyMode === 'shuffle' ? ic('shuffle') + 'Shuffle' : ic('list') + 'Sequential') + '</span>';
  html += '</div>';

  document.getElementById('progressView').innerHTML = html;
}

var expandedCat = null;

function toggleCatDetail(cat) {
  if (expandedCat === cat) {
    expandedCat = null;
  } else {
    expandedCat = cat;
  }
  renderProgress();
  // scroll the expanded section into view
  if (expandedCat) {
    var idx = CATEGORIES.indexOf(expandedCat);
    var el = document.getElementById('catDetail_' + idx);
    if (el) {
      setTimeout(function() {
        el.previousElementSibling.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }
}

function buildCatDetailHTML(cat) {
  var qs = [];
  for (var i = 0; i < QUESTIONS.length; i++) {
    if (QUESTIONS[i].category === cat) qs.push(QUESTIONS[i]);
  }
  var html = '';
  for (var j = 0; j < qs.length; j++) {
    var q = qs[j];
    var isDone = answered.indexOf(q.id) !== -1;
    html += '<button class="cat-detail-item" onclick="goToQuestion(\'' + q.id + '\')">';
    html += '<span class="cat-detail-status' + (isDone ? ' done' : '') + '" title="' + (isDone ? '已完成' : '未完成') + '">' + ic(isDone ? 'check-circle' : 'circle') + '<span class="sr-only">' + (isDone ? '已完成' : '未完成') + '</span></span>';
    html += '<span class="badge ' + diffClassOf(q.difficulty) + ' cat-detail-diff">' + esc(q.difficulty) + '</span>';
    html += '<span class="cat-detail-q">' + esc(q.question) + '</span>';
    html += '</button>';
  }
  return html;
}

// ─────────────────────────────────────────────────────────────────────────────

// ── Keyboard shortcuts ───────────────────────────────────────────────────────
// → / N: next · Space: reveal · S: star · R: review later · Esc: close AI panel

document.addEventListener('keydown', function(e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  var t = e.target;
  if (e.key === 'Escape') {
    if (t && t.blur) t.blur();
    closeAiPanel();
    return;
  }
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
  var drilling = activeTab === 'practice' || (activeTab === 'review' && reviewMode === 'drilling');
  if (!drilling || !current || document.getElementById('qPanel').style.display === 'none') return;
  var k = e.key.toLowerCase();
  if (k === 'arrowright' || k === 'n') { nextQuestion(); }
  else if (k === ' ') { if (!document.getElementById('showBtn').disabled) showAnswer(); }
  else if (k === 's') { toggleStar(); }
  else if (k === 'r') { toggleReview(); }
  else return;
  e.preventDefault();
});

// ─────────────────────────────────────────────────────────────────────────────

fetch('questions.json')
  .then(function(r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  })
  .then(function(data) {
    for (var i = 0; i < data.length; i++) {
      var it = data[i];
      it._hay = (it.question + ' ' + it.answer_en + ' ' + it.answer_zh + ' ' + it.explanation_zh).toLowerCase();
    }
    QUESTIONS = data;
    applyFilter();
  })
  .catch(function() {
    showEmpty();
    document.getElementById('emptyState').querySelector('p').textContent =
      '\u9898\u5e93\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u5237\u65b0\u91cd\u8bd5';
  });
