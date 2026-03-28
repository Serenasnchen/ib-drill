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

  // reset answer state + AI panel + notes
  closeAiPanel();
  closeNotesPanel();
  document.getElementById('answerSection').classList.remove('visible');
  loadNote();
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
  document.getElementById('aiTriggerRow').style.display = '';
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
  document.getElementById('aiTriggerRow').style.display = 'none';
  document.querySelector('.card-notes').style.display = 'none';
  document.getElementById('emptyState').style.display = '';
  document.getElementById('footerHint').style.display = 'none';
  document.getElementById('sIdx').textContent   = '0';
  document.getElementById('sTotal').textContent = '0';
  document.getElementById('progressFill').style.width = '0%';

  var msg = '\u6ca1\u6709\u5339\u914d\u7684\u9898\u76ee\uff0c\u8bd5\u8bd5\u6362\u4e2a\u7b5b\u9009\u6761\u4ef6~';
  if (activeTab === 'review' && reviewSubFilter === 'review')
    msg = '\u8fd8\u6ca1\u6709\u5f85\u590d\u4e60\u7684\u9898\u76ee\uff0c\u53bb Practice \u6807\u8bb0\u5427 \ud83d\udccc';
  if (activeTab === 'review' && reviewSubFilter === 'starred')
    msg = '\u8fd8\u6ca1\u6709\u6536\u85cf\u7684\u9898\u76ee\uff0c\u53bb Practice \u6dfb\u52a0\u5427 \u2b50';
  document.getElementById('emptyState').querySelector('p').textContent = msg;
}

function showAnswer() {
  document.getElementById('answerSection').classList.add('visible');
  var btn = document.getElementById('showBtn');
  btn.textContent = '\u2713 Answer Revealed';
  btn.disabled = true;
  btn.className = 'btn btn-primary answered';
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
  if (activeTab === 'review' && reviewSubFilter === 'starred' && reviewMode === 'drilling') applyFilter();
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
  if (activeTab === 'review' && reviewSubFilter === 'review' && reviewMode === 'drilling') applyFilter();
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

// ── My Notes ──────────────────────────────────────────────────────────────

function toggleNotes() {
  var body = document.getElementById('notesBody');
  var chevron = document.getElementById('notesChevron');
  var isOpen = body.classList.toggle('open');
  chevron.classList.toggle('open', isOpen);
  if (isOpen) {
    setTimeout(function() { document.getElementById('notesInput').focus(); }, 60);
  }
}

function closeNotesPanel() {
  var body = document.getElementById('notesBody');
  var chevron = document.getElementById('notesChevron');
  if (body) body.classList.remove('open');
  if (chevron) chevron.classList.remove('open');
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
  'Accounting': ['为什么这样分类？', '现金流影响是？', '面试怎么表达更好？'],
  'Valuation':  ['为什么用这个方法？', 'EV vs Equity Value?', '常见 multiples？'],
  'M&A':        ['战略逻辑是什么？', '常见 synergies 类型？', '尽调重点在哪里？'],
  'LBO':        ['为什么 LBO 有吸引力？', '杠杆结构怎么设计？', 'IRR 驱动因素？']
};

function openAiPanel() {
  if (!current) return;
  var panel = document.getElementById('aiPanel');
  var trigger = document.getElementById('aiTriggerRow');
  panel.classList.add('open');
  trigger.style.display = 'none';

  var chips = AI_CHIPS[current.category] || ['为什么这样？', '能举个例子吗？', '面试怎么答？'];
  document.getElementById('aiChips').innerHTML = chips.map(function(c) {
    return '<button class="ai-chip" onclick="submitAiQuestion(\'' +
           c.replace(/\\/g,'\\\\').replace(/'/g,"\\'") + '\')">' + esc(c) + '</button>';
  }).join('');

  document.getElementById('aiResponse').innerHTML = '';
  document.getElementById('aiInput').value = '';
  setTimeout(function() { document.getElementById('aiInput').focus(); }, 150);
}

function closeAiPanel() {
  var panel = document.getElementById('aiPanel');
  var trigger = document.getElementById('aiTriggerRow');
  if (panel) panel.classList.remove('open');
  if (trigger) trigger.style.display = '';
}

function submitAiQuestion(q) {
  var input = document.getElementById('aiInput');
  var question = (q || input.value).trim();
  if (!question) return;
  input.value = '';

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
    var text = data.answer || data.error || '暂无回复，请重试。';
    renderAiReply(text, data.answer ? '— Powered by Gemini' : '');
  })
  .catch(function() {
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

function buildAiResponse(question) {
  if (!current) return '暂无题目数据。';

  var revealed = document.getElementById('answerSection').classList.contains('visible');

  var exp = current.explanation_zh || '';
  var re = /【([^】]+)】([^【]*)/g;
  var m, segs = {};
  while ((m = re.exec(exp)) !== null) { segs[m[1]] = m[2].trim(); }

  var what  = segs['这题在考什么']  || '';
  var logic = segs['正确回答逻辑'] || '';
  var traps = segs['容易错在哪里'] || '';

  var q = question.toLowerCase();
  var header, body;

  if (q.indexOf('错') !== -1 || q.indexOf('陷阱') !== -1 || q.indexOf('mistake') !== -1 || q.indexOf('wrong') !== -1) {
    header = '⚠️  容易错在哪里';
    body   = traps || '这道题没有特别记录的易错点。';
  } else if (q.indexOf('为什么') !== -1 || q.indexOf('why') !== -1 || q.indexOf('逻辑') !== -1 || q.indexOf('如何') !== -1 || q.indexOf('怎么') !== -1) {
    header = '📝  回答逻辑';
    body   = logic || '暂无具体逻辑分析。';
  } else if (q.indexOf('考') !== -1 || q.indexOf('考察') !== -1 || q.indexOf('test') !== -1) {
    header = '📋  这题在考什么';
    body   = what || '暂无具体分析。';
  } else {
    header = '✨  AI 解析';
    var parts = [];
    if (what)  parts.push('📋 考察点\n' + what);
    if (logic) parts.push('📝 回答逻辑\n' + logic);
    if (traps) parts.push('⚠️  易错点\n' + traps);
    body = parts.length ? parts.join('\n\n') : '暂无解析数据。';
  }

  var suffix = revealed
    ? ''
    : '\n\n💡 先自己思考，再点 Reveal Answer 对照标准答案！';

  return header + '\n\n' + body + suffix;
}

function typewriter(text, el, scrollEl) {
  var i = 0;
  var iv = setInterval(function() {
    if (i >= text.length) { clearInterval(iv); return; }
    el.textContent += text[i];
    i++;
    if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
  }, 18);
}

// ── Tab Navigation ───────────────────────────────────────────────────────────

function hideDrillUI() {
  var ids = ['qPanel', 'actionBar', 'aiTriggerRow', 'footerHint', 'emptyState'];
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

function switchTab(tab) {
  activeTab = tab;

  // update tab button active states
  var items = document.querySelectorAll('.tab-item');
  for (var i = 0; i < items.length; i++) {
    items[i].className = 'tab-item' + (items[i].getAttribute('data-tab') === tab ? ' active' : '');
  }

  hideDrillUI();
  hideAllViews();

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

  var html = '';
  html += '<div class="review-header">\ud83d\udd04 \u590d\u4e60\u4e2d\u5fc3</div>';

  // summary cards
  html += '<div class="view-grid">';
  html += '<div class="view-card"><div class="view-card-num c-amber">' + revCount + '</div><div class="view-card-label">\u5f85\u590d\u4e60</div></div>';
  html += '<div class="view-card"><div class="view-card-num c-pink">' + starCount + '</div><div class="view-card-label">\u6536\u85cf\u9898</div></div>';
  var reviewedCount = 0;
  for (var i = 0; i < reviewList.length; i++) {
    if (answered.indexOf(reviewList[i]) !== -1) reviewedCount++;
  }
  html += '<div class="view-card"><div class="view-card-num c-grn">' + reviewedCount + '</div><div class="view-card-label">\u5df2\u590d\u4e60</div></div>';
  html += '</div>';

  // sub-filter pills
  html += '<div class="review-sub-pills">';
  html += '<button class="review-pill' + (reviewSubFilter === 'review' ? ' active' : '') + '" onclick="setReviewSubFilter(\'review\')">';
  html += '<span class="review-pill-count">' + revCount + '</span>\ud83d\udccc \u5f85\u590d\u4e60</button>';
  html += '<button class="review-pill' + (reviewSubFilter === 'starred' ? ' active' : '') + '" onclick="setReviewSubFilter(\'starred\')">';
  html += '<span class="review-pill-count">' + starCount + '</span>\u2b50 \u6536\u85cf\u9898</button>';
  html += '</div>';

  // start button
  var label = reviewSubFilter === 'review' ? '\u5f00\u59cb\u590d\u4e60' : '\u5f00\u59cb\u5237\u6536\u85cf\u9898';
  html += '<button class="review-start-btn" onclick="startReviewDrill()"' + (activeCount === 0 ? ' disabled' : '') + '>';
  html += '\u25b6 ' + label + ' (' + activeCount + ' \u9898)</button>';

  // empty encouragement
  if (activeCount === 0) {
    html += '<div class="review-empty">';
    html += '<div class="review-empty-icon">' + (reviewSubFilter === 'review' ? '\ud83c\udf89' : '\u2b50') + '</div>';
    html += '<div class="review-empty-text">' +
      (reviewSubFilter === 'review'
        ? '\u6682\u65e0\u5f85\u590d\u4e60\u9898\u76ee<br>\u5728 Practice \u4e2d\u70b9\u51fb\u300cReview Later\u300d\u6dfb\u52a0'
        : '\u6682\u65e0\u6536\u85cf\u9898\u76ee<br>\u5728 Practice \u4e2d\u70b9\u51fb \u2606 \u6536\u85cf') +
      '</div></div>';
  }

  document.getElementById('reviewDashboard').innerHTML = html;
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
    backBtn.textContent = '\u2190 \u8fd4\u56de\u590d\u4e60\u4e2d\u5fc3';
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
  html += '<div class="notes-list-header">';
  html += '<span class="notes-list-title">\ud83d\udcd2 My Notes</span>';
  html += '<span class="notes-list-count">\u5171 ' + items.length + ' \u6761</span>';
  html += '</div>';

  if (items.length === 0) {
    html += '<div class="notes-list-empty">';
    html += '<div class="notes-list-empty-icon">\ud83d\udcdd</div>';
    html += '<div class="notes-list-empty-text">\u8fd8\u6ca1\u6709\u7b14\u8bb0<br>\u5728 Practice \u4e2d\u8bb0\u5f55\u4f60\u7684\u601d\u8003\u5427</div>';
    html += '</div>';
  } else {
    html += '<div class="notes-list">';
    for (var j = 0; j < items.length; j++) {
      var item = items[j];
      var diffClass = item.q.difficulty === 'Easy' ? 'badge-easy' : item.q.difficulty === 'Medium' ? 'badge-med' : 'badge-hard';
      html += '<div class="notes-list-item" onclick="goToQuestion(\'' + item.q.id + '\')">';
      html += '<div class="notes-item-badges">';
      html += '<span class="badge badge-cat">' + esc(item.q.category) + '</span>';
      html += '<span class="badge ' + diffClass + '">' + esc(item.q.difficulty) + '</span>';
      html += '</div>';
      html += '<div class="notes-item-q">' + esc(item.q.question) + '</div>';
      html += '<div class="notes-item-preview">\ud83d\udcdd ' + esc(item.note.substring(0, 80)) + (item.note.length > 80 ? '...' : '') + '</div>';
      html += '</div>';
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
  var items = document.querySelectorAll('.tab-item');
  for (var j = 0; j < items.length; j++) {
    items[j].className = 'tab-item' + (items[j].getAttribute('data-tab') === 'practice' ? ' active' : '');
  }

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
  render();
  window.scrollTo(0, 0);
}

// ── Progress View ────────────────────────────────────────────────────────────

function renderProgress() {
  var cats = ['Accounting', 'Valuation', 'M&A', 'LBO'];
  var catTotal = {}, catAnswered = {};
  for (var c = 0; c < cats.length; c++) {
    catTotal[cats[c]] = 0;
    catAnswered[cats[c]] = 0;
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

  // completion ring
  html += '<div class="view-section-title">\u5b66\u4e60\u8fdb\u5ea6</div>';
  html += '<div class="progress-ring-wrap">';
  html += '<svg class="progress-ring-svg" viewBox="0 0 100 100">';
  html += '<circle class="progress-ring-bg" cx="50" cy="50" r="' + r + '"/>';
  html += '<circle class="progress-ring-fill" cx="50" cy="50" r="' + r + '" stroke-dasharray="' + circ + '" stroke-dashoffset="' + offset + '"/>';
  html += '</svg>';
  html += '<div class="progress-ring-text">';
  html += '<div class="progress-ring-pct">' + pct + '%</div>';
  html += '<div class="progress-ring-label">\u5df2\u5b8c\u6210 ' + done + ' / ' + total + ' \u9898</div>';
  html += '</div></div>';

  // category progress bars
  html += '<div class="view-section-title">\u5206\u7c7b\u8fdb\u5ea6</div>';
  html += '<div class="progress-cat-list">';
  for (var k = 0; k < cats.length; k++) {
    var cat = cats[k];
    var ct = catTotal[cat], ca = catAnswered[cat];
    var cpct = ct > 0 ? Math.round((ca / ct) * 100) : 0;
    html += '<div class="progress-cat-row">';
    html += '<div class="progress-cat-top"><span class="progress-cat-name">' + esc(cat) + '</span>';
    html += '<span class="progress-cat-frac">' + ca + ' / ' + ct + '</span></div>';
    html += '<div class="progress-bar-track"><div class="progress-bar-fill" style="width:' + cpct + '%"></div></div>';
    html += '</div>';
  }
  html += '</div>';

  // insights grid
  html += '<div class="view-section-title">\u5b66\u4e60\u6d1e\u5bdf</div>';
  html += '<div class="progress-insights">';
  html += '<div class="view-card"><div class="view-card-num c-pink">' + starred.length + '</div><div class="view-card-label">\u6536\u85cf\u9898</div></div>';
  html += '<div class="view-card"><div class="view-card-num c-amber">' + reviewList.length + '</div><div class="view-card-label">\u5f85\u590d\u4e60</div></div>';
  html += '<div class="view-card"><div class="view-card-num c-grn">' + noteCount + '</div><div class="view-card-label">\u7b14\u8bb0</div></div>';
  html += '</div>';

  // mode
  html += '<div class="view-section-title">\u5f53\u524d\u8bbe\u7f6e</div>';
  html += '<div class="progress-cat-row">';
  html += '<div class="progress-cat-top"><span class="progress-cat-name">\u5237\u9898\u6a21\u5f0f</span>';
  html += '<span class="progress-cat-frac" style="color:var(--pink)">' + (studyMode === 'shuffle' ? '\u21c4 Shuffle' : '\u2192 Sequential') + '</span></div>';
  html += '</div>';

  document.getElementById('progressView').innerHTML = html;
}

// ─────────────────────────────────────────────────────────────────────────────

fetch('questions.json')
  .then(function(r) { return r.json(); })
  .then(function(data) {
    QUESTIONS = data;
    applyFilter();
  });
