/* প্লাম্বিং লেভেল-২ পরীক্ষা — static exam app (hash routes, no build step) */
(function () {
  'use strict';
  var D = window.QDATA;
  var app = document.getElementById('app');
  var L = ['ক', 'খ', 'গ', 'ঘ'];
  var BN = '০১২৩৪৫৬৭৮৯';
  function bn(x) { return String(x).replace(/[0-9]/g, function (d) { return BN[d]; }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var byId = {};
  D.items.forEach(function (it) { byId[it.id] = it; });

  var timerHandle = null;
  function stopTimer() { if (timerHandle) { clearInterval(timerHandle); timerHandle = null; } }

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ---------- home ---------- */
  function home() {
    stopTimer();
    document.title = 'প্লাম্বিং লেভেল-২ পরীক্ষা';
    var h = '<h1 class="center">প্লাম্বিং লেভেল-২ পরীক্ষা</h1>' +
      '<p class="center muted">প্লাম্বিং অ্যান্ড পাইপ ফিটিংস · NTVQF/BNQF লেভেল-২ · মোট ' + bn(D.pool.length) + 'টি আলাদা প্রশ্ন</p>' +
      '<p class="center"><a class="btn" href="download/">PDF ডাউনলোড</a> <a class="btn" href="offline/plumbing-exam-offline.html" download="plumbing-exam-offline.html">অফলাইন ভার্সন ডাউনলোড</a></p><p class="center" style="font-size:13px;opacity:.8">অফলাইন ভার্সন: একবার ডাউনলোড করে Chrome দিয়ে খুললে ইন্টারনেট ছাড়াই পুরো পরীক্ষা চলবে</p>';
    h += '<section class="section"><h2>১০টি পেপার পরীক্ষা</h2><div class="grid">';
    for (var p = 1; p <= 10; p++) {
      var P = D.papers[p] || { mcq: [], written: [] };
      var cnt = P.mcq.length ? bn(P.mcq.length) + 'টি প্রশ্ন' : (P.written.length ? 'লিখিত ' + bn(P.written.length) + 'টি' : 'শীঘ্রই');
      h += '<a class="btn" href="#/paper/' + p + '">পেপার ' + bn(p) + '<small>(' + cnt + ')</small></a>';
    }
    h += '</div></section>';
    if (D.common && D.common.length) h += '<section class="section"><h2>বেশি আসা প্রশ্ন</h2><p class="note">যে প্রশ্নগুলো ২ বা তার বেশি পেপারে এসেছে — মোট ' + bn(D.common.length) + 'টি, সবচেয়ে বেশিবার আসাগুলো আগে।</p>' +
      '<a class="btn fill" href="#/common">বেশি আসা প্রশ্নের পরীক্ষা</a></section>';
    h += '<section class="section"><h2>ফাইনাল মডেল টেস্ট</h2><div class="grid">';
    for (var m = 1; m <= D.models.length; m++) h += '<a class="btn" href="#/model/' + m + '">মডেল টেস্ট ' + bn(m) + '<small>(' + bn(D.models[m - 1].length) + 'টি)</small></a>';
    h += '</div><p class="note">প্রতিটি মডেল টেস্টে সব পেপার থেকে মিশ্রিত প্রশ্ন — যতবার খুলবেন একই প্রশ্ন আসবে।</p></section>';
    h += '<section class="section"><h2>র‍্যান্ডম প্র্যাকটিস</h2><p class="note">কয়টি প্রশ্ন দিতে চান বেছে নিন — প্রতিবার নতুন প্রশ্ন আসবে।</p>' +
      '<a class="btn fill" href="#/random">র‍্যান্ডম প্র্যাকটিস শুরু</a></section>';
    h += '<section class="section"><h2>৮০ প্রশ্নের পূর্ণ পরীক্ষা</h2><p class="note">৭৭টি বহুনির্বাচনী + ৩টি লিখিত প্রশ্ন (৭৮–৮০)।</p>' +
      '<a class="btn fill" href="#/exam">পূর্ণ পরীক্ষা শুরু</a></section>';
    app.innerHTML = h;
  }

  function randomPick() {
    stopTimer();
    var max = D.pool.length;
    var h = '<h1>র‍্যান্ডম প্র্যাকটিস</h1><p class="muted">সব পেপার মিলিয়ে ' + bn(max) + 'টি প্রশ্ন আছে। কয়টি প্রশ্ন দেবেন?</p><div class="pick">';
    [10, 20, 50, 100, 200].forEach(function (n) {
      var real = Math.min(n, max);
      h += '<a class="btn fill" href="#/random/' + n + '">' + bn(n) + 'টি' + (real < n ? '<small>(' + bn(real) + ')</small>' : '') + '</a>';
    });
    h += '</div><div class="row"><a class="btn" href="#/">← হোম</a></div>';
    app.innerHTML = h;
  }

  /* ---------- test ---------- */
  // items: array of {kind:'mcq', it} | {kind:'written', q, model}
  function runTest(title, list, retryHash) {
    stopTimer();
    document.title = title + ' — প্লাম্বিং লেভেল-২';
    var mcqCount = list.filter(function (x) { return x.kind === 'mcq'; }).length;
    var seconds = Math.max(5, mcqCount + list.length - mcqCount) * 60; // ১ মিনিট / প্রশ্ন
    var ans = {}; var done = false; var startedAt = Date.now();
    var savedName = '';
    try { savedName = window.name && window.name.indexOf('pl2name:') === 0 ? window.name.slice(8) : ''; } catch (e) {}

    var h = '<div class="testhead"><h1>' + esc(title) + '</h1><p class="muted" style="margin:2px 0 8px">' +
      bn(mcqCount) + 'টি বহুনির্বাচনী' + (list.length > mcqCount ? ' + ' + bn(list.length - mcqCount) + 'টি লিখিত' : '') +
      ' · সময় ' + bn(Math.round(seconds / 60)) + ' মিনিট</p>' +
      '<label for="nm" class="note">নাম</label><input id="nm" placeholder="আপনার নাম লিখুন" value="' + esc(savedName) + '"></div>' +
      '<div class="bar"><span id="prog">উত্তর: ০/' + bn(mcqCount) + '</span><span class="timer" id="tm"></span></div><div id="qs">';
    list.forEach(function (x, i) {
      var num = bn(i + 1) + '.';
      if (x.kind === 'mcq') {
        var it = x.it;
        h += '<div class="q" id="q' + i + '"><div class="qt">' + num + ' ' + esc(it.q) +
          (x.src ? ' <span class="src">(' + x.src + ')</span>' : '') + '</div>';
        it.options.forEach(function (o, k) {
          h += '<button type="button" class="opt" data-i="' + i + '" data-k="' + k + '"><span class="l">' + L[k] + ')</span><span>' + esc(o) + '</span></button>';
        });
        h += '<div class="exp hidden"></div></div>';
      } else {
        h += '<div class="q" id="q' + i + '"><div class="qt">' + num + ' ' + esc(x.q) + ' <span class="src">(লিখিত)</span></div>' +
          '<textarea data-w="' + i + '" placeholder="এখানে উত্তর লিখুন"></textarea><div class="exp hidden"><b>নমুনা উত্তর:</b> ' + esc(x.model) + '</div></div>';
      }
    });
    h += '</div><div id="res"></div><div class="row" id="actions">' +
      '<button type="button" class="btn green" id="submit" style="flex:1">জমা দিন</button></div>' +
      '<div class="row"><a class="btn" href="#/">← হোম</a></div>';
    app.innerHTML = h;
    window.scrollTo(0, 0);

    var nm = document.getElementById('nm');
    nm.addEventListener('input', function () { try { window.name = 'pl2name:' + nm.value; } catch (e) {} });
    var prog = document.getElementById('prog');
    function updProg() { prog.textContent = 'উত্তর: ' + bn(Object.keys(ans).length) + '/' + bn(mcqCount); }

    document.getElementById('qs').addEventListener('click', function (ev) {
      var b = ev.target.closest('.opt'); if (!b || done) return;
      var i = +b.dataset.i, k = +b.dataset.k;
      ans[i] = k;
      var box = document.getElementById('q' + i);
      box.querySelectorAll('.opt').forEach(function (o) { o.classList.toggle('sel', +o.dataset.k === k); });
      updProg();
    });

    var tm = document.getElementById('tm');
    function tick() {
      var left = seconds - Math.floor((Date.now() - startedAt) / 1000);
      if (left <= 0) { tm.textContent = 'সময় শেষ'; submit(true); return; }
      var m = Math.floor(left / 60), s = left % 60;
      tm.textContent = 'সময়: ' + bn(m) + ':' + bn(s < 10 ? '0' + s : s);
      tm.classList.toggle('low', left <= 60);
    }
    tick(); timerHandle = setInterval(tick, 1000);

    document.getElementById('submit').addEventListener('click', function () {
      var un = mcqCount - Object.keys(ans).length;
      var b = this;
      if (un > 0 && !b.dataset.sure) {
        b.dataset.sure = '1';
        b.textContent = bn(un) + 'টি বাকি — নিশ্চিত? আবার চাপুন';
        setTimeout(function () { if (b.isConnected) { delete b.dataset.sure; b.textContent = 'জমা দিন'; } }, 5000);
        return;
      }
      submit(false);
    });

    function submit(auto) {
      if (done) return; done = true; stopTimer();
      var right = 0, wrong = 0, skip = 0;
      list.forEach(function (x, i) {
        if (x.kind !== 'mcq') return;
        if (!(i in ans)) skip++; else if (ans[i] === x.it.answer) right++; else wrong++;
      });
      document.getElementById('qs').classList.add('locked');
      document.querySelectorAll('textarea').forEach(function (t) { t.readOnly = true; });
      var used = Math.floor((Date.now() - startedAt) / 1000);
      var name = nm.value.trim(); nm.readOnly = true;
      var pct = mcqCount ? Math.round(right * 100 / mcqCount) : 0;
      var r = '<div class="result">' + (auto ? '<p><b>সময় শেষ — খাতা জমা হয়ে গেছে।</b></p>' : '') +
        '<div style="font-size:18px;font-weight:700">' + (name ? esc(name) + ' — ' : '') + 'ফলাফল</div>' +
        (mcqCount ? '<div class="stats"><div class="stat ok"><div class="n">' + bn(right) + '</div>সঠিক</div>' +
          '<div class="stat bad"><div class="n">' + bn(wrong) + '</div>ভুল</div>' +
          '<div class="stat skip"><div class="n">' + bn(skip) + '</div>বাদ</div></div>' +
          '<div>নম্বর: <b>' + bn(right) + '/' + bn(mcqCount) + '</b> (' + bn(pct) + '%) · সময় লেগেছে ' + bn(Math.floor(used / 60)) + ' মিনিট ' + bn(used % 60) + ' সেকেন্ড</div>'
          : '<div>লিখিত পরীক্ষা — নমুনা উত্তরের সাথে নিজে মিলিয়ে নিন।</div>') +
        (list.length > mcqCount && mcqCount ? '<p class="note">লিখিত প্রশ্নের নম্বর স্বয়ংক্রিয়ভাবে দেওয়া হয় না — নমুনা উত্তরের সাথে মিলিয়ে নিন।</p>' : '') +
        '</div>';
      document.getElementById('res').innerHTML = r;
      document.getElementById('actions').innerHTML =
        '<button type="button" class="btn fill" id="show" style="flex:1">সব উত্তর দেখুন</button>' +
        '<a class="btn green" id="again" href="#/again" style="flex:1">আবার দিন</a>';
      document.getElementById('again').addEventListener('click', function (e) {
        e.preventDefault();
        if (location.hash === retryHash) route(); else location.hash = retryHash;
      });
      document.getElementById('show').addEventListener('click', showAll);
      // written model answers appear right after submit
      list.forEach(function (x, i) { if (x.kind !== 'mcq') document.querySelector('#q' + i + ' .exp').classList.remove('hidden'); });
      document.getElementById('res').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function showAll() {
      list.forEach(function (x, i) {
        if (x.kind !== 'mcq') return;
        var it = x.it, box = document.getElementById('q' + i), a = ans[i];
        var state = !(i in ans) ? 'skip' : (a === it.answer ? 'right' : 'wrong');
        box.classList.add(state === 'right' ? 'isright' : state === 'wrong' ? 'iswrong' : 'isskip');
        box.querySelectorAll('.opt').forEach(function (o) {
          var k = +o.dataset.k;
          if (k === it.answer) o.classList.add('right');
          else if (k === a) o.classList.add('wrong');
        });
        var qt = box.querySelector('.qt');
        qt.insertAdjacentHTML('beforeend', state === 'right' ? '<span class="tag ok">সঠিক</span>' : state === 'wrong' ? '<span class="tag bad">ভুল</span>' : '<span class="tag skip">বাদ</span>');
        var ex = box.querySelector('.exp');
        ex.innerHTML = '<b>সঠিক উত্তর: ' + L[it.answer] + ') ' + esc(it.options[it.answer]) + '</b><br>' + esc(it.explain);
        ex.classList.remove('hidden');
      });
      var s = document.getElementById('show'); s.disabled = true; s.textContent = 'সব উত্তর দেখানো হয়েছে';
      var first = document.querySelector('.q.iswrong') || document.querySelector('.q');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function mcqList(ids, showSrc) {
    return ids.map(function (id) { var it = byId[id]; return { kind: 'mcq', it: it, src: showSrc ? 'পেপার ' + bn(it.paper) : '' }; });
  }

  function notFound() { stopTimer(); app.innerHTML = '<p>পাতাটি পাওয়া যায়নি।</p><a class="btn" href="#/">← হোম</a>'; }

  function route() {
    var h = (location.hash || '#/').replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean);
    if (!parts.length) return home();
    var a = parts[0], n = parseInt(parts[1], 10);
    if (a === 'paper' && n >= 1 && n <= 10) {
      var P = D.papers[n];
      if (!P || (!P.mcq.length && !P.written.length)) { stopTimer(); app.innerHTML = '<p>এই পেপারের প্রশ্ন এখনো যোগ হয়নি।</p><a class="btn" href="#/">← হোম</a>'; return; }
      var list = mcqList(P.mcq, false).concat(P.written.map(function (w) { return { kind: 'written', q: w.q, model: w.model_answer }; }));
      return runTest('পেপার ' + bn(n) + ' পরীক্ষা', list, '#/paper/' + n);
    }
    if (a === 'model' && n >= 1 && n <= D.models.length) return runTest('মডেল টেস্ট ' + bn(n), mcqList(D.models[n - 1], true), '#/model/' + n);
    if (a === 'common' && D.common) return runTest('বেশি আসা প্রশ্ন — ' + bn(D.common.length) + 'টি', D.common.map(function (id) { return { kind: 'mcq', it: byId[id], src: bn(D.commonPapers[id].length) + 'টি পেপারে এসেছে — পেপার ' + D.commonPapers[id].map(bn).join(', ') }; }), '#/common');
    if (a === 'random' && !parts[1]) return randomPick();
    if (a === 'random' && [10, 20, 50, 100, 200].indexOf(n) >= 0) {
      var ids = shuffle(D.pool).slice(0, Math.min(n, D.pool.length));
      return runTest('র‍্যান্ডম প্র্যাকটিস — ' + bn(ids.length) + 'টি প্রশ্ন', mcqList(ids, true), '#/random/' + n);
    }
    if (a === 'exam') {
      var ex = D.exam.map(function (x) { return x.type === 'mcq' ? { kind: 'mcq', it: x } : { kind: 'written', q: x.q, model: x.model_answer }; });
      return runTest('৮০ প্রশ্নের পূর্ণ পরীক্ষা', ex, '#/exam');
    }
    notFound();
  }
  window.addEventListener('hashchange', route);
  route();
})();
