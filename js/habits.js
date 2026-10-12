window.Prakriti = window.Prakriti || {};
(function (P) {
  'use strict';
  var $ = P.$, $$ = P.$$, fmt = P.fmt, lakh = P.lakh, rupee = P.rupee;
  function levers() {
    var ac = +$('#l-ac').value, idle = +$('#l-idle').value, leak = +$('#l-leak').value, div = +$('#l-div').value;
    return { ac: ac, idle: idle, leak: leak, div: div, eRed: .35 * .06 * ac + .14 * idle / 100, wRed: .18 * leak / 100 };
  }
  P.renderWhatIf = function () {
    var L = levers();
    $('#o-ac').textContent = '+' + L.ac + '°C';
    $('#o-idle').textContent = L.idle + '% of rooms';
    $('#o-leak').textContent = L.leak + '% of fixtures';
    $('#o-div').textContent = L.div + '%';
    var dE = 0, dW = 0, dS = 0;
    P.ZONES.forEach(function (z) { dE += z.kwh; dW += z.l; dS += z.kg; });
    var kwh = dE * L.eRed * P.DAYS, litres = dW * L.wRed * P.DAYS, extraKg = dS * (L.div / 100 - .22) * P.DAYS;
    var co2 = (kwh * P.EF + extraKg * P.EF_WASTE) / 1000, money = kwh * P.PRICE_E + litres * P.PRICE_W, trees = co2 * 1000 / P.TREE;
    var proj = P.scoreFor({ e: L.eRed, w: L.wRed, s: 0 }, L.div / 100, 0);
    $('#proj').innerHTML = '<dl><div><dt>Power saved each year</dt><dd>' + lakh(kwh) + ' kWh</dd></div><div><dt>Water saved each year</dt><dd>' + lakh(litres) + ' L</dd></div><div><dt>Carbon avoided each year</dt><dd>' + fmt(co2) + ' t CO2e</dd></div><div><dt>Money saved each year</dt><dd>' + rupee(money) + '</dd></div></dl><p>That cancels what about ' + fmt(trees) + ' trees absorb in a year. Eco-score would go from ' + Math.round(P.state.S.overall) + ' to about ' + Math.round(proj.overall) + '.</p>';
    $('#apply').textContent = P.state.applied ? 'Update the campus' : 'Apply to the campus';
    $('#undo').hidden = !P.state.applied;
  };
  P.applyLevers = function () {
    var L = levers();
    P.state.red = { e: L.eRed, w: L.wRed, s: 0 };
    P.state.divBase = L.div / 100;
    P.state.applied = true;
    P.renderAll();
  };
  P.undoLevers = function () {
    P.state.red = { e: 0, w: 0, s: 0 };
    P.state.divBase = .22;
    P.state.applied = false;
    P.renderAll();
  };
  var PLEDGES = [
    { id: 'p1', t: 'Switch off lights and fans when I leave a room', k: 'e', v: .5, u: 'kWh' },
    { id: 'p2', t: 'Keep showers under five minutes', k: 'w', v: 30, u: 'L' },
    { id: 'p3', t: 'Carry a bottle and a cup instead of single-use', k: 's', v: .12, u: 'kg' },
    { id: 'p4', t: 'Report a dripping tap or a running flush', k: 'w', v: 25, u: 'L' },
    { id: 'p5', t: 'Keep the AC at 24°C or above', k: 'e', v: 1.2, u: 'kWh' },
    { id: 'p6', t: 'Print on both sides, or not at all', k: 's', v: .05, u: 'kg' },
    { id: 'p7', t: 'Walk or cycle between hostels and class', k: 'e', v: .3, u: 'kWh' },
    { id: 'p8', t: 'Sort wet waste at the hostel floor bin', k: 's', v: .08, u: 'kg' }
  ];
  try {
    var sv = localStorage.getItem('prakriti-pledges');
    if (sv) P.state.pledges = JSON.parse(sv) || {};
  } catch (e) {}
  function renderMine() {
    var t = { e: 0, w: 0, s: 0 }, n = 0;
    PLEDGES.forEach(function (p) { if (P.state.pledges[p.id]) { t[p.k] += p.v * 90; n++; } });
    var co2 = t.e * P.EF + t.s * P.EF_WASTE;
    $('#mine').innerHTML = n
      ? 'Over a 90-day semester, <strong>' + n + (n === 1 ? ' pledge' : ' pledges') + '</strong> saves you about ' + (t.e ? fmt(t.e) + ' kWh' : '') + (t.e && (t.w || t.s) ? ', ' : '') + (t.w ? fmt(t.w) + ' L of water' : '') + (t.w && t.s ? ', ' : '') + (t.s ? t.s.toFixed(1) + ' kg of waste' : '') + '. That is roughly ' + fmt(co2) + ' kg of CO2e, or ' + (co2 / P.TREE).toFixed(1) + ' tree-years of absorption.'
      : 'Tick a pledge to see what your habits add up to over a semester.';
  }
  P.renderPledges = function () {
    $('#pledges').innerHTML = PLEDGES.map(function (p) {
      return '<label class="pledge"><input type="checkbox" data-id="' + p.id + '"' + (P.state.pledges[p.id] ? ' checked' : '') + '><span><b>' + p.t + '</b><small>Saves about ' + p.v + ' ' + p.u + ' a day</small></span></label>';
    }).join('');
    $$('#pledges input').forEach(function (i) {
      i.addEventListener('change', function () {
        P.state.pledges[i.getAttribute('data-id')] = i.checked;
        try { localStorage.setItem('prakriti-pledges', JSON.stringify(P.state.pledges)); } catch (e) {}
        renderMine();
      });
    });
    renderMine();
  };
})(window.Prakriti);
