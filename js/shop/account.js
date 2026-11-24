/* My purchases (Senior Developer 4, Lean Six Sigma): pages/account.html. Demo-Sperre im Browser, kein echter Schutz. */
(function () {
  'use strict';
  var root = document.getElementById('account-root');
  var esc = Shop.esc, cat = null;
  function itemOf(id) { return ((cat && cat.items) || []).filter(function (i) { return i.id === id; })[0] || {}; }
  function guideLink(it) {
    var l = it.guide || it.unlock || it.link || '';
    if (!l && /^(guides?|leitf|anleitung|walkthrough)/i.test(String(it.category || ''))) l = 'pages/guides/' + it.id + '.html';
    return l;
  }
  function paid(o) { return o.status && o.status !== 'pending' && o.status !== 'cancelled' && o.status !== 'refunded'; }
  function day(iso) { try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (e) { return ''; } }

  function render(orders) {
    var good = orders.filter(paid);
    if (!good.length) {
      root.innerHTML = '<div class="ord__card ord__empty"><h2>Nothing here yet</h2><p class="ord__muted" style="margin-inline:auto">What you pay for in this browser appears here, with every unlocked guide and walkthrough.</p>' +
        '<div class="ord__actions" style="justify-content:center"><a class="ord__btn" href="services.html">Browse services</a></div></div>';
      return;
    }
    var seen = {}, order = [];
    good.forEach(function (o) { (o.lines || []).forEach(function (l) {
      var link = guideLink(itemOf(l.item));
      if (link && !seen[l.item]) { seen[l.item] = { name: l.name, link: link }; order.push(l.item); }
    }); });
    var h = '<section class="ord__card" aria-labelledby="acc-g"><h2 id="acc-g">Unlocked guides and walkthroughs</h2>';
    h += order.length ? '<ul class="ord__list">' + order.map(function (id) {
      var u = seen[id];
      return '<li><span><span class="ord__badge">Unlocked</span> ' + esc(u.name) + '</span><a class="ord__btn" href="' + esc(Shop.url(u.link)) + '">Open</a></li>';
    }).join('') + '</ul>' : '<p class="ord__muted">So far you have bought services, not guides. Bought guides unlock here.</p><div class="ord__actions"><a class="ord__btn ord__btn--ghost" href="services.html">Browse guides</a></div>';
    h += '</section><section class="ord__card" aria-labelledby="acc-o"><h2 id="acc-o">Your orders</h2><ul class="ord__list">' + good.map(function (o) {
      return '<li><span><strong>Order ' + esc(o.number) + '</strong> · ' + esc(day(o.placedAt)) + '<br><span class="ord__muted">' +
        (o.lines || []).map(function (l) { return esc(l.qty + ' × ' + l.name); }).join(', ') + '</span></span>' +
        '<span>' + Shop.money(o.total, o.currency) + ' · <a href="order.html?o=' + encodeURIComponent(o.token) + '">View order</a></span></li>';
    }).join('') + '</ul></section>';
    root.innerHTML = h;
  }
  function fail(msg) {
    root.innerHTML = '<div class="ord__error" role="alert">' + esc(msg || 'We could not load your purchases.') + '</div><div class="ord__actions acc-retry"><button class="ord__btn" type="button" id="acc-retry">Try again</button></div>';
    document.getElementById('acc-retry').addEventListener('click', function () { root.innerHTML = '<p class="ord__muted">Loading your purchases …</p>'; load(); });
  }
  var tokens = Shop.orders();
  function load() {
  return Shop.catalog().then(function (c) { cat = c; }, function () {}).then(function () {
    if (!tokens.length) return render([]);
    return Shop.api('orders/lookup', { tokens: tokens.slice(0, 30) }).then(function (r) { render(r.orders || []); },
      function (e) { fail(e.message); });
  });
  }
  load();
})();
