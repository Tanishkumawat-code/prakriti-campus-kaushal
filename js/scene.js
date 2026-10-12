window.Prakriti = window.Prakriti || {};
(function (P) {
  'use strict';
  var $ = P.$, $$ = P.$$, el = P.el, clamp = P.clamp, mix = P.mix;
  var canopy = [], fruits = [], heap = [], wins = [], flies = [], bldEls = {};
  var riverA, riverB;
  var STY = { engg: '#E1CFA8', lib: '#CBD9C4', can: '#EBCFA9', kshi: '#BFD0D6', nar: '#D8C6B0', spo: '#D4D9C2' };
  var GREENS = ['#3D8B57', '#4C9E69', '#2E7649', '#5BAF76'];
  var SKY = [
    [0, '#0b1736', '#1f2f5e'], [5, '#26346a', '#b86a8e'], [6.5, '#f0a070', '#fcd9a0'],
    [9, '#86c4e8', '#d7eef6'], [13, '#62b2e2', '#cde9f4'], [17, '#86bcdc', '#f6daa0'],
    [18.5, '#e2855e', '#f7c47c'], [20, '#3b3a72', '#bf6a8c'], [21.5, '#121b42', '#2a3566'], [24, '#0b1736', '#1f2f5e']
  ];
  function wavePath(y0, a, phase) {
    var d = 'M-120 ' + y0;
    for (var x = -120, i = 0; x < 1320; x += 60, i++) {
      var dir = ((i + phase) % 2) ? 1 : -1;
      d += ' q30 ' + (-a * 2 * dir) + ' 60 0';
    }
    return d + ' V540 H-120Z';
  }
  function skyAt(h) {
    for (var i = 0; i < SKY.length - 1; i++) {
      var a = SKY[i], b = SKY[i + 1];
      if (h >= a[0] && h <= b[0]) {
        var t = (h - a[0]) / (b[0] - a[0]);
        return [mix(a[1], b[1], t), mix(a[2], b[2], t)];
      }
    }
    return [SKY[0][1], SKY[0][2]];
  }
  function darkAt(h) {
    if (h < 5 || h >= 21) return 1;
    if (h < 7) return 1 - (h - 5) / 2;
    if (h < 18) return 0;
    return (h - 18) / 3;
  }
  P.buildScene = function () {
    var gStars = $('#stars'), gRiver = $('#river'), gFish = $('#fish'), gLand = $('#landfill');
    var gTree = $('#tree'), gBlds = $('#blds'), gWins = $('#wins'), gFlies = $('#flies');
    var sr = P.mulberry32(21), i;
    for (i = 0; i < 46; i++) el('circle', { cx: (sr() * 1200).toFixed(0), cy: (sr() * 260).toFixed(0), r: (sr() * 1.4 + .5).toFixed(1), fill: '#fff' }, gStars);
    riverA = el('path', { d: '', fill: '#2A84A6', opacity: .55, 'class': 'river-a' }, gRiver);
    riverB = el('path', { d: '', fill: '#2A84A6', 'class': 'river-b' }, gRiver);
    [[250, 490], [560, 482], [930, 494]].forEach(function (p) {
      var g = el('g', { transform: 'translate(' + p[0] + ' ' + p[1] + ')' }, gFish);
      el('ellipse', { cx: 0, cy: 0, rx: 11, ry: 5, fill: '#F4B860' }, g);
      el('path', { d: 'M10 0 L19 -5 L19 5Z', fill: '#F4B860' }, g);
      el('circle', { cx: -6, cy: -1, r: 1.2, fill: '#12302A' }, g);
    });
    [[22, 404, 16, 9], [40, 405, 15, 8], [31, 397, 13, 8], [16, 398, 10, 6], [46, 398, 9, 6], [27, 390, 9, 6], [38, 390, 8, 5]].forEach(function (p, i) {
      heap.push(el('ellipse', { cx: p[0], cy: p[1], rx: p[2], ry: p[3], fill: ['#8d857a', '#a39a8c', '#7a7368'][i % 3] }, gLand));
    });
    el('path', { d: 'M598 412 C606 382 603 352 596 318 L644 318 C637 352 635 382 643 412Z', fill: '#6B4A35' }, gTree);
    el('path', { d: 'M620 412 C623 380 622 350 620 322', stroke: '#573A29', fill: 'none', 'stroke-width': 3, 'stroke-linecap': 'round' }, gTree);
    [532, 556, 578, 664, 686, 708].forEach(function (x, i) {
      el('path', { d: 'M' + x + ' ' + (318 + (i % 2) * 6) + ' C' + (x + (x < 620 ? 5 : -5)) + ' 360 ' + (x + (x < 620 ? -3 : 3)) + ' 390 ' + x + ' 411', stroke: '#7A5A42', fill: 'none', 'stroke-width': i % 3 === 0 ? 4 : 3, 'stroke-linecap': 'round' }, gTree);
    });
    el('path', { d: 'M606 330 C580 318 560 306 540 296 M634 330 C660 318 680 306 700 296', stroke: '#6B4A35', fill: 'none', 'stroke-width': 7, 'stroke-linecap': 'round' }, gTree);
    var tr = P.mulberry32(7), c;
    for (c = 0; c < 54; c++) {
      var ang = tr() * Math.PI * 2, rad = Math.sqrt(tr());
      var cx = 620 + Math.cos(ang) * rad * 128, cy = 282 + Math.sin(ang) * rad * 76, rr = 17 + tr() * 14;
      canopy.push({ e: el('circle', { cx: cx.toFixed(1), cy: cy.toFixed(1), r: rr.toFixed(1) }, gTree), t: clamp(rad * .75 + tr() * .3, 0, 1), i: c });
    }
    var f, fa, fr;
    for (f = 0; f < 14; f++) {
      fa = tr() * Math.PI * 2; fr = Math.sqrt(tr()) * .85;
      fruits.push({ e: el('circle', { cx: (620 + Math.cos(fa) * fr * 128).toFixed(1), cy: (282 + Math.sin(fa) * fr * 76).toFixed(1), r: 3.6, fill: '#F2B94D' }, gTree), t: .55 + tr() * .4 });
    }
    P.ZONES.forEach(function (z, zi) {
      var top = 410 - z.h;
      var g = el('g', { 'class': 'bld', tabindex: 0, role: 'button', 'aria-label': z.name + '. Select to inspect this building.', 'data-id': z.id }, gBlds);
      bldEls[z.id] = g;
      var cx = z.x + z.w / 2;
      if (z.id === 'lib') { el('path', { d: 'M' + (cx - 40) + ' ' + (top - 2) + ' a40 40 0 0 1 80 0Z', fill: '#5E9C8F' }, g); el('rect', { x: cx - 3, y: top - 52, width: 6, height: 12, fill: '#5E9C8F' }, g); }
      if (z.id === 'can') { el('path', { d: 'M' + (z.x - 6) + ' ' + top + ' L' + cx + ' ' + (top - 28) + ' L' + (z.x + z.w + 6) + ' ' + top + 'Z', fill: '#A9553D' }, g); el('rect', { x: z.x + z.w - 26, y: top - 34, width: 10, height: 22, fill: '#7B4B3A' }, g); el('circle', { cx: z.x + z.w - 21, cy: top - 44, r: 7, fill: '#fff', opacity: .55 }, g); el('circle', { cx: z.x + z.w - 16, cy: top - 56, r: 9, fill: '#fff', opacity: .35 }, g); }
      if (z.id === 'spo') { el('path', { d: 'M' + (z.x - 4) + ' ' + top + ' Q' + cx + ' ' + (top - 40) + ' ' + (z.x + z.w + 4) + ' ' + top + 'Z', fill: '#7FA6B8' }, g); }
      el('rect', { 'class': 'body', x: z.x, y: top, width: z.w, height: z.h, rx: 3, fill: STY[z.id] }, g);
      el('rect', { x: z.x + z.w - 14, y: top, width: 14, height: z.h, fill: '#000', opacity: .07 }, g);
      el('rect', { x: z.x - 3, y: top - 6, width: z.w + 6, height: 8, rx: 2, fill: '#000', opacity: .18 }, g);
      el('rect', { x: z.x, y: 402, width: z.w, height: 8, fill: '#000', opacity: .14 }, g);
      el('rect', { x: cx - 9, y: 382, width: 18, height: 28, rx: 2, fill: '#3a4a47' }, g);
      if (z.id === 'engg') { for (var p = 0; p < 5; p++) { var x0 = z.x + 14 + p * 31; el('path', { d: 'M' + x0 + ' ' + (top - 6) + ' H' + (x0 + 24) + ' L' + (x0 + 28) + ' ' + (top - 22) + ' H' + (x0 + 4) + 'Z', fill: '#2E4B6B', stroke: '#9fc3df', 'stroke-width': 1 }, g); } }
      if (z.id === 'kshi') { [20, 56].forEach(function (o) { el('rect', { x: z.x + o, y: top - 30, width: 28, height: 24, rx: 8, fill: '#35484A' }, g); }); }
      if (z.id === 'nar') { [14, 48, 82].forEach(function (o) { el('rect', { x: z.x + o, y: top - 30, width: 26, height: 24, rx: 8, fill: '#35484A' }, g); }); }
      var lw = z.name.length * 6.4 + 18, lg = el('g', { 'class': 'lbl' }, g), ly = top - (z.id === 'lib' ? 64 : z.id === 'can' ? 70 : z.id === 'spo' ? 58 : 42);
      el('rect', { x: cx - lw / 2, y: ly, width: lw, height: 22, rx: 11 }, lg);
      var tx = el('text', { x: cx, y: ly + 15, 'text-anchor': 'middle' }, lg); tx.textContent = z.name;
      g.addEventListener('click', function () { P.selectZone(z.id); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); P.selectZone(z.id); } });
      var cols = Math.floor((z.w - 20) / 22), rows = Math.max(1, Math.floor((z.h - 36) / 26)), sp = (z.w - 24) / cols, wr = P.mulberry32(100 + zi);
      for (var r = 0; r < rows; r++) for (var cc = 0; cc < cols; cc++) {
        var w = el('rect', { x: (z.x + 12 + cc * sp + (sp - 12) / 2).toFixed(1), y: top + 14 + r * 26, width: 12, height: 15, rx: 2, fill: '#BFD9E6' }, gWins);
        wins.push({ e: w, z: z.id, t: wr() });
      }
    });
    var fr2 = P.mulberry32(33), q;
    for (q = 0; q < 16; q++) {
      var fc = el('circle', { cx: (430 + fr2() * 340).toFixed(0), cy: (300 + fr2() * 110).toFixed(0), r: 2.6, fill: '#FFE27A', 'class': 'fly' }, gFlies);
      fc.style.animationDelay = (fr2() * 3.4).toFixed(2) + 's';
      flies.push(fc);
    }
  };
  P.renderScene = function () {
    var H = Math.floor(P.state.now), t = H + .5, S = P.state.S, d = darkAt(t), sky = skyAt(t);
    $('#sky-a').setAttribute('stop-color', sky[0]); $('#sky-b').setAttribute('stop-color', sky[1]);
    $('#stars').style.opacity = clamp(d * 1.1, 0, 1);
    var day = H >= 6 && H < 18, u = day ? (t - 6) / 12 : (((t < 6 ? t + 24 : t) - 18) / 12), ox = 90 + u * 1020, oy = 372 - Math.sin(Math.PI * u) * 290;
    var orb = $('#orb'), glow = $('#orb-glow');
    orb.setAttribute('cx', ox); orb.setAttribute('cy', oy); glow.setAttribute('cx', ox); glow.setAttribute('cy', oy);
    orb.setAttribute('fill', day ? '#FFD166' : '#EEF2FF');
    $('#glow-a').setAttribute('stop-color', day ? '#FFF2C0' : '#B9C8FF'); $('#glow-b').setAttribute('stop-color', day ? '#FFF2C0' : '#B9C8FF');
    $$('#clouds .cl').forEach(function (c) { c.style.opacity = (.85 - d * .6).toFixed(2); });
    $('#night').setAttribute('opacity', (d * .4).toFixed(2));
    $('#smog').setAttribute('opacity', clamp((70 - S.overall) / 70, 0, 1) * .6);
    var sw = S.sw / 100, rc = mix('#8a8a5c', '#2A84A6', clamp(sw * 1.2, 0, 1)), y0 = 458 + (1 - sw) * 20, amp = 3 + sw * 6;
    riverA.setAttribute('d', wavePath(y0 - 6, amp * .8, 1)); riverA.setAttribute('fill', rc);
    riverB.setAttribute('d', wavePath(y0 + 4, amp, 0)); riverB.setAttribute('fill', rc);
    $('#fish').style.display = sw > .62 ? '' : 'none';
    var n = Math.round((1 - S.div) * 7) + 1;
    heap.forEach(function (e, i) { e.style.display = i < n ? '' : 'none'; });
    var hl = S.overall / 100;
    canopy.forEach(function (c) {
      if (hl >= c.t) { c.e.setAttribute('fill', GREENS[c.i % 4]); c.e.setAttribute('opacity', 1); }
      else if (hl >= c.t - .14) { c.e.setAttribute('fill', '#C7A53C'); c.e.setAttribute('opacity', .9); }
      else c.e.setAttribute('opacity', 0);
    });
    fruits.forEach(function (f) { f.e.style.display = (hl > .72 && hl >= f.t) ? '' : 'none'; });
    $('#birds').style.display = (S.overall > 60 && d < .5) ? '' : 'none';
    var nf2 = d > .5 && S.overall >= 40 ? Math.round(S.overall / 100 * flies.length) : 0;
    flies.forEach(function (e, i) { e.style.display = i < nf2 ? '' : 'none'; });
    var mx = {}; P.ZONES.forEach(function (z) { mx[z.id] = Math.max.apply(null, P.mean[z.id].e); });
    var lit = {}; P.ZONES.forEach(function (z) { lit[z.id] = clamp(P.actual(z.id, 'e', H) / mx[z.id] * 1.05, .05, 1); });
    wins.forEach(function (w) {
      var on = w.t < lit[w.z];
      w.e.setAttribute('fill', on ? (d > .25 ? '#FFC85A' : '#E7DDB0') : (d > .25 ? '#1B2745' : '#BFD9E6'));
    });
    var gRings = $('#rings');
    while (gRings.firstChild) gRings.removeChild(gRings.firstChild);
    P.state.alerts.forEach(function (a) {
      var z = P.ZONES.find(function (q) { return q.id === a.zone; });
      el('rect', { x: z.x - 8, y: 410 - z.h - 14, width: z.w + 16, height: z.h + 20, rx: 10, fill: 'none', stroke: '#F27AA3', 'stroke-width': 4, 'class': 'pulse' }, gRings);
      if (a.res === 'w') {
        el('ellipse', { cx: z.x + z.w / 2, cy: 415, rx: z.w * .45, ry: 7, fill: '#5BB6D8', opacity: .8 }, gRings);
        [-26, 0, 26].forEach(function (o, i) {
          var dp = el('path', { d: 'M' + (z.x + z.w / 2 + o) + ' 386 q4 7 0 10 q-4 -3 0 -10Z', fill: '#5BB6D8', 'class': 'drip' }, gRings);
          dp.style.animationDelay = (i * .4) + 's';
        });
      }
    });
    Object.keys(bldEls).forEach(function (id) { bldEls[id].classList.toggle('sel', P.state.sel === id); });
  };
  var LEAF = 'M12 2 C20 6 22 14 12 22 C2 14 4 6 12 2Z';
  function pctText(r) {
    var p = Math.round((r - 1) * 100);
    return Math.abs(p) < 1 ? 'in line with a typical day' : Math.abs(p) + '% ' + (p > 0 ? 'above' : 'below') + ' a typical day';
  }
  P.renderHero = function () {
    var S = P.state.S, sc = Math.round(S.overall), head;
    if (P.state.alerts.length) {
      var z = P.ZONES.find(function (q) { return q.id === P.state.alerts[0].zone; });
      head = 'Something is off at ' + z.name + '.';
    } else head = sc < 40 ? 'The campus is wilting.' : sc < 60 ? 'The campus is holding steady.' : sc < 80 ? 'The campus is greening up.' : 'The campus is thriving.';
    $('#hl').textContent = head;
    $('#sub').textContent = 'Eco-score ' + sc + ' out of 100. Electricity is heading ' + pctText(S.re) + ', water ' + pctText(S.rw) + ', and ' + Math.round(S.div * 100) + '% of waste stays out of landfill.';
    var lv = $('#leaves'); lv.setAttribute('aria-label', 'Eco-score ' + sc + ' out of 100'); lv.innerHTML = '';
    var filled = Math.round(S.overall / 10), i;
    for (i = 0; i < 10; i++) {
      var s = document.createElementNS(P.NS, 'svg');
      s.setAttribute('viewBox', '0 0 24 24');
      P.el('path', { d: LEAF, fill: i < filled ? 'var(--moss)' : 'var(--moss-soft)', stroke: 'var(--moss)', 'stroke-width': 1.3, 'stroke-opacity': i < filled ? 0 : .5 }, s);
      P.el('path', { d: 'M12 6 V19', stroke: i < filled ? 'var(--card)' : 'var(--moss)', 'stroke-width': 1.1, 'stroke-opacity': .7, fill: 'none' }, s);
      lv.appendChild(s);
    }
  };
})(window.Prakriti);
