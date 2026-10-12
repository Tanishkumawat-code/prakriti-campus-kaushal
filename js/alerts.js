window.Prakriti = window.Prakriti || {};
(function (P) {
  'use strict';
  var $ = P.$, $$ = P.$$, fmt = P.fmt, rupee = P.rupee;
  P.renderAlerts = function () {
    var box = $('#alerts');
    if (!P.state.alerts.length) {
      box.innerHTML = '<div class="empty">Nothing unusual right now. Use the buttons under the picture to create a problem and watch it get caught.</div>';
    } else box.innerHTML = P.state.alerts.map(function (a, i) {
      var z = P.ZONES.find(function (q) { return q.id === a.zone; }), w = a.res === 'w';
      var cost = w ? a.excess * P.PRICE_W : a.excess * P.PRICE_E, co2 = w ? 0 : a.excess * P.EF;
      var ratio = a.ratio >= 10 ? fmt(a.ratio) : a.ratio.toFixed(1);
      var title = a.kind || (w ? 'Probable leak or running tap' : 'Power left on out of hours');
      return '<div class="alert"><h3>' + title + '</h3><p>' + z.name + ' has used ' + fmt(a.excess) + ' ' + P.UNIT[a.res] + ' more than usual since ' + P.clock(a.from) + ', about ' + ratio + ' times its normal ' + (w ? 'flow' : 'load') + ' for those hours.</p><p class="meta">So far that is ' + rupee(cost) + (co2 ? ' and ' + fmt(co2) + ' kg of CO2e' : '') + '. Flagged because it sits more than 3.5 standard deviations above this building\'s 14-day pattern for two hours running.</p><button class="solid" type="button" data-i="' + i + '">Mark as fixed</button></div>';
    }).join('');
    $$('#alerts button').forEach(function (b) { b.addEventListener('click', function () { P.fixAlert(+b.getAttribute('data-i')); }); });
    var L = P.state.ledger, lg = $('#ledger');
    if (L.n) {
      lg.hidden = false;
      lg.textContent = 'Caught ' + L.n + (L.n === 1 ? ' problem' : ' problems') + ', avoiding about ' + (L.e ? fmt(L.e) + ' kWh of power' : '') + (L.e && L.w ? ' and ' : '') + (L.w ? fmt(L.w) + ' L of water' : '') + ', worth ' + rupee(L.money) + '. That assumes a fault would run ' + P.UNNOTICED_H + ' hours before anyone noticed.';
    } else lg.hidden = true;
  };
  P.fixAlert = function (i) {
    var a = P.state.alerts[i]; if (!a) return;
    var avoided = a.perHour * P.UNNOTICED_H;
    P.state.ledger.n++;
    if (a.res === 'e') { P.state.ledger.e += avoided; P.state.ledger.money += avoided * P.PRICE_E; }
    else { P.state.ledger.w += avoided; P.state.ledger.money += avoided * P.PRICE_W; }
    P.state.anoms = P.state.anoms.filter(function (x) { return !(x.zone === a.zone && x.res === a.res); });
    P.renderAll();
  };
})(window.Prakriti);
