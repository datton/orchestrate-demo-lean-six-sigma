/* Home page (Full-Stack): services from the catalog, sigma estimate, belt finder, next free slots. */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }

  // Services from shop/catalog.json (prices only from there)
  function items(c) {
    var list = c.items || c.products || c.services || [];
    if (!Array.isArray(list) && c.categories) list = [].concat.apply([], c.categories.map(function (k) { return k.items || []; }));
    return list;
  }
  function priceOf(it) { return it.price_cents != null ? it.price_cents : it.price != null ? it.price : it.priceCents; }
  function renderServices() {
    var box = $('service-cards'); if (!box || !window.Shop || !Shop.catalog) return;
    Shop.catalog().then(function (c) {
      var list = items(c).filter(function (i) { return !i.hidden && i.active !== false && !i.guide; }).slice(0, 6);
      if (!list.length) list = items(c).slice(0, 6);
      if (!list.length) return;
      box.innerHTML = list.map(function (i) {
        var p = priceOf(i), t = i.name || i.title || i.id;
        var m = p != null && Shop.money ? Shop.money(p) : '';
        return '<li class="card" data-reveal><h3>' + esc(t) + '</h3><p>' + esc(i.desc || i.description || '') + '</p>' +
          (m ? '<div class="price">' + esc(m) + '</div>' : '') +
          '<a href="pages/services.html#' + encodeURIComponent(i.id || '') + '">Details and options</a></li>';
      }).join('');
      box.querySelectorAll('[data-reveal]').forEach(function (e) { e.classList.add('is-in'); });
    }).catch(function () {
      box.innerHTML = '<li class="card"><h3>Our services</h3><p>See every course, coaching option and price on the services page.</p><a href="pages/services.html">Open services</a></li>';
    });
  }

  // Sigma estimate: DPMO -> sigma with the usual 1.5 shift
  function normCdf(z) { // Abramowitz-Stegun 7.1.26 via erf
    var t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z / 2);
    return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
  }
  function sigmaFor(dpmo) {
    var yieldP = 1 - dpmo / 1e6, lo = -8, hi = 8, m;
    for (var k = 0; k < 60; k++) { m = (lo + hi) / 2; if (normCdf(m) < yieldP) lo = m; else hi = m; }
    return m + 1.5;
  }
  var sf = $('sigma');
  function sigma() {
    var u = +sf.units.value, d = +sf.defects.value, o = +sf.opps.value, out = $('sig-out'), tx = $('sig-text');
    if (!(u >= 1) || !(o >= 1) || !(d >= 0) || sf.units.value === '' || sf.defects.value === '' || sf.opps.value === '') { out.textContent = '–'; tx.textContent = 'Enter whole numbers: at least 1 unit and 1 chance, and 0 or more defects.'; return; }
    var dpmo = d / (u * o) * 1e6;
    if (dpmo > 1e6) { out.textContent = '–'; tx.textContent = 'More defects than chances: check the numbers.'; return; }
    var s = dpmo === 0 ? null : sigmaFor(dpmo);
    out.textContent = s == null ? '6+' : Math.max(s, 0).toFixed(1);
    tx.textContent = Math.round(dpmo).toLocaleString('en') + ' defects per million chances' + (s == null ? '. No defects found: collect more units for a firm estimate.' : '.');
  }
  if (sf) { sf.addEventListener('input', sigma); sf.addEventListener('submit', function (e) { e.preventDefault(); sigma(); }); sigma(); }

  // Belt finder
  var finder = $('finder');
  if (finder) finder.addEventListener('submit', function (e) {
    e.preventDefault();
    var g = finder.goal.value, s = finder.stats.value, msg, link = 'pages/services.html#training';
    if (g === 'aware') msg = 'A Yellow Belt course fits: the vocabulary, the five DMAIC phases and how to take part in a project.';
    else if (g === 'lead') msg = s === 'none' ? 'Start with Yellow Belt to learn the basics, then move to Green Belt, where you lead your own project.' : 'A Green Belt course fits: you lead a small improvement project with data and simple statistics.';
    else msg = s === 'none' ? 'Black Belt builds on Green Belt. Start with Green Belt, then add a coached project on the way up.' : 'A Black Belt course fits: complex projects, deeper statistics and coaching others. Coaching alongside your first project helps.';
    $('finder-out').innerHTML = esc(msg) + ' <a href="' + link + '">See training</a>';
  });

  // Next free slots: same sample pattern and saved bookings as the booking page (js/tools.js)
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function slots() {
    var ul = $('slots'); if (!ul) return;
    var saved = [];
    try { saved = JSON.parse(localStorage.getItem('shop:lean-six-sigma:bookings') || '[]'); if (!Array.isArray(saved)) saved = []; } catch (e) { saved = []; }
    function taken(k, min) {
      if (hash('lss' + k + min) % 100 < 38) return true;
      return saved.some(function (b) { return b.date === k && min < b.start + b.len && min + 30 > b.start; });
    }
    var d = new Date(), out = [], n = 0;
    d.setHours(0, 0, 0, 0);
    while (out.length < 3 && n++ < 40) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      var k = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()), m;
      for (m = 9 * 60; m < 17 * 60; m += 30) if (!taken(k, m)) break;
      if (m >= 17 * 60) continue;
      out.push('<li><a href="pages/book.html">' + esc(d.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' }) + ', ' + pad(Math.floor(m / 60)) + ':' + pad(m % 60)) + '</a></li>');
    }
    ul.innerHTML = out.join('');
    var mb = $('mybook');
    if (mb) mb.textContent = (saved.length ? 'You have ' + saved.length + ' booking' + (saved.length > 1 ? 's' : '') + ' saved in this browser. ' : '') + 'Sample availability for the demo; bookings stay in this browser and nothing is sent.';
  }

  function init() { renderServices(); slots(); }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
