window.Prakriti = window.Prakriti || {};
(function (P) {
  'use strict';
  P.EF = 0.71; P.EF_WASTE = 0.5; P.PRICE_E = 8; P.PRICE_W = 0.02; P.TREE = 21; P.DAYS = 300; P.UNNOTICED_H = 12;
  P.RES = ['e', 'w', 's'];
  P.KEY = { e: 'kwh', w: 'l', s: 'kg' };
  P.UNIT = { e: 'kWh', w: 'L', s: 'kg' };
  P.NAME = { e: 'Electricity', w: 'Water', s: 'Waste' };
  var bump = function (h, c, w) { return Math.exp(-0.5 * Math.pow((h - c) / w, 2)); };
  P.P = {
    academic: { e: function (h) { return .12 + bump(h, 13, 3.6); }, w: function (h) { return .1 + bump(h, 12, 4); }, s: function (h) { return .05 + bump(h, 13, 4); } },
    library: { e: function (h) { return .15 + bump(h, 14, 5.5); }, w: function (h) { return .1 + bump(h, 13, 5); }, s: function (h) { return .05 + bump(h, 15, 5); } },
    canteen: { e: function (h) { return .12 + .7 * bump(h, 8, 1.3) + bump(h, 13, 1.4) + .8 * bump(h, 19.5, 1.6); }, w: function (h) { return .04 + .8 * bump(h, 8, 1.2) + bump(h, 13, 1.3) + .9 * bump(h, 19.5, 1.4); }, s: function (h) { return .03 + .7 * bump(h, 9, 1.4) + bump(h, 13.5, 1.4) + .8 * bump(h, 20, 1.6); } },
    hostel: { e: function (h) { return .28 + .7 * bump(h, 7, 1.5) + bump(h, 21, 2.8); }, w: function (h) { return .04 + bump(h, 7, 1.4) + .5 * bump(h, 13, 1.5) + .9 * bump(h, 21.5, 1.8); }, s: function (h) { return .05 + .6 * bump(h, 8, 2) + bump(h, 21, 2.5); } },
    sports: { e: function (h) { return .1 + .5 * bump(h, 7, 1.5) + bump(h, 18.5, 2); }, w: function (h) { return .05 + .6 * bump(h, 7, 1.5) + bump(h, 18, 2); }, s: function (h) { return .04 + .4 * bump(h, 8, 2) + bump(h, 19, 2.5); } }
  };
  P.ZONES = [
    { id: 'engg', name: 'Engineering block', kind: 'academic', kwh: 1800, l: 12000, kg: 40, x: 60, w: 170, h: 170, people: 920, meters: 14, story: 'Lecture halls, drawing studios and machine labs. Cooling and projectors dominate the bill from 10 AM to 5 PM.', peaks: '1–4 PM', watch: 'ACs left on after the last lab', tips: ['Last person out kills the split ACs', 'Projectors on a 10-minute idle timer'] },
    { id: 'lib', name: 'Central library', kind: 'library', kwh: 650, l: 3000, kg: 10, x: 250, w: 130, h: 125, people: 280, meters: 6, story: 'Long quiet hours and dense lighting. The building stays occupied later than classrooms, so lighting is the lever that matters.', peaks: '2–8 PM', watch: 'Lights in empty stacks after 9 PM', tips: ['Zone lighting by floor', 'Return-desk sensors at night'] },
    { id: 'can', name: 'Canteen', kind: 'canteen', kwh: 900, l: 40000, kg: 180, x: 400, w: 100, h: 88, people: 640, meters: 5, story: 'Kitchen steam, dishwash and leftover rice. Water and wet waste spike at breakfast, lunch and dinner — not in between.', peaks: '8 AM, 1 PM, 8 PM', watch: 'Food waste after dinner rush', tips: ['Weigh leftover trays', 'Fix the prep-sink tap first'] },
    { id: 'kshi', name: 'Kshipra hostel', kind: 'hostel', kwh: 1300, l: 60000, kg: 90, x: 745, w: 135, h: 155, people: 420, meters: 8, story: 'Morning showers and late-night study lamps. A single running tap overnight can outspend a whole floor of lights.', peaks: '7 AM and 9–11 PM', watch: 'Dripping taps and corridor fans', tips: ['Report drips in the floor WhatsApp', 'Five-minute showers'] },
    { id: 'nar', name: 'Narmada hostel', kind: 'hostel', kwh: 1400, l: 65000, kg: 95, x: 900, w: 130, h: 185, people: 460, meters: 8, story: 'Slightly larger than Kshipra, with the same morning-evening water curve. Geysers in winter are the hidden load.', peaks: '7 AM and 9–11 PM', watch: 'Geysers left on all day in winter', tips: ['Shared geyser slots', 'Dry waste bags outside rooms'] },
    { id: 'spo', name: 'Sports complex', kind: 'sports', kwh: 400, l: 8000, kg: 15, x: 1050, w: 120, h: 72, people: 180, meters: 4, story: 'Floodlights and changing-room showers. The building should sleep after 9 PM; lights after closing are almost always a miss.', peaks: '6–8 PM', watch: 'Courts lit after lock-up', tips: ['Timer on floodlights', 'Push-button showers'] }
  ];
  P.KIND_LABEL = { academic: 'Classrooms and labs', library: 'Reading rooms', canteen: 'Kitchen and dining', hostel: 'Residence', sports: 'Courts and gym' };
  P.TIMELINE = [
    { h: '6 AM', t: 'Hostels wake. Showers and geysers take the first water of the day.' },
    { h: '8 AM', t: 'Canteen breakfast rush. Steam, dishwash and wet waste begin their first peak.' },
    { h: '10 AM', t: 'Engineering labs and lecture halls fill. Cooling load climbs with occupancy.' },
    { h: '1 PM', t: 'Campus-wide lunch. Canteen water and waste hit the daily high.' },
    { h: '4 PM', t: 'Library occupancy peaks as classes end. Lighting stays dense until late evening.' },
    { h: '7 PM', t: 'Sports floodlights and hostel study lamps. The map starts to glow building by building.' },
    { h: '9 PM', t: 'Dinner leftovers and late showers. A forgotten tap now looks very different from a busy kitchen.' },
    { h: '11 PM', t: 'Campus should be quiet. Out-of-hours power is the easiest anomaly to catch.' }
  ];
  function weights(kind, r) {
    var f = P.P[kind][r], a = [], h;
    for (h = 0; h < 24; h++) a.push(f(h + .5));
    var s = a.reduce(function (x, y) { return x + y; }, 0);
    return a.map(function (v) { return v / s; });
  }
  var rng = P.mulberry32(48);
  P.mean = {}; P.sd = {}; P.today = {};
  P.ZONES.forEach(function (z) {
    P.mean[z.id] = {}; P.sd[z.id] = {}; P.today[z.id] = {};
    P.RES.forEach(function (r) {
      var w = weights(z.kind, r), daily = z[P.KEY[r]], days = [], d;
      for (d = 0; d < 14; d++) {
        var df = 1 + 0.04 * P.gauss(rng);
        days.push(w.map(function (wh) { return daily * wh * df * (1 + 0.07 * P.gauss(rng)); }));
      }
      P.mean[z.id][r] = w.map(function (_, h) { return days.reduce(function (a, x) { return a + x[h]; }, 0) / 14; });
      P.sd[z.id][r] = w.map(function (_, h) {
        var m = P.mean[z.id][r][h];
        var v = Math.sqrt(days.reduce(function (a, x) { return a + Math.pow(x[h] - m, 2); }, 0) / 13);
        return Math.max(v, 0.06 * m);
      });
      P.today[z.id][r] = w.map(function (wh) { return daily * wh * (1 + 0.07 * P.gauss(rng)); });
    });
  });
  P.state = {
    now: 18, sel: 'all', res: 'e', anoms: [], ledger: { n: 0, e: 0, w: 0, money: 0 },
    red: { e: 0, w: 0, s: 0 }, divBase: .22, applied: false,
    items: { wet: 0, dry: 0, haz: 0, ewaste: 0 }, carbon: { retired: [] }, pledges: {}, playing: false, timer: null, S: null, alerts: []
  };
  P.actual = function (zid, r, h, red) {
    red = red || P.state.red;
    var v = P.today[zid][r][h] * (1 - (red[r] || 0));
    for (var i = 0; i < P.state.anoms.length; i++) {
      var a = P.state.anoms[i];
      if (a.zone === zid && a.res === r && h >= a.start) v += a.extra;
    }
    return v;
  };
  P.itemsTotal = function () {
    var t = 0, k;
    for (k in P.state.items) t += P.state.items[k];
    return t;
  };
  P.scoreFor = function (red, divBase, items) {
    var H = Math.floor(P.state.now), out = {};
    ['e', 'w'].forEach(function (r) {
      var A = 0, M = 0;
      P.ZONES.forEach(function (z) {
        for (var h = 0; h < 24; h++) {
          var m = P.mean[z.id][r][h];
          M += m;
          A += h <= H ? P.actual(z.id, r, h, red) : m * (1 - (red[r] || 0));
        }
      });
      out['r' + r] = A / M;
    });
    var se = P.clamp((1.5 - out.re) / 0.8 * 100), sw = P.clamp((1.5 - out.rw) / 0.8 * 100);
    var div = Math.min(.9, divBase + items * .002), ss = P.clamp(div / .8 * 100);
    return { re: out.re, rw: out.rw, se: se, sw: sw, ss: ss, div: div, overall: .4 * se + .35 * sw + .25 * ss };
  };
  P.detect = function () {
    var out = [], H = Math.floor(P.state.now);
    P.ZONES.forEach(function (z) {
      ['e', 'w'].forEach(function (r) {
        var run = [];
        function flush() {
          if (run.length >= 2 && run[run.length - 1] >= H - 1) {
            var ex = 0, sa = 0, sm = 0;
            run.forEach(function (h) {
              var a = P.actual(z.id, r, h), m = P.mean[z.id][r][h];
              ex += a - m; sa += a; sm += m;
            });
            out.push({ zone: z.id, res: r, from: run[0], to: run[run.length - 1], excess: ex, ratio: sa / sm, perHour: ex / run.length });
          }
          run = [];
        }
        for (var h = 0; h <= H; h++) {
          var zs = (P.actual(z.id, r, h) - P.mean[z.id][r][h]) / P.sd[z.id][r][h];
          if (zs > 3.5) run.push(h); else flush();
        }
        flush();
      });
    });
    return out;
  };
})(window.Prakriti);
