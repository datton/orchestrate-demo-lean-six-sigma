(function (root) {
  var SHIFT = 1.5;
  var TABLE = [
    { s: 1, dpmo: 691462 }, { s: 2, dpmo: 308538 }, { s: 3, dpmo: 66807 },
    { s: 4, dpmo: 6210 }, { s: 5, dpmo: 233 }, { s: 6, dpmo: 3.4 }
  ];

  function normInv(p) {
    var a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
    var b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    var c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    var d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    var lo = 0.02425, q, r;
    if (p < lo) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - lo) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    q = p - 0.5; r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }

  function calc(units, opps, defects) {
    var dpu = defects / units, dpo = defects / (units * opps), dpmo = dpo * 1e6;
    var yieldPct = (1 - dpo) * 100;
    var sigma = null;
    if (dpo > 0 && dpo < 1) sigma = normInv(1 - dpo) + SHIFT;
    return { dpu: dpu, dpo: dpo, dpmo: dpmo, yieldPct: yieldPct, sigma: sigma };
  }

  function validate(units, opps, defects) {
    if (!isFinite(units) || units < 1 || Math.floor(units) !== units) return { field: 'units', msg: 'Enter how many units you checked, as a whole number of 1 or more.' };
    if (!isFinite(opps) || opps < 1 || Math.floor(opps) !== opps) return { field: 'opps', msg: 'Enter how many ways one unit can go wrong, as a whole number of 1 or more.' };
    if (!isFinite(defects) || defects < 0 || Math.floor(defects) !== defects) return { field: 'defects', msg: 'Enter the defects you found, as a whole number (0 or more).' };
    if (defects > units * opps) return { field: 'defects', msg: 'You cannot find more defects than there are chances for them: ' + (units * opps).toLocaleString('en-US') + ' (units × opportunities).' };
    return null;
  }

  var api = { calc: calc, validate: validate, normInv: normInv, TABLE: TABLE, SHIFT: SHIFT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Sigma = api;
  if (typeof document === 'undefined') return;

  function init() {
    var form = document.getElementById('sg-form');
    if (!form) return;
    var f = { units: form.units, opps: form.opps, defects: form.defects };
    var err = document.getElementById('sg-error'), out = document.getElementById('sg-results'), read = document.getElementById('sg-reading');
    var cells = { dpu: document.getElementById('sg-dpu'), dpmo: document.getElementById('sg-dpmo'), yld: document.getElementById('sg-yield'), sigma: document.getElementById('sg-sigma') };
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var shown = {}, raf = {};
    var fmt = function (n, dp) { return n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp }); };

    function tween(key, el, to, dp, suffix) {
      var from = shown[key]; shown[key] = to;
      cancelAnimationFrame(raf[key]);
      if (reduce || from == null) { el.textContent = fmt(to, dp) + suffix; return; }
      var t0 = performance.now(), dur = 500;
      (function step(t) {
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(from + (to - from) * e, dp) + suffix;
        if (k < 1) raf[key] = requestAnimationFrame(step);
      })(t0);
    }

    function setText(el, s) { el.textContent = s; shown[el.id] = null; }

    function highlight(sigma) {
      var rows = document.querySelectorAll('#sg-table tbody tr');
      for (var i = 0; i < rows.length; i++) {
        var on = sigma != null && Math.round(sigma) === i + 1;
        rows[i].classList.toggle('is-near', on);
        if (on) rows[i].setAttribute('aria-current', 'true'); else rows[i].removeAttribute('aria-current');
      }
    }

    function update() {
      var u = f.units.value.trim() === '' ? NaN : Number(f.units.value), o = f.opps.value.trim() === '' ? NaN : Number(f.opps.value), d = f.defects.value.trim() === '' ? NaN : Number(f.defects.value);
      var bad = validate(u, o, d);
      Object.keys(f).forEach(function (k) { f[k].removeAttribute('aria-invalid'); });
      if (bad) {
        f[bad.field].setAttribute('aria-invalid', 'true');
        err.textContent = bad.msg; err.hidden = false; out.classList.add('is-stale');
        read.textContent = 'Fix the highlighted field to see your results.';
        highlight(null);
        return;
      }
      err.hidden = true; err.textContent = ''; out.classList.remove('is-stale');
      var r = calc(u, o, d);
      tween('dpu', cells.dpu, r.dpu, 3, '');
      tween('dpmo', cells.dpmo, r.dpmo, 0, '');
      tween('yld', cells.yld, r.yieldPct, 3, ' %');
      var text;
      if (r.sigma == null) {
        setText(cells.sigma, r.dpo === 0 ? '6+' : '0');
        text = r.dpo === 0 ? 'No defects found in this sample. That is a good sign, but a sigma level needs at least one defect: check a larger sample before you claim six sigma.' : 'Every opportunity failed, so there is no sigma level to report.';
      } else {
        tween('sigma', cells.sigma, r.sigma, 2, '');
        text = 'That is about ' + fmt(Math.round(r.dpmo), 0) + ' defects per million opportunities, a process yield of ' + fmt(r.yieldPct, 2) + ' % and a sigma level of about ' + fmt(r.sigma, 1) + ' (with the conventional 1.5 shift).';
      }
      read.textContent = text;
      highlight(r.sigma);
    }

    form.addEventListener('input', update);
    form.addEventListener('submit', function (e) { e.preventDefault(); update(); });
    document.getElementById('sg-reset').addEventListener('click', function () {
      f.units.value = 500; f.opps.value = 4; f.defects.value = 38; update(); f.units.focus();
    });
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(typeof window !== 'undefined' ? window : globalThis);
