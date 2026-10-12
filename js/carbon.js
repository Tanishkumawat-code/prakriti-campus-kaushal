window.Prakriti = window.Prakriti || {};
(function (P) {
  'use strict';
  var $ = P.$, $$ = P.$$, fmt = P.fmt, rupee = P.rupee;

  // Assumptions (all editable here). Credits are INTERNAL and simulated.
  P.CARBON = {
    BUFFER: 0.10,        // share withheld as a safety margin, like real registries do
    PRICE_MIN: 300, PRICE_MAX: 3000, PRICE_DEFAULT: 800, // Rs per tonne CO2e, an assumption, not a market quote
    PRICE_STEP: 100
  };

  var dailyTotals = function () {
    var dE = 0, dS = 0;
    P.ZONES.forEach(function (z) { dE += z.kwh; dS += z.kg; });
    return { e: dE, s: dS };
  };

  // Campus footprint over a year at today's baseline (22% waste diversion, no reductions)
  P.carbonFootprint = function () {
    var d = dailyTotals();
    var elec = d.e * P.DAYS * P.EF / 1000;
    var waste = d.s * (1 - .22) * P.DAYS * P.EF_WASTE / 1000;
    return { elec: elec, waste: waste, total: elec + waste };
  };

  // Annual avoided emissions for a given set of reductions
  function avoided(eRed, divShare, itemsLogged) {
    var d = dailyTotals();
    var elec = d.e * eRed * P.DAYS * P.EF / 1000;
    var extraDiv = Math.max(0, Math.min(.9, divShare + itemsLogged * .002) - .22);
    var waste = d.s * extraDiv * P.DAYS * P.EF_WASTE / 1000;
    return { elec: elec, waste: waste, total: elec + waste };
  }

  // Issued: only what has been applied to the campus. Pipeline: what the sliders say.
  P.carbonCalc = function () {
    var st = P.state, cfg = P.CARBON;
    var issued = avoided(st.red.e || 0, st.divBase, P.itemsTotal());
    var ac = +$('#l-ac').value, idle = +$('#l-idle').value, div = +$('#l-div').value;
    var pipe = avoided(.35 * .06 * ac + .14 * idle / 100, div / 100, 0);
    var fault = (st.ledger.e || 0) * P.EF / 1000; // one-off, not annualised
    var gross = issued.total;
    var net = gross * (1 - cfg.BUFFER);
    var retired = st.carbon.retired.reduce(function (a, r) { return a + r.t; }, 0);
    return {
      issued: issued, pipeline: pipe, fault: fault, gross: gross,
      buffer: gross * cfg.BUFFER, net: net, retired: retired,
      available: Math.max(0, net - retired),
      potential: Math.max(0, pipe.total * (1 - cfg.BUFFER) - net)
    };
  };

  function serial(n) { return 'PRK-2026-' + String(n).padStart(4, '0'); }

  P.retireCredits = function (t) {
    var c = P.carbonCalc();
    t = Math.min(t, Math.floor(c.available * 10) / 10);
    if (t <= 0) return;
    var st = P.state.carbon;
    st.retired.push({ t: t, id: serial(st.retired.length + 1), at: P.clock(Math.floor(P.state.now)) });
    P.renderCarbon();
  };

  function readiness() {
    return [
      { ok: true, t: 'Metered, hour-by-hour data', d: 'Every building has sub-meters in the model.' },
      { ok: false, t: 'A baseline of 12 months', d: 'Prakriti learns from 14 days. A registry would want a full year.' },
      { ok: false, t: 'Independent verification', d: 'A third-party auditor must check the meters and the method.' },
      { ok: false, t: 'Registered methodology', d: 'Savings must follow an approved method, with additionality shown.' }
    ];
  }

  P.renderCarbon = function () {
    var box = $('#carbon-body'); if (!box) return;
    var st = P.state, cfg = P.CARBON, c = P.carbonCalc(), fp = P.carbonFootprint();
    var price = +$('#c-price').value;
    $('#o-price').textContent = '₹' + fmt(price) + ' per tonne';

    var net = c.net, covered = fp.total ? P.clamp(c.retired / fp.total * 100, 0, 100) : 0;
    var rows = [
      ['Electricity saved', c.issued.elec, 'moss'],
      ['Waste kept out of landfill', c.issued.waste, 'gold']
    ];
    var mx = Math.max(1, c.issued.elec, c.issued.waste);

    var html = '';
    html += '<div class="cc-top">' +
      '<div class="cc-big"><span>Credits issued each year</span><b>' + net.toFixed(1) + '</b><small>1 credit = 1 tonne CO2e avoided</small></div>' +
      '<div class="cc-big"><span>Available to retire</span><b>' + c.available.toFixed(1) + '</b><small>' + c.retired.toFixed(1) + ' already retired</small></div>' +
      '<div class="cc-big"><span>Worth at ₹' + fmt(price) + '</span><b>' + rupee(net * price) + '</b><small>assumed price, not a market quote</small></div>' +
      '</div>';

    if (!st.applied) {
      html += '<div class="empty">No credits yet. Credits come from savings that are actually applied. ' +
        (c.potential > 0 ? 'The habit levers are set to a plan worth about <strong>' + (c.pipeline.total * (1 - cfg.BUFFER)).toFixed(1) + ' credits</strong> a year. Press <em>Apply to the campus</em> above to earn them.' : 'Move the habit levers, then apply them.') +
        '</div>';
    } else {
      html += '<div class="cc-math"><h3>How the number is made</h3><ul class="cc-rows">' +
        rows.map(function (r) {
          return '<li><span>' + r[0] + '</span><div class="track"><i class="' + (r[2] === 'gold' ? 'waste' : '') + '" style="width:' + (r[1] / mx * 100) + '%"></i></div><b>' + r[1].toFixed(1) + ' t</b></li>';
        }).join('') +
        '<li class="sum"><span>Gross avoided</span><i></i><b>' + c.gross.toFixed(1) + ' t</b></li>' +
        '<li class="sum"><span>Safety buffer, ' + Math.round(cfg.BUFFER * 100) + '%</span><i></i><b>− ' + c.buffer.toFixed(1) + ' t</b></li>' +
        '<li class="sum strong"><span>Credits issued</span><i></i><b>' + net.toFixed(1) + '</b></li></ul>' +
        (c.potential > 0.05 ? '<p class="lede">Your sliders now promise about ' + c.potential.toFixed(1) + ' more credits. Press <em>Update the campus</em> to issue them.</p>' : '') +
        '</div>';
    }

    html += '<div class="cc-offset"><div class="cc-offhead"><h3>Retire credits against our footprint</h3>' +
      '<p class="lede">Campus footprint is about <strong>' + fmt(fp.total) + ' t CO2e</strong> a year. Retiring a credit means spending it, so it can never be counted twice.</p></div>' +
      '<div class="track cc-track" role="img" aria-label="Share of footprint covered by retired credits"><i style="width:' + covered + '%"></i></div>' +
      '<p class="cc-cov">' + covered.toFixed(1) + '% of the footprint covered by retired credits</p>' +
      '<div class="btnrow"><button class="solid" id="c-ret1" type="button"' + (c.available < 1 ? ' disabled' : '') + '>Retire 1 credit</button>' +
      '<button class="ghost" id="c-ret10" type="button"' + (c.available < 10 ? ' disabled' : '') + '>Retire 10</button>' +
      '<button class="ghost" id="c-retall" type="button"' + (c.available < 1 ? ' disabled' : '') + '>Retire all available</button></div>' +
      (st.carbon.retired.length ? '<ol class="cc-log">' + st.carbon.retired.slice().reverse().map(function (r) {
        return '<li><code>' + r.id + '</code><span>' + r.t.toFixed(1) + ' t retired at ' + r.at + '</span></li>';
      }).join('') + '</ol>' : '') + '</div>';

    if (c.fault > 0) html += '<p class="cc-note">Faults caught also avoided about ' + Math.round(c.fault * 1000) + ' kg CO2e so far. That is one-off, so it is not issued as credits.</p>';

    html += '<div class="cc-ready"><h3>Could these be sold for real?</h3><p class="lede">Not yet. These are internal, simulated credits. A real credit needs more than a good dashboard:</p><ul>' +
      readiness().map(function (r) { return '<li class="' + (r.ok ? 'ok' : 'no') + '"><b>' + (r.ok ? '✓' : '○') + ' ' + r.t + '</b><span>' + r.d + '</span></li>'; }).join('') +
      '</ul></div>';

    box.innerHTML = html;
    var b1 = $('#c-ret1'), b10 = $('#c-ret10'), ba = $('#c-retall');
    if (b1) b1.addEventListener('click', function () { P.retireCredits(1); });
    if (b10) b10.addEventListener('click', function () { P.retireCredits(10); });
    if (ba) ba.addEventListener('click', function () { P.retireCredits(c.available); });
  };

  P.initCarbon = function () {
    var p = $('#c-price');
    p.min = P.CARBON.PRICE_MIN; p.max = P.CARBON.PRICE_MAX; p.step = P.CARBON.PRICE_STEP; p.value = P.CARBON.PRICE_DEFAULT;
    p.addEventListener('input', P.renderCarbon);
    ['l-ac', 'l-idle', 'l-leak', 'l-div'].forEach(function (id) { $('#' + id).addEventListener('input', P.renderCarbon); });
  };
})(window.Prakriti);
