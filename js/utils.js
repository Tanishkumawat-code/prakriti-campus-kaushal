window.Prakriti = window.Prakriti || {};
(function (P) {
  'use strict';
  P.$ = function (s, c) { return (c || document).querySelector(s); };
  P.$$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  P.clamp = function (v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 100 : b; return Math.min(b, Math.max(a, v)); };
  P.lerp = function (a, b, t) { return a + (b - a) * t; };
  var nf = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  P.fmt = function (n) { return nf.format(Math.round(n)); };
  P.lakh = function (n) {
    return n >= 1e7 ? (n / 1e7).toFixed(2) + ' crore' : n >= 1e5 ? (n / 1e5).toFixed(1) + ' lakh' : P.fmt(n);
  };
  P.rupee = function (n) { return '₹' + P.lakh(n); };
  function hex2rgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
  P.mix = function (a, b, t) {
    var A = hex2rgb(a), B = hex2rgb(b);
    return '#' + A.map(function (v, i) { return Math.round(P.lerp(v, B[i], t)).toString(16).padStart(2, '0'); }).join('');
  };
  P.clock = function (h) {
    var hh = ((Math.floor(h) % 24) + 24) % 24;
    return ((hh % 12) || 12) + ':00 ' + (hh < 12 ? 'AM' : 'PM');
  };
  P.NS = 'http://www.w3.org/2000/svg';
  P.el = function (tag, attrs, parent) {
    var e = document.createElementNS(P.NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  P.mulberry32 = function (a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  P.gauss = function (r) {
    var u = 0, v = 0;
    while (!u) u = r();
    while (!v) v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
})(window.Prakriti);
