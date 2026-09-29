/* هدایت گستر | کاتالوگ بر اساس کد کالا (۸ رقمی)
   رقم ۱-۲ نوع کالا | ۳ ردیف | ۴-۵ تخصصی | ۶ رنگ/نوع | ۷-۸ برند */
(function () {
  'use strict';
  var M = window.HG_CODEMAP, ITEMS = window.HG_ITEMS;
  if (!M || !ITEMS) { return; }
  var $ = function (id) { return document.getElementById(id); };
  var fa = function (v) { return String(v).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; }); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var norm = function (s) { return String(s).replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[\u064B-\u065F]/g, '').toLowerCase(); };
  var digits = function (s) { return String(s).replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); }); };

  /* ---- مدل: هر کالا با تجزیه‌ی کد ---- */
  var data = ITEMS.map(function (a) {
    var c = a[0], t = c.slice(0, 2), b = c.slice(6, 8), d6 = c[5];
    return {
      code: c, name: a[1], stock: a[2], unit: a[3], img: a[4], t: t, sp: c.slice(3, 5), b: b,
      bn: M.brands[b] || ('برند ' + fa(b)), tn: M.types[t] || ('گروه ' + fa(t)),
      col: /^1[0-7]$/.test(t) ? (M.colors[d6] || '') : '', q: norm(a[1]) + ' ' + c
    };
  });
  var bKey = function (p) { return p.bn; };           /* کدهای هم‌نام (مثل شوان ۰۲ و ۶۰) یک برند می‌شوند */

  var st = { mode: 'type', type: null, brand: null, q: '', inStock: false, page: 1 }, PAGE = 60;

  function group(list, keyFn) {
    var m = {}; list.forEach(function (p) { var k = keyFn(p); (m[k] = m[k] || []).push(p); }); return m;
  }
  function sortKeys(m, byCode) {
    return Object.keys(m).sort(function (a, b) {
      return byCode ? a.localeCompare(b) : m[b].length - m[a].length || a.localeCompare(b, 'fa');
    });
  }
  function inStockN(l) { return l.filter(function (p) { return p.stock > 0; }).length; }

  function tile(label, sub, count, avail, attr) {
    return '<button type="button" class="cc-tile" ' + attr + '><b>' + esc(label) + '</b>' +
      (sub ? '<i>' + esc(sub) + '</i>' : '') +
      '<span>' + fa(count) + ' کالا · ' + fa(avail) + ' موجود</span></button>';
  }
  function itemHTML(p) {
    var ok = p.stock > 0;
    return '<article class="cc-item">' +
      (p.img ? '<img src="' + esc(p.img) + '" alt="" loading="lazy">' : '<div class="cc-noimg">' + esc(p.tn.charAt(0)) + '</div>') +
      '<div class="cc-info"><h3>' + esc(p.name) + '</h3>' +
      '<div class="cc-code" dir="ltr" title="نوع ' + p.t + ' | تخصصی ' + p.sp + ' | برند ' + p.b + '">' +
      p.code.slice(0, 3) + '<u>' + p.sp + '</u>' + p.code[5] + '<em>' + p.b + '</em></div>' +
      '<div class="cc-meta"><span>' + esc(p.tn) + '</span><span>' + esc(p.bn) + '</span>' + (p.col ? '<span>' + esc(p.col) + '</span>' : '') + '</div></div>' +
      '<span class="cc-stock ' + (ok ? 'ok' : 'off') + '">' + (ok ? fa(p.stock) + ' ' + esc(p.unit) : 'ناموجود') + '</span></article>';
  }

  function render() {
    var root = $('cc-body'), crumbs = [], list = data, html = '';
    document.querySelectorAll('.cc-tab').forEach(function (b) { b.classList.toggle('active', b.dataset.mode === st.mode); });
    var first = st.mode === 'type' ? 't' : 'b', second = st.mode === 'type' ? 'b' : 't';
    var k1 = st.mode === 'type' ? st.type : st.brand, k2 = st.mode === 'type' ? st.brand : st.type;
    var q = norm(digits(st.q)).trim();

    if (q) {                                             /* جستجوی سراسری */
      list = data.filter(function (p) { return q.split(/\s+/).every(function (w) { return p.q.indexOf(w) > -1; }); });
      crumbs.push('نتیجه جستجو');
    } else {
      var fk = function (p) { return first === 't' ? p.t : bKey(p); }, sk = function (p) { return second === 't' ? p.t : bKey(p); };
      if (k1 != null) { list = list.filter(function (p) { return fk(p) === k1; }); crumbs.push(first === 't' ? M.types[k1] || k1 : k1); }
      if (k1 != null && k2 != null) { list = list.filter(function (p) { return sk(p) === k2; }); crumbs.push(second === 't' ? M.types[k2] || k2 : k2); }
      if (k1 == null || k2 == null) {                     /* سطح انتخاب: نوع/برند یا زیرمجموعه */
        var isFirst = k1 == null, keyFn = isFirst ? fk : sk, g = group(list, keyFn), byT = isFirst ? first === 't' : second === 't';
        html = '<div class="cc-grid">' + sortKeys(g, byT).map(function (k) {
          var label = byT ? (M.types[k] || 'گروه ' + fa(k)) : k, sub = '';
          if (byT) { sub = 'کد ' + fa(k); }
          else { var cs = {}; g[k].forEach(function (p) { cs[p.b] = 1; }); sub = 'کد ' + Object.keys(cs).map(fa).join('، '); }
          return tile(label, sub, g[k].length, inStockN(g[k]), 'data-k="' + esc(k) + '" data-lvl="' + (isFirst ? 1 : 2) + '"');
        }).join('') + '</div>';
        if (!isFirst) { html = '<button type="button" class="cc-all" data-lvl="2" data-k="">مشاهده همه (' + fa(list.length) + ' کالا)</button>' + html; }
      }
      if (k1 != null && k2 == null && st.showAll) { html = ''; }
    }
    var showList = q || (k1 != null && (k2 != null || st.showAll));
    if (showList) {
      var shown = st.inStock ? list.filter(function (p) { return p.stock > 0; }) : list;
      html = '<div class="cc-count">' + fa(shown.length) + ' کالا</div><div class="cc-list">' +
        shown.slice(0, st.page * PAGE).map(itemHTML).join('') + '</div>' +
        (shown.length > st.page * PAGE ? '<button type="button" class="btn cc-more" id="cc-more">نمایش بیشتر</button>' : '') ||
        '';
      if (!shown.length) { html = '<p class="cc-empty">کالایی یافت نشد.</p>'; }
    }
    $('cc-crumbs').innerHTML = (q || k1 != null) ? '<button type="button" class="cc-back" id="cc-back">‹ بازگشت</button><span>' + crumbs.map(esc).join(' › ') + '</span>' : '';
    $('cc-stockbtn').classList.toggle('active', st.inStock);
    root.innerHTML = html;
  }

  function back() {
    if (st.q) { st.q = ''; $('cc-search').value = ''; }
    else if (st.showAll) { st.showAll = false; }
    else if ((st.mode === 'type' ? st.brand : st.type) != null) { if (st.mode === 'type') { st.brand = null; } else { st.type = null; } }
    else { st.type = st.brand = null; }
    st.page = 1; render();
  }

  function init() {
    var el = $('code-catalog'); if (!el) { return; }
    el.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) { return; }
      if (t.classList.contains('cc-tab')) { st.mode = t.dataset.mode; st.type = st.brand = null; st.showAll = false; st.page = 1; }
      else if (t.id === 'cc-back') { back(); return; }
      else if (t.id === 'cc-more') { st.page++; }
      else if (t.id === 'cc-stockbtn') { st.inStock = !st.inStock; st.page = 1; }
      else if (t.dataset.lvl) {
        var lvl = t.dataset.lvl, k = t.dataset.k;
        if (lvl === '1') { if (st.mode === 'type') { st.type = k; } else { st.brand = k; } }
        else if (k === '') { st.showAll = true; }
        else { if (st.mode === 'type') { st.brand = k; } else { st.type = k; } }
        st.page = 1; window.scrollTo(0, 0);
      } else { return; }
      render();
    });
    var s = $('cc-search'), tm;
    s.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { st.q = s.value; st.page = 1; render(); }, 200); });

    /* سوییچ بین «کاتالوگ کد کالا» و «محصولات تصویری» — بخش‌های قبلی دست‌نخورده‌اند */
    var old = ['searchbar', 'catbar', 'brandbar', 'resultbar', 'old-products'];
    function setView(v) {
      var isCode = v === 'code';
      el.hidden = !isCode;
      old.forEach(function (id) { var x = $(id); if (x) { x.style.display = isCode ? 'none' : ''; } });
      document.querySelectorAll('.cc-view').forEach(function (b) { b.classList.toggle('active', b.dataset.view === v); });
      try { localStorage.setItem('hg_view', v); } catch (e) { }
    }
    document.querySelectorAll('.cc-view').forEach(function (b) { b.addEventListener('click', function () { setView(b.dataset.view); }); });
    var v = 'code'; try { v = localStorage.getItem('hg_view') || 'code'; } catch (e) { }
    setView(v); render();
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
