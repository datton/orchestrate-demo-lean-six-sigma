/* Booking calendar (senior7). Sample availability; bookings stay in this browser (Shop key 'bookings'). */
(function () {
  'use strict';
  var calEl = document.getElementById('bk-cal');
  if (!calEl) return;
  var slotsEl = document.getElementById('bk-slots'), form = document.getElementById('bk-form'),
      chosenEl = document.getElementById('bk-chosen'), doneEl = document.getElementById('bk-done'), mineEl = document.getElementById('bk-mine');
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var DOWS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  var DOWL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var TOPICS = { training: 'Training', coaching: 'Coaching', project: 'Improvement project' };
  var SLOT_MIN = []; for (var m = 9 * 60; m < 17 * 60; m += 30) SLOT_MIN.push(m);

  function store(key, fb) { try { if (window.Shop) return Shop.get(key, fb); var v = localStorage.getItem('shop:lean-six-sigma:' + key); return v === null ? fb : JSON.parse(v); } catch (e) { return fb; } }
  function save(key, v) { try { if (window.Shop) return Shop.set(key, v); localStorage.setItem('shop:lean-six-sigma:' + key, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function key(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function hm(min) { return pad(Math.floor(min / 60)) + ':' + pad(min % 60); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  var today = new Date(); today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  var lastDay = addDays(today, 120);
  function isWeekday(d) { var w = d.getDay(); return w !== 0 && w !== 6; }
  function ok(d) { return d >= today && d <= lastDay && isWeekday(d); }

  // Sample availability: a stable pseudo-random pattern per date and time, so it looks the same on every visit.
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); }
  function bookings() { return store('bookings', []); }
  function sampleBooked(k, min) { return hash('lss' + k + min) % 100 < 38; }
  function taken(k, min) {
    if (sampleBooked(k, min)) return true;
    return bookings().some(function (b) { return b.date === k && min < b.start + b.len && min + 30 > b.start; });
  }
  function freeCount(d) {
    var k = key(d), n = 0;
    SLOT_MIN.forEach(function (m) { if (!taken(k, m)) n++; });
    return n;
  }
  // A slot can host a session of `len` minutes if every half hour in it is free and it ends by 17:00.
  function fits(k, min, len) {
    if (min + len > 17 * 60) return false;
    for (var m = min; m < min + len; m += 30) if (taken(k, m)) return false;
    return true;
  }

  var view = new Date(today.getFullYear(), today.getMonth(), 1), focusDay = nextOk(today, 1, true), selDay = null, selMin = null;

  function nextOk(d, dir, inclusive) {
    var c = inclusive ? d : addDays(d, dir);
    for (var i = 0; i < 400; i++) { if (ok(c)) return c; if (c > lastDay && dir > 0) return null; if (c < today && dir < 0) return null; c = addDays(c, dir); }
    return null;
  }

  function renderCal(focusAfter) {
    var y = view.getFullYear(), mo = view.getMonth();
    var first = new Date(y, mo, 1), offset = (first.getDay() + 6) % 7, days = new Date(y, mo + 1, 0).getDate();
    var prevOk = new Date(y, mo, 0) >= today, nextOkM = new Date(y, mo + 1, 1) <= lastDay;
    var h = '<div class="bk-cal-head"><button type="button" class="bk-nav" id="bk-prev" aria-label="Previous month"' + (prevOk ? '' : ' disabled') + '>&larr;</button>' +
      '<h3 id="bk-month" aria-live="polite">' + MONTHS[mo] + ' ' + y + '</h3>' +
      '<button type="button" class="bk-nav" id="bk-next" aria-label="Next month"' + (nextOkM ? '' : ' disabled') + '>&rarr;</button></div>' +
      '<div class="bk-grid" role="group" aria-labelledby="bk-month">';
    DOWS.forEach(function (w) { h += '<div class="bk-dow" aria-hidden="true">' + w + '</div>'; });
    for (var i = 0; i < offset; i++) h += '<div></div>';
    for (var n = 1; n <= days; n++) {
      var d = new Date(y, mo, n), k = key(d), enabled = ok(d), free = enabled ? freeCount(d) : 0;
      var cls = 'bk-day' + (+d === +today ? ' is-today' : '') + (enabled && free ? ' is-free' : '');
      var label = DOWL[d.getDay()] + ' ' + n + ' ' + MONTHS[mo] + (+d === +today ? ', today' : '') + (!enabled ? ', not available' : (free ? ', ' + free + ' free half-hour slots' : ', fully booked'));
      h += '<button type="button" class="' + cls + '" data-d="' + k + '" aria-label="' + label + '" aria-pressed="' + (selDay && +selDay === +d ? 'true' : 'false') + '"' +
        (enabled ? '' : ' aria-disabled="true"') + ' tabindex="' + (focusDay && +focusDay === +d ? '0' : '-1') + '">' + n + '</button>';
    }
    h += '</div><p class="bk-legend"><span>Dot: free slots</span><span>Outlined: today</span><span>Weekdays only</span></p>';
    calEl.innerHTML = h;
    if (focusAfter) { var b = calEl.querySelector('[data-d="' + key(focusDay) + '"]'); if (b) b.focus(); }
  }

  function setView(d) { view = new Date(d.getFullYear(), d.getMonth(), 1); }
  function step(dir) {
    var n = nextOk(focusDay, dir, false);
    if (!n) return;
    focusDay = n; if (n.getMonth() !== view.getMonth() || n.getFullYear() !== view.getFullYear()) setView(n);
    renderCal(true);
  }
  function jump(days) {
    var t = addDays(focusDay, days), dir = days > 0 ? 1 : -1;
    var n = ok(t) ? t : nextOk(t, dir, true);
    if (!n) return; focusDay = n; setView(n); renderCal(true);
  }

  calEl.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.id === 'bk-prev' || b.id === 'bk-next') {
      view = new Date(view.getFullYear(), view.getMonth() + (b.id === 'bk-next' ? 1 : -1), 1);
      var f = nextOk(view < today ? today : view, 1, true); if (f && f.getMonth() === view.getMonth()) focusDay = f;
      renderCal(false); return;
    }
    if (b.dataset.d) {
      var d = parse(b.dataset.d); if (!ok(d)) return;
      focusDay = d; selDay = d; selMin = null; renderCal(true); renderSlots();
    }
  });
  calEl.addEventListener('keydown', function (e) {
    if (!e.target.dataset || !e.target.dataset.d) return;
    var map = { ArrowRight: function () { step(1); }, ArrowLeft: function () { step(-1); }, ArrowDown: function () { jump(7); }, ArrowUp: function () { jump(-7); },
      PageDown: function () { jump(28); }, PageUp: function () { jump(-28); } };
    if (map[e.key]) { e.preventDefault(); map[e.key](); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.target.click(); }
  });

  function len() { var r = form.querySelector('input[name=type]:checked'); return r ? +r.value : 30; }

  function renderSlots() {
    if (!selDay) { slotsEl.innerHTML = ''; form.hidden = true; return; }
    var k = key(selDay), L = len(), any = false;
    var h = '<h3>' + DOWL[selDay.getDay()] + ' ' + selDay.getDate() + ' ' + MONTHS[selDay.getMonth()] + '</h3><p class="bk-note">Sample availability. Times are your local time; showing starts for a ' + L + '-minute session.</p><div class="bk-slot-list" role="group" aria-label="Time slots">';
    SLOT_MIN.forEach(function (m) {
      var okSlot = fits(k, m, L); if (okSlot) any = true;
      h += '<button type="button" class="bk-slot" data-m="' + m + '"' + (okSlot ? '' : ' disabled') + ' aria-pressed="' + (selMin === m ? 'true' : 'false') + '" aria-label="' + hm(m) + (okSlot ? '' : ', booked') + '">' + hm(m) + '</button>';
    });
    h += '</div>' + (any ? '' : '<p class="bk-err">No free ' + L + '-minute slot on this day. Please try another day.</p>');
    slotsEl.innerHTML = h;
    updateChosen();
  }
  function updateChosen() {
    if (selDay && selMin != null) {
      form.hidden = false;
      chosenEl.textContent = DOWL[selDay.getDay()] + ' ' + selDay.getDate() + ' ' + MONTHS[selDay.getMonth()] + ', ' + hm(selMin) + ' to ' + hm(selMin + len());
    } else form.hidden = true;
  }
  slotsEl.addEventListener('click', function (e) {
    var b = e.target.closest('.bk-slot'); if (!b || b.disabled) return;
    selMin = +b.dataset.m; renderSlots();
    var f = form.querySelector('#bk-name'); if (f) f.focus();
  });
  form.addEventListener('change', function (e) {
    if (e.target.name === 'type') { if (selMin != null && !fits(key(selDay), selMin, len())) selMin = null; renderSlots(); }
  });

  function fail(id, msg) { var el = document.getElementById(id), er = document.getElementById(id + '-err'); el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', id + '-err'); er.textContent = msg; er.hidden = false; }
  function clear(id) { var el = document.getElementById(id), er = document.getElementById(id + '-err'); el.removeAttribute('aria-invalid'); er.hidden = true; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.name.value.trim(), email = form.email.value.trim(), bad = null;
    clear('bk-name'); clear('bk-email');
    if (!name) { fail('bk-name', 'Please tell us your name.'); bad = bad || 'bk-name'; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { fail('bk-email', 'Please enter an email address like name@company.com.'); bad = bad || 'bk-email'; }
    if (bad) { document.getElementById(bad).focus(); return; }
    if (!selDay || selMin == null || !fits(key(selDay), selMin, len())) { window.Shop && Shop.toast('Please pick a free slot first.', 'error'); return; }
    var b = { id: 'bk' + Date.now().toString(36), date: key(selDay), start: selMin, len: len(), name: name, email: email, topic: form.topic.value, note: form.note.value.trim() };
    var all = bookings(); all.push(b); save('bookings', all);
    var when = DOWL[selDay.getDay()] + ' ' + selDay.getDate() + ' ' + MONTHS[selDay.getMonth()] + ', ' + hm(b.start) + ' to ' + hm(b.start + b.len);
    doneEl.innerHTML = '<h3>You are booked in, ' + esc(name) + '.</h3><p>' + esc(when) + ' (' + b.len + ' minutes, ' + esc(TOPICS[b.topic]) + ').</p>' +
      '<p>This is a demo: nothing was sent and nobody will contact you. The booking is saved in this browser only, so clearing site data removes it.</p>' +
      '<div class="bk-actions"><button type="button" class="bk-btn" data-ics="' + b.id + '">Add to calendar (.ics)</button></div>';
    doneEl.hidden = false; form.hidden = true; form.reset(); selMin = null;
    renderSlots(); form.hidden = true; renderCal(false); renderMine(); doneEl.focus();
  });

  function ics(b) {
    var d = parse(b.date), st = b.start, en = b.start + b.len;
    function stamp(min) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(Math.floor(min / 60)) + pad(min % 60) + '00'; }
    function t(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
    var now = new Date(), dt = now.getUTCFullYear() + pad(now.getUTCMonth() + 1) + pad(now.getUTCDate()) + 'T' + pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + pad(now.getUTCSeconds()) + 'Z';
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Lean Six Sigma demo//Booking//EN', 'BEGIN:VEVENT', 'UID:' + b.id + '@lean-six-sigma.demo', 'DTSTAMP:' + dt,
      'DTSTART:' + stamp(st), 'DTEND:' + stamp(en), 'SUMMARY:' + t((b.len === 30 ? 'Discovery call' : 'Project session') + ' (demo booking)'),
      'DESCRIPTION:' + t('Topic: ' + TOPICS[b.topic] + (b.note ? '. Note: ' + b.note : '') + '. Demo booking, nothing was sent.'), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n') + '\r\n';
  }
  function downloadIcs(b) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics(b)], { type: 'text/calendar' }));
    a.download = 'booking-' + b.date + '.ics'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function find(id) { return bookings().filter(function (b) { return b.id === id; })[0]; }

  function renderMine() {
    var all = bookings().slice().sort(function (a, b) { return (a.date + hm(a.start)) < (b.date + hm(b.start)) ? -1 : 1; });
    if (!all.length) { mineEl.innerHTML = '<p>No bookings yet. Pick a day above to book one.</p>'; return; }
    mineEl.innerHTML = all.map(function (b) {
      var d = parse(b.date);
      return '<article class="bk-card"><h3>' + DOWL[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ', ' + hm(b.start) + '</h3>' +
        '<p>' + b.len + ' minutes, ' + esc(TOPICS[b.topic]) + '</p><p>' + esc(b.name) + ', ' + esc(b.email) + '</p>' + (b.note ? '<p>' + esc(b.note) + '</p>' : '') +
        '<p class="bk-sample">Demo booking, saved in this browser only.</p>' +
        '<div class="bk-actions"><button type="button" class="bk-btn" data-ics="' + b.id + '">Download .ics</button><button type="button" class="bk-btn" data-cancel="' + b.id + '">Cancel</button></div></article>';
    }).join('');
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ics],[data-cancel]'); if (!b) return;
    if (b.dataset.ics) { var bk = find(b.dataset.ics); if (bk) downloadIcs(bk); }
    else {
      save('bookings', bookings().filter(function (x) { return x.id !== b.dataset.cancel; }));
      renderMine(); renderCal(false); if (selDay) renderSlots();
      if (window.Shop && Shop.toast) Shop.toast('Booking cancelled.');
    }
  });

  renderCal(false); renderMine();
})();
