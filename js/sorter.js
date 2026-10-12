window.Prakriti = window.Prakriti || {};
(function (P) {
  'use strict';
  var $ = P.$;
  var BINS = {
    wet: { name: 'Green bin', sub: 'Wet and biodegradable', color: '#3E9B63', tip: 'Send it to the compost pit. Keep plastic bags out of this bin.' },
    dry: { name: 'Blue bin', sub: 'Dry and recyclable', color: '#2F6FB0', tip: 'Keep it clean and dry so it can be recycled. Crush bottles and flatten boxes.' },
    haz: { name: 'Black bin', sub: 'Hazardous and sanitary', color: '#2B2F33', tip: 'Wrap it before disposal and never mix it with wet or dry waste.' },
    ewaste: { name: 'E-waste drop point', sub: 'Electronics and batteries', color: '#B9780F', tip: 'Hand it in at the e-waste collection point. Batteries can ignite inside compactors.' }
  };
  var KW = {
    wet: ['banana peel', 'peel', 'banana', 'fruit', 'vegetable', 'veggie', 'food', 'rice', 'roti', 'chapati', 'bread', 'dal', 'curry', 'sabzi', 'leftover', 'tea leaf', 'tea bag', 'coffee ground', 'egg shell', 'eggshell', 'flower', 'leaf', 'garden waste', 'apple core', 'mango', 'onion', 'potato', 'cooked', 'kitchen waste', 'coconut shell', 'sugarcane', 'idli', 'dosa leftover'],
    dry: ['plastic bottle', 'plastic', 'bottle', 'wrapper', 'chips packet', 'packet', 'carton', 'cardboard', 'paper', 'notebook', 'newspaper', 'magazine', 'book', 'can', 'tin', 'glass', 'jar', 'cup', 'box', 'bag', 'straw', 'foil', 'pen', 'folder', 'envelope', 'paper cup', 'juice box', 'tetra pack', 'thermocol', 'cloth', 'pizza box'],
    haz: ['mask', 'used mask', 'sanitary pad', 'sanitary', 'diaper', 'syringe', 'medicine', 'tablet', 'expired', 'blade', 'razor', 'paint', 'chemical', 'thermometer', 'bandage', 'cotton', 'tissue', 'tissue paper', 'napkin', 'cigarette', 'nail polish', 'spray', 'insecticide', 'pesticide'],
    ewaste: ['battery', 'charger', 'cable', 'wire', 'earphone', 'headphone', 'phone', 'mobile', 'mouse', 'keyboard', 'bulb', 'led', 'tube light', 'cfl', 'laptop', 'pendrive', 'usb', 'calculator', 'power bank', 'circuit', 'remote', 'speaker', 'adapter', 'router', 'hard disk']
  };
  function lev(a, b) {
    var m = [], i, j;
    for (i = 0; i <= a.length; i++) m[i] = [i];
    for (j = 0; j <= b.length; j++) m[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return m[a.length][b.length];
  }
  function norm(s) {
    return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').map(function (t) {
      if (t.length > 4 && t.slice(-3) === 'ies') return t.slice(0, -3) + 'y';
      return (t.length > 3 && t.slice(-1) === 's' && t.slice(-2) !== 'ss') ? t.slice(0, -1) : t;
    }).join(' ');
  }
  P.classify = function (txt) {
    var s = norm(txt); if (!s) return null;
    var padded = ' ' + s + ' ', best = null;
    for (var c in KW) KW[c].forEach(function (k) {
      if (padded.indexOf(' ' + k + ' ') > -1 && (!best || k.length > best.k.length)) best = { cat: c, k: k, conf: 'high' };
    });
    if (best) return best;
    var toks = s.split(' ');
    for (var c2 in KW) KW[c2].forEach(function (k) {
      if (k.indexOf(' ') > -1 || k.length < 4) return;
      toks.forEach(function (t) {
        if (t.length >= 4 && lev(t, k) <= 1 && (!best || k.length > best.k.length)) best = { cat: c2, k: k, conf: 'fuzzy' };
      });
    });
    return best || { cat: 'unknown' };
  };
  var lastSort = null;
  P.doSort = function (txt) {
    var res = P.classify(txt), box = $('#res-text'), bin = $('#binsvg');
    if (!res) { box.innerHTML = '<h3>Type an item first</h3><p class="tip">For example, a banana peel or an old charger.</p>'; return; }
    if (res.cat === 'unknown') {
      lastSort = null; bin.classList.remove('open');
      ['#bin-body', '#bin-lidr', '#bin-handle'].forEach(function (q) { $(q).style.fill = '#9aa8a2'; });
      box.innerHTML = '<h3>Not sure about that one</h3><p class="tip">The model has no match for it. If you are unsure, keep it out of the green bin and ask the facilities desk. Try a simpler name such as bottle, peel or battery.</p>';
      return;
    }
    var b = BINS[res.cat]; lastSort = res.cat;
    ['#bin-body', '#bin-lidr', '#bin-handle'].forEach(function (q) { $(q).style.fill = b.color; });
    bin.classList.remove('open'); void bin.getBoundingClientRect(); bin.classList.add('open');
    box.innerHTML = '<h3>' + b.name + '</h3><div class="sub">' + b.sub + '</div><p class="tip">' + b.tip + '</p><p class="conf">Matched on "' + res.k + '"' + (res.conf === 'fuzzy' ? ', allowing for a typo' : '') + '.</p><div class="btnrow"><button class="ghost" type="button" id="logit">Add to today\'s tally</button></div>';
    $('#logit').addEventListener('click', function () { P.state.items[lastSort]++; this.disabled = true; this.textContent = 'Added'; P.renderAll(); });
  };
  P.renderTally = function () {
    var t = '';
    ['wet', 'dry', 'haz', 'ewaste'].forEach(function (k) {
      t += '<span><i style="background:' + BINS[k].color + '"></i><b>' + P.state.items[k] + '</b> ' + BINS[k].name.toLowerCase() + '</span>';
    });
    $('#tally').innerHTML = t + '<span>Each sorted item nudges the campus diversion rate up by 0.2% in this simulation.</span>';
  };
  P.initSorter = function () {
    ['banana peel', 'plastic bottle', 'old charger', 'used mask', 'notebook', 'tea cup', 'pizza box', 'batery'].forEach(function (x) {
      var b = document.createElement('button');
      b.className = 'ghost'; b.type = 'button'; b.textContent = x;
      b.addEventListener('click', function () { $('#item').value = x; P.doSort(x); });
      $('#chips').appendChild(b);
    });
    $('#sortbtn').addEventListener('click', function () { P.doSort($('#item').value); });
    $('#item').addEventListener('keydown', function (e) { if (e.key === 'Enter') P.doSort(this.value); });
  };
})(window.Prakriti);
