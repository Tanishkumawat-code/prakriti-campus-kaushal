window.Prakriti = window.Prakriti || {};
(function (P) {
  'use strict';
  var $ = P.$, $$ = P.$$, fmt = P.fmt;
  P.zonesSel = function () { return P.state.sel === 'all' ? P.ZONES : P.ZONES.filter(function (z) { return z.id === P.state.sel; }); };
  function axisFmt(n) { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : Math.round(n) + ''; }
  P.renderStrip = function () {
    var H = Math.floor(P.state.now), tot = { e: 0, w: 0, s: 0 }, typ = { e: 0, w: 0, s: 0 };
    P.ZONES.forEach(function (z) {
      P.RES.forEach(function (r) {
        for (var h = 0; h <= H; h++) {
          tot[r] += P.actual(z.id, r, h, r === 's' ? { s: 0 } : undefined);
          typ[r] += P.mean[z.id][r][h];
        }
      });
    });
    function delta(a, b) {
      var p = Math.round((a / b - 1) * 100);
      return '<em class="' + (p > 0 ? 'up' : 'down') + '">' + (p > 0 ? '+' : '') + p + '%</em> vs typical';
    }
    $('#s-e').textContent = fmt(tot.e) + ' kWh'; $('#s-e2').innerHTML = 'Electricity so far, ' + delta(tot.e, typ.e);
    $('#s-w').textContent = fmt(tot.w / 1000) + ' kL'; $('#s-w2').innerHTML = 'Water so far, ' + delta(tot.w, typ.w);
    var landfill = tot.s * (1 - P.state.S.div);
    $('#s-s').textContent = fmt(tot.s) + ' kg'; $('#s-s2').textContent = 'Waste so far, ' + fmt(landfill) + ' kg heading to landfill';
    var co2 = tot.e * P.EF + landfill * P.EF_WASTE;
    $('#s-c').textContent = (co2 / 1000).toFixed(2) + ' t'; $('#s-c2').textContent = 'CO2e so far, about ' + fmt(co2 / P.TREE) + ' tree-years to absorb';
  };
  P.renderChart = function () {
    var r = P.state.res, zs = P.zonesSel(), H = Math.floor(P.state.now), act = [], mn = [], sg = [], h;
    for (h = 0; h < 24; h++) {
      var a = 0, m = 0, v = 0;
      zs.forEach(function (z) { a += P.actual(z.id, r, h); m += P.mean[z.id][r][h]; v += Math.pow(P.sd[z.id][r][h], 2); });
      act.push(a); mn.push(m); sg.push(Math.sqrt(v));
    }
    var W = 720, Ht = 260, pl = 48, pr = 12, pt = 14, pb = 28;
    var mx = Math.max.apply(null, act.slice(0, H + 1).concat(mn.map(function (m, i) { return m + 2.5 * sg[i]; }))) * 1.08;
    var X = function (hh) { return pl + (W - pl - pr) * hh / 23; };
    var Y = function (vv) { return pt + (Ht - pt - pb) * (1 - vv / mx); };
    var s = '', g;
    for (g = 0; g <= 4; g++) {
      var gv = mx * g / 4;
      s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(gv) + '" y2="' + Y(gv) + '" stroke="var(--line)" stroke-width="1"/><text x="' + (pl - 8) + '" y="' + (Y(gv) + 4) + '" text-anchor="end">' + axisFmt(gv) + '</text>';
    }
    ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'].forEach(function (l, i) {
      s += '<text x="' + X(i * 3) + '" y="' + (Ht - 8) + '" text-anchor="middle">' + l + '</text>';
    });
    var up = '', lo = '', i, j;
    for (i = 0; i < 24; i++) up += (i ? 'L' : 'M') + X(i) + ' ' + Y(mn[i] + 2.5 * sg[i]);
    for (j = 23; j >= 0; j--) lo += 'L' + X(j) + ' ' + Y(Math.max(0, mn[j] - 2.5 * sg[j]));
    s += '<path d="' + up + lo + 'Z" fill="var(--moss)" opacity=".16"/>';
    s += '<path d="' + mn.map(function (m, i) { return (i ? 'L' : 'M') + X(i) + ' ' + Y(m); }).join('') + '" fill="none" stroke="var(--muted)" stroke-width="1.6" stroke-dasharray="5 5"/>';
    var line = '';
    for (var k = 0; k <= H; k++) line += (k ? 'L' : 'M') + X(k) + ' ' + Y(act[k]);
    s += '<path d="' + line + 'L' + X(H) + ' ' + Y(0) + 'L' + X(0) + ' ' + Y(0) + 'Z" fill="var(--moss)" opacity=".14"/>';
    s += '<path d="' + line + '" fill="none" stroke="var(--moss)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>';
    s += '<line x1="' + X(H) + '" x2="' + X(H) + '" y1="' + pt + '" y2="' + (Ht - pb) + '" stroke="var(--gold)" stroke-width="2"/>';
    if (r !== 's') for (var q = 0; q <= H; q++) {
      var z = (act[q] - mn[q]) / sg[q];
      if (z > 3.5) s += '<circle cx="' + X(q) + '" cy="' + Y(act[q]) + '" r="5.5" fill="var(--rangoli)" stroke="var(--card)" stroke-width="2"/>';
    }
    s += '<circle cx="' + X(H) + '" cy="' + Y(act[H]) + '" r="5" fill="var(--moss)" stroke="var(--card)" stroke-width="2"/>';
    $('#chart').innerHTML = s;
    $('#chart').setAttribute('aria-label', P.NAME[r] + ' per hour for ' + (P.state.sel === 'all' ? 'the whole campus' : zs[0].name) + '. At ' + P.clock(H) + ' usage is ' + fmt(act[H]) + ' ' + P.UNIT[r] + ' against a typical ' + fmt(mn[H]) + '.');
    $('#ch-title').textContent = P.NAME[r] + ' through the day';
    $('#ch-sub').textContent = (P.state.sel === 'all' ? 'Whole campus.' : zs[0].name + '.') + ' The shaded band is what a normal day looks like, learned from the last 14 days. Axis in ' + P.UNIT[r] + ' per hour.';
  };
  function spark(zid, r) {
    var H = Math.floor(P.state.now), a = [], m = [], h;
    for (h = 0; h < 24; h++) { a.push(P.actual(zid, r, h)); m.push(P.mean[zid][r][h]); }
    var mx = Math.max.apply(null, m.concat(a.slice(0, H + 1))) * 1.1;
    var X = function (hh) { return 2 + 92 * hh / 23; }, Y = function (v) { return 26 - 24 * v / mx; };
    var tl = m.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join('');
    var al = '';
    for (var i = 0; i <= H; i++) al += (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(a[i]).toFixed(1);
    return '<svg viewBox="0 0 96 28" width="96" height="28" aria-hidden="true"><path d="' + tl + '" fill="none" stroke="var(--muted)" stroke-width="1" stroke-dasharray="2 2" opacity=".7"/><path d="' + al + '" fill="none" stroke="var(--moss)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  P.renderZones = function () {
    var r = P.state.res, H = Math.floor(P.state.now), html = '';
    function row(id, name, sub, zs) {
      var A = 0, M = 0;
      zs.forEach(function (z) { for (var h = 0; h <= H; h++) { A += P.actual(z.id, r, h); M += P.mean[z.id][r][h]; } });
      var p = Math.round((A / M - 1) * 100), flagged = P.state.alerts.some(function (a) { return zs.some(function (z) { return z.id === a.zone; }); });
      var sp = '';
      if (id === 'all') {
        var arr = [], arrM = [], h;
        for (h = 0; h < 24; h++) {
          var s1 = 0, s2 = 0;
          zs.forEach(function (z) { s1 += P.actual(z.id, r, h); s2 += P.mean[z.id][r][h]; });
          arr.push(s1); arrM.push(s2);
        }
        var mxA = Math.max.apply(null, arrM.concat(arr.slice(0, H + 1))) * 1.1, tl = '', al = '';
        arrM.forEach(function (v, i) { tl += (i ? 'L' : 'M') + (2 + 92 * i / 23).toFixed(1) + ' ' + (26 - 24 * v / mxA).toFixed(1); });
        for (var i = 0; i <= H; i++) al += (i ? 'L' : 'M') + (2 + 92 * i / 23).toFixed(1) + ' ' + (26 - 24 * arr[i] / mxA).toFixed(1);
        sp = '<svg viewBox="0 0 96 28" width="96" height="28" aria-hidden="true"><path d="' + tl + '" fill="none" stroke="var(--muted)" stroke-width="1" stroke-dasharray="2 2" opacity=".7"/><path d="' + al + '" fill="none" stroke="var(--moss)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      } else sp = spark(id, r);
      return '<button class="zrow" type="button" data-id="' + id + '" aria-pressed="' + (P.state.sel === id) + '"><span><b>' + name + '</b>' + (flagged ? '<span class="flag">Unusual</span>' : '') + '<small>' + sub + '</small></span>' + sp + '<span class="d ' + (p > 0 ? 'up' : 'down') + '">' + (p > 0 ? '+' : '') + p + '%</span></button>';
    }
    html += row('all', 'Whole campus', 'All six buildings', P.ZONES);
    P.ZONES.forEach(function (z) { html += row(z.id, z.name, P.KIND_LABEL[z.kind], [z]); });
    $('#zones').innerHTML = html;
    $$('#zones .zrow').forEach(function (b) { b.addEventListener('click', function () { P.selectZone(b.getAttribute('data-id')); }); });
  };
  P.renderScoreBars = function () {
    var S = P.state.S;
    var rows = [
      ['Electricity · 40%', Math.round(S.se), ''],
      ['Water · 35%', Math.round(S.sw), 'water'],
      ['Waste diversion · 25%', Math.round(S.ss), 'waste']
    ];
    $('#score-bars').innerHTML = rows.map(function (r) {
      return '<div class="bar"><label>' + r[0] + '<span>' + r[1] + '/100</span></label><div class="track"><i class="' + r[2] + '" style="width:' + r[1] + '%"></i></div></div>';
    }).join('') + '<p class="lede" style="margin-top:12px">Combined eco-score <strong>' + Math.round(S.overall) + '</strong>. Diversion today is ' + Math.round(S.div * 100) + '%.</p>';
  };
  function fact(label, value) {
    return '<div><span>' + label + '</span><strong>' + value + '</strong></div>';
  }
  P.renderInspector = function () {
    var z = P.state.sel === 'all' ? null : P.ZONES.find(function (q) { return q.id === P.state.sel; });
    var H = Math.floor(P.state.now);
    if (!z) {
      var people = P.ZONES.reduce(function (a, x) { return a + x.people; }, 0);
      var meters = P.ZONES.reduce(function (a, x) { return a + x.meters; }, 0);
      $('#insp-title').textContent = 'Whole campus';
      $('#insp-lede').textContent = 'Six buildings, one picture. Click a block on the map to open its story.';
      $('#insp-facts').innerHTML =
        fact('People on a busy day', fmt(people)) +
        fact('Sub-meters in the model', String(meters)) +
        fact('Clock', P.clock(H)) +
        fact('Open alerts', String(P.state.alerts.length));
      return;
    }
    $('#insp-title').textContent = z.name;
    $('#insp-lede').textContent = z.story;
    $('#insp-facts').innerHTML =
      fact('Typical occupancy', fmt(z.people)) +
      fact('Daily electricity', fmt(z.kwh) + ' kWh') +
      fact('Daily water', fmt(z.l / 1000) + ' kL') +
      fact('Peak hours', z.peaks) +
      fact('Watch for', z.watch) +
      fact('Meters', String(z.meters));
  };
  P.renderAtlas = function () {
    $('#atlas-grid').innerHTML = P.ZONES.map(function (z) {
      return '<button class="card" type="button" data-id="' + z.id + '" aria-pressed="' + (P.state.sel === z.id) + '">' +
        '<div class="kind">' + P.KIND_LABEL[z.kind] + '</div><h3>' + z.name + '</h3><p>' + z.story + '</p>' +
        '<ul>' + z.tips.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul></button>';
    }).join('');
    $$('#atlas-grid .card').forEach(function (b) {
      b.addEventListener('click', function () { P.selectZone(b.getAttribute('data-id')); document.getElementById('campus').scrollIntoView({ behavior: 'smooth' }); });
    });
  };
  P.renderTimeline = function () {
    $('#timeline').innerHTML = P.TIMELINE.map(function (row) {
      return '<li><time>' + row.h + '</time><p>' + row.t + '</p></li>';
    }).join('');
  };
})(window.Prakriti);
