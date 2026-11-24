/* DMAIC stepper (Senior Dev 5). Without JavaScript all five phases are shown as a list. */
(function () {
  var root = document.getElementById('dm-stepper');
  if (!root) return;
  var tabs = [].slice.call(root.querySelectorAll('[role="tab"]'));
  var panels = [].slice.call(root.querySelectorAll('[role="tabpanel"]'));
  var prev = document.getElementById('dm-prev'), next = document.getElementById('dm-next');
  var cur = 0;
  root.classList.add('is-js');
  function show(i, focus) {
    cur = Math.max(0, Math.min(tabs.length - 1, i));
    tabs.forEach(function (t, k) {
      var on = k === cur;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      panels[k].hidden = !on;
    });
    prev.disabled = cur === 0;
    next.disabled = cur === tabs.length - 1;
    if (focus) tabs[cur].focus();
  }
  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () { show(k); });
    t.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (d) { e.preventDefault(); show((cur + d + tabs.length) % tabs.length, true); }
      else if (e.key === 'Home') { e.preventDefault(); show(0, true); }
      else if (e.key === 'End') { e.preventDefault(); show(tabs.length - 1, true); }
    });
  });
  prev.addEventListener('click', function () { show(cur - 1); });
  next.addEventListener('click', function () { show(cur + 1); });
  show(0);
})();
