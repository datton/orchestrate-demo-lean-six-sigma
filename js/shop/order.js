/* Order confirmation (Senior Developer 4, Lean Six Sigma): pages/order.html?o=<token> */
(function () {
  'use strict';
  var root = document.getElementById('order-root');
  var token = Shop.param('o');
  var cat = null, timer = null, last = null, cleared = false, tries = 0;
  var esc = Shop.esc;

  function listOf(v) { return v == null ? [] : (Array.isArray(v) ? v : [v]); }
  function itemOf(id) { return ((cat && cat.items) || []).filter(function (i) { return i.id === id; })[0] || {}; }
  function guideLink(it) {
    var l = it.guide || it.unlock || it.link || '';
    if (!l && /^(guides?|leitf|anleitung|walkthrough)/i.test(String(it.category || ''))) l = 'pages/guides/' + it.id + '.html';
    return l;
  }
  function when(iso) {
    try { return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso || ''; }
  }
  var STEP = { paid: 'Payment received', making: 'Being prepared', ready: 'Ready', collected: 'Delivered' };
  function paid(o) { return o && o.status && o.status !== 'pending' && o.status !== 'cancelled' && o.status !== 'refunded'; }
  function brand() { return (cat && cat.brand && cat.brand.name) || 'Lean Six Sigma'; }

  function receipt(o) {
    var t = ['RECEIPT (Demo: test payment only, no real money moved)', '', brand() + ' (fictional company)',
      'Order number: ' + o.number, 'Date: ' + when(o.placedAt), 'Name: ' + (o.name || ''), ''];
    (o.lines || []).forEach(function (l) { t.push(l.qty + ' x ' + l.name + (l.summary ? ' (' + l.summary + ')' : '') + '  ' + Shop.money(l.total, o.currency)); });
    t.push('', 'Subtotal: ' + Shop.money(o.subtotal, o.currency));
    if (o.discount) t.push('Discount ' + o.discount.code + ': -' + Shop.money(o.discount.amount, o.currency));
    if (o.giftCard) t.push('Gift card: -' + Shop.money(o.giftCard.applied, o.currency));
    t.push('Paid: ' + Shop.money(o.total, o.currency));
    if (o.payment && o.payment.card) t.push('Payment: ' + o.payment.card + ' (test card)');
    t.push('', 'This is a demo. No real money moved.');
    return t.join('\n');
  }

  function render(o) {
    last = o;
    var ok = paid(o), h = '<p class="ord__eyebrow">Confirmation <span class="ord__badge">Demo</span></p>';
    if (ok && !cleared) { cleared = true; Shop.saveCart([]); }
    if (o.status === 'cancelled' || o.status === 'refunded') {
      h += '<h1 class="ord__title">Order ' + (o.status === 'refunded' ? 'refunded' : 'cancelled') + '</h1><p class="ord__muted">Nothing is outstanding. You can order again any time.</p>' +
        '<div class="ord__actions"><a class="ord__btn" href="services.html">Browse services</a></div>';
    } else if (!ok) {
      h += '<h1 class="ord__title">Waiting for your payment …</h1><p class="ord__muted"><span class="ord__spin" aria-hidden="true"></span>This page updates by itself.</p>';
    } else {
      h += '<h1 class="ord__title">Thank you' + (o.firstName ? ', ' + esc(o.firstName) : '') + '! Your payment has arrived.</h1>' +
        '<div class="ord__number"><small>Order number</small><strong>' + esc(o.number) + '</strong></div><br>';
    }
    h += '<span class="ord__test">' + esc((Shop.TEST_LABEL || 'Demo shop: test payments only. No real money moves.')) + '</span>';
    if (ok) {
      var steps = (o.steps || []).map(function (s) { return '<li class="' + (s.at ? 'is-done' : '') + '">' + esc(STEP[s.id] || s.label) + (s.at ? ' &#10003;' : '') + '</li>'; }).join('');
      h += '<section class="ord__card" aria-labelledby="ord-b"><h2 id="ord-b">What you bought</h2><ul class="ord__lines">' +
        (o.lines || []).map(function (l) { return '<li><span>' + esc(l.qty) + ' × ' + esc(l.name) + (l.summary ? '<small>' + esc(l.summary) + '</small>' : '') + '</span><span>' + Shop.money(l.total, o.currency) + '</span></li>'; }).join('') + '</ul>' +
        '<div class="ord__sub"><span>Subtotal</span><span>' + Shop.money(o.subtotal, o.currency) + '</span></div>' +
        (o.discount ? '<div class="ord__sub"><span>' + esc(o.discount.name || o.discount.code) + '</span><span>−' + Shop.money(o.discount.amount, o.currency) + '</span></div>' : '') +
        (o.giftCard ? '<div class="ord__sub"><span>Gift card</span><span>−' + Shop.money(o.giftCard.applied, o.currency) + '</span></div>' : '') +
        '<div class="ord__sum"><span>Paid</span><span>' + Shop.money(o.total, o.currency) + '</span></div>' +
        (o.payment && o.payment.card ? '<p class="ord__muted">Paid with ' + esc(o.payment.card) + ' (test card)</p>' : '') + '</section>';

      h += '<section class="ord__card" aria-labelledby="ord-n"><h2 id="ord-n">What happens next</h2>' + (steps ? '<ol class="ord__steps">' + steps + '</ol>' : '') +
        (o.lines || []).map(function (l) {
          var it = itemOf(l.item), link = guideLink(it), b = '<div class="ord__next"><h3>' + esc(l.name) + '</h3>';
          if (link) b += '<p>Unlocked. You can always find it under <a href="account.html">My purchases</a>, or open it right here: <a href="' + esc(Shop.url(link)) + '">open</a>.</p>';
          else b += '<p>This is a service from the fictional Lean Six Sigma team. This demo sends nothing; in real life the team would contact you and go through it with you. Just quote your order number ' + esc(o.number) + '.</p>';
          listOf(it.next || it.afterBuying || it.whatNext).forEach(function (n) { b += '<p>' + esc(n) + '</p>'; });
          var prep = listOf(it.prepare || it.bring);
          if (prep.length) b += '<p><strong>Have ready:</strong> ' + prep.map(esc).join(', ') + '.</p>';
          return b + '</div>';
        }).join('') + '</section>';
      h += '<div class="ord__actions"><button class="ord__btn" type="button" id="ord-r">Download receipt</button>' +
        '<a class="ord__btn ord__btn--ghost" href="account.html">My purchases</a><a class="ord__btn ord__btn--ghost" href="services.html">More services</a></div>';
    }
    root.innerHTML = h;
    var r = document.getElementById('ord-r');
    if (r) r.addEventListener('click', function () { Shop.download('receipt-' + o.number + '.txt', receipt(o)); });
  }

  function fail(msg) {
    root.innerHTML = '<p class="ord__eyebrow">Confirmation <span class="ord__badge">Demo</span></p><h1 class="ord__title">We cannot find this order</h1><div class="ord__error" role="alert">' + esc(msg) + '</div>' +
      '<span class="ord__test">' + esc((Shop.TEST_LABEL || 'Demo shop: test payments only. No real money moves.')) + '</span><div class="ord__actions"><button class="ord__btn" type="button" id="ord-retry">Try again</button><a class="ord__btn ord__btn--ghost" href="account.html">My purchases</a><a class="ord__btn ord__btn--ghost" href="services.html">Services</a></div>';
    var rt = document.getElementById('ord-retry');
    if (rt && !token) rt.remove();
    else if (rt) rt.addEventListener('click', function () { tries = 0; poll(); });
  }
  function poll() {
    tries++;
    Shop.api('orders/' + encodeURIComponent(token)).then(function (res) {
      var o = res.order || res;
      if (!last || JSON.stringify(last) !== JSON.stringify(o)) render(o);
      var done = o.status === 'collected' || o.status === 'cancelled' || o.status === 'refunded' || (paid(o) && (o.status === 'ready'));
      if (!done && tries < 40) timer = setTimeout(poll, 3000);
    }, function (e) { if (!last) fail(e.message); else timer = setTimeout(poll, 5000); });
  }
  if (!token) { fail('This link has no order number. Open your order under My purchases.'); return; }
  Shop.addOrder(token);
  Shop.catalog().then(function (c) { cat = c; }, function () {}).then(poll);
})();
