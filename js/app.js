window.Prakriti = window.Prakriti || {};
(function (P) {
  'use strict';
  var $ = P.$, $$ = P.$$;
  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4 L20 12 L7 20Z"/></svg>';
  var PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4.5" height="16" rx="1"/><rect x="13.5" y="4" width="4.5" height="16" rx="1"/></svg>';
  function phaseName(h) { return h < 5 ? 'night' : h < 7 ? 'dawn' : h < 17 ? 'daytime' : h < 19 ? 'dusk' : 'night'; }
  function stop() {
    P.state.playing = false;
    if (P.state.timer) { clearInterval(P.state.timer); P.state.timer = null; }
  }
  function renderDock() {
    var H = Math.floor(P.state.now);
    $('#clock').textContent = P.clock(H);
    $('#phase').textContent = phaseName(H);
    var tm = $('#time'); tm.value = H; tm.setAttribute('aria-valuetext', P.clock(H));
    $('#play').innerHTML = P.state.playing ? PAUSE : PLAY;
    $('#play').setAttribute('aria-label', P.state.playing ? 'Pause' : 'Play the day');
  }
  P.selectZone = function (id) {
    P.state.sel = (P.state.sel === id) ? 'all' : id;
    P.renderAll();
  };
  P.renderAll = function () {
    P.state.S = P.scoreFor(P.state.red, P.state.divBase, P.itemsTotal());
    P.state.alerts = P.detect();
    $$('#seg button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-r') === P.state.res); });
    P.renderScene();
    P.renderHero();
    P.renderStrip();
    P.renderChart();
    P.renderZones();
    P.renderAlerts();
    P.renderWhatIf();
    P.renderTally();
    P.renderScoreBars();
    P.renderInspector();
    P.renderAtlas();
    P.renderCarbon();
    renderDock();
  };
  function applyTheme(mode) {
    if (mode === 'dark' || mode === 'light') document.documentElement.setAttribute('data-theme', mode);
    else document.documentElement.removeAttribute('data-theme');
    $('#theme').textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? 'Light' : 'Dark';
  }
  try {
    var saved = localStorage.getItem('prakriti-theme');
    if (saved) applyTheme(saved);
    else applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch (e) { applyTheme('light'); }

  P.buildScene();
  P.renderTimeline();
  P.renderPledges();
  P.initSorter();
  P.initCarbon();

  $('#theme').addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('prakriti-theme', next); } catch (err) {}
  });
  $('#play').addEventListener('click', function () {
    if (P.state.playing) { stop(); renderDock(); return; }
    if (P.state.now >= 23) P.state.now = 0;
    P.state.playing = true;
    P.state.timer = setInterval(function () {
      if (P.state.now >= 23) { stop(); renderDock(); return; }
      P.state.now++;
      P.renderAll();
    }, 650);
    renderDock();
  });
  $('#time').addEventListener('input', function () { stop(); P.state.now = +this.value; P.renderAll(); });
  $('#d-leak').addEventListener('click', function () {
    stop();
    P.state.anoms = P.state.anoms.filter(function (a) { return !(a.zone === 'kshi' && a.res === 'w'); });
    P.state.anoms.push({ zone: 'kshi', res: 'w', start: 1, extra: 1500 });
    P.state.now = 4; P.state.sel = 'kshi'; P.state.res = 'w';
    P.renderAll();
  });
  $('#d-ac').addEventListener('click', function () {
    stop();
    P.state.anoms = P.state.anoms.filter(function (a) { return !(a.zone === 'engg' && a.res === 'e'); });
    P.state.anoms.push({ zone: 'engg', res: 'e', start: 21, extra: 95 });
    P.state.now = 23; P.state.sel = 'engg'; P.state.res = 'e';
    P.renderAll();
  });
  $('#d-canteen').addEventListener('click', function () {
    stop();
    P.state.anoms = P.state.anoms.filter(function (a) { return !(a.zone === 'can' && a.res === 'w'); });
    P.state.anoms.push({ zone: 'can', res: 'w', start: 19, extra: 2200 });
    P.state.now = 21; P.state.sel = 'can'; P.state.res = 'w';
    P.renderAll();
  });
  $('#d-sports').addEventListener('click', function () {
    stop();
    P.state.anoms = P.state.anoms.filter(function (a) { return !(a.zone === 'spo' && a.res === 'e'); });
    P.state.anoms.push({ zone: 'spo', res: 'e', start: 21, extra: 70 });
    P.state.now = 23; P.state.sel = 'spo'; P.state.res = 'e';
    P.renderAll();
  });
  $('#d-reset').addEventListener('click', function () {
    stop();
    P.state.anoms = [];
    P.state.ledger = { n: 0, e: 0, w: 0, money: 0 };
    P.state.red = { e: 0, w: 0, s: 0 };
    P.state.divBase = .22;
    P.state.applied = false;
    P.state.carbon = { retired: [] };
    P.state.items = { wet: 0, dry: 0, haz: 0, ewaste: 0 };
    P.state.now = 18; P.state.sel = 'all'; P.state.res = 'e';
    P.renderAll();
    var lg = $('#logit');
    if (lg) { lg.disabled = false; }
  });
  $$('#seg button').forEach(function (b) {
    b.addEventListener('click', function () { P.state.res = b.getAttribute('data-r'); P.renderAll(); });
  });
  ['l-ac', 'l-idle', 'l-leak', 'l-div'].forEach(function (id) { $('#' + id).addEventListener('input', P.renderWhatIf); });
  $('#apply').addEventListener('click', P.applyLevers);
  $('#undo').addEventListener('click', P.undoLevers);
  P.renderAll();
  window.__prakriti = { state: P.state, detect: P.detect, classify: P.classify, scoreFor: P.scoreFor };
})(window.Prakriti);
