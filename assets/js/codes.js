/* هدایت گستر | کاتالوگ بر اساس کد کالا (۸ رقمی)
   رقم ۱-۲ نوع کالا | ۳ ردیف | ۴-۵ تخصصی | ۶ رنگ/نوع | ۷-۸ برند
   ─ «بر اساس نوع کالا»: نوع کالا › نوع (زیردسته) › توان › برند › کالا
   ─ «بر اساس برند»:    برند › نوع کالا › کالا
   کالاهای بدون موجودی و برندهای بدون موجودی نمایش داده نمی‌شوند. */
(function () {
  'use strict';
  var M = window.HG_CODEMAP, ITEMS = window.HG_ITEMS, SUB = window.HG_SUBTYPES || {};
  if (!M || !ITEMS) { return; }

  var $ = function (id) { return document.getElementById(id); };
  var fa = function (v) { return String(v).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; }); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var toEn = function (s) { return String(s).replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); }); };
  var norm = function (s) {
    return toEn(String(s)).replace(/ي/g, 'ی').replace(/ك/g, 'ک')
      .replace(/[\u200c\u200e\u200f\u064B-\u065F]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  };

  /* ---- «نوع کالا» (زیردسته) از روی نام کالا ---- */
  function subOf(t, name) {
    var s = norm(name), m;
    if (t === '15') {                                     /* براکت: بر اساس اندازه */
      if (s.indexOf('زیر کابینتی') > -1) { return 'لامپ زیر کابینتی'; }
      m = s.match(/(\d+)\s*سانتی/);
      return m ? ('براکت ' + fa(m[1]) + ' سانتی') : 'براکت';
    }
    var rules = SUB[t];
    if (!rules) { return ''; }
    for (var i = 0; i < rules.length; i++) {
      if (s.indexOf(norm(rules[i][0])) > -1) { return rules[i][1]; }
    }
    return '';
  }

  /* ---- «توان / مشخصه» از روی نام کالا ----
     برای هر گروه کالا فقط یک واحد نمایش داده می‌شود (واحد غالب همان گروه)
     تا فهرست توان یکدست بماند (مثلاً فقط «وات» یا فقط «آمپر» یا فقط «سانت»). */
  var UNITS = [
    ['watt', function (s) { var m = s.match(/(\d+)\s*[a-z]{0,4}\s*وات/); return m && { k: +m[1], label: fa(m[1]) + ' وات' }; }],
    ['house', function (s) {
      var m = s.match(/(?:(\d+)|(تک|یک|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده))\s*خانه/);
      if (!m) { return null; }
      var W = { 'تک': 1, 'یک': 1, 'دو': 2, 'سه': 3, 'چهار': 4, 'پنج': 5, 'شش': 6, 'هفت': 7, 'هشت': 8, 'نه': 9, 'ده': 10 };
      var n = m[1] ? +m[1] : W[m[2]];
      return { k: n, label: fa(n) + ' خانه' };
    }],
    ['cross', function (s) { var m = s.match(/(\d+(?:\/\d+)?)\s*\*\s*(\d+)/); return m && { k: parseFloat(m[1].replace('/', '.')) * 1000 + (+m[2]), label: fa(m[1]) + '×' + fa(m[2]) }; }],
    ['cm', function (s) { var m = s.match(/(\d+)\s*سانتی/); return m && { k: +m[1], label: fa(m[1]) + ' سانت' }; }],
    ['pair', function (s) { var m = s.match(/(\d+)\s*زوجی/); return m && { k: +m[1], label: fa(m[1]) + ' زوجی' }; }],
    ['amp', function (s) { var m = s.match(/(\d+(?:\/\d+)?)\s*آمپر/); return m && { k: parseFloat(m[1].replace('/', '.')), label: fa(m[1]) + ' آمپر' }; }]
  ];
  function allSpecs(name) {
    var s = norm(name), out = {};
    for (var i = 0; i < UNITS.length; i++) {
      var v = UNITS[i][1](s);
      if (v) { out[UNITS[i][0]] = v; }
    }
    return out;
  }
  var unitByType = (function () {
    var cnt = {}, best = {};
    ITEMS.forEach(function (a) {
      if (!(a[2] > 0)) { return; }                          /* فقط کالاهای موجود */
      var t = a[0].slice(0, 2), s = allSpecs(a[1]);
      Object.keys(s).forEach(function (u) {
        cnt[t] = cnt[t] || {}; cnt[t][u] = (cnt[t][u] || 0) + 1;
      });
    });
    Object.keys(cnt).forEach(function (t) {
      var top = null, n = -1;
      UNITS.forEach(function (u) { var c = cnt[t][u[0]] || 0; if (c > n) { n = c; top = u[0]; } });
      best[t] = n > 0 ? top : null;
    });
    return best;
  })();
  function specOf(t, name) {
    var u = unitByType[t];
    if (!u) { return null; }
    return allSpecs(name)[u] || null;
  }

  /* ---- مدل: فقط کالاهای موجود ---- */
  var data = ITEMS.map(function (a) {
    var c = a[0], t = c.slice(0, 2), b = c.slice(6, 8), d6 = c[5], nm = a[1];
    return {
      code: c, name: nm, stock: a[2], unit: a[3], img: a[4],
      t: t, sp: c.slice(3, 5), b: b,
      bn: M.brands[b] || ('برند ' + fa(b)), tn: M.types[t] || ('گروه ' + fa(t)),
      col: /^1[0-7]$/.test(t) ? (M.colors[d6] || '') : '',
      sub: subOf(t, nm), spec: specOf(t, nm),
      q: norm(nm) + ' ' + c
    };
  }).filter(function (p) { return p.stock > 0 && p.t !== '99' && p.b !== '99'; });   /* فقط موجود، بدون کد ۹۹ (متفرقه) */

  var DIMS = { type: ['t', 'sub', 'spec', 'b'], brand: ['b', 't'] };
  var EMPTY = 'سایر';
  var PAGE = 60;
  var st = { mode: 'type', sel: { t: null, sub: null, spec: null, b: null }, q: '', showAll: false, page: 1 };

  function dims() { return DIMS[st.mode]; }
  function keyOf(d, p) {
    if (d === 't') { return p.t; }
    if (d === 'sub') { return p.sub; }
    if (d === 'spec') { return p.spec ? p.spec.label : ''; }
    if (d === 'b') { return p.bn; }
    return '';
  }
  function labelOf(d, k) {
    if (k === '') { return EMPTY; }
    if (d === 't') { return M.types[k] || ('گروه ' + fa(k)); }
    return k;
  }
  function tileSub(d, items, k) {
    if (d === 't') { return 'کد ' + fa(k); }
    if (d === 'b') {
      var cs = {};
      items.forEach(function (p) { cs[p.b] = 1; });
      return 'کد ' + Object.keys(cs).sort().map(fa).join('، ');
    }
    return '';
  }
  /* ایکون نوع کالا (برای نوع و زیردسته‌ی آن) و لوگوی برند (برای برند) */
  var TI = window.HG_TYPE_ICONS, BL = window.HG_BRAND_LOGOS;
  function tileIcon(d, items, k) {
    if (d === 't' && TI) {
      var a = TI.svg(k, 26); return a ? '<span class="cc-ic">' + a + '</span>' : '';
    }
    if (d === 'sub' && TI && st.sel.t != null) {          /* زیردسته: ایکون همان نوع کالا */
      var b = TI.svg(st.sel.t, 26); return b ? '<span class="cc-ic">' + b + '</span>' : '';
    }
    if (d === 'b' && BL) {
      var src = BL.fallback, own = false;
      items.forEach(function (p) { if (!own && BL.isOwn(p.b)) { src = BL.forCode(p.b); own = true; } });
      return '<span class="cc-logo' + (own ? '' : ' hg') + '"><img src="' + esc(src) + '" alt="" loading="lazy"></span>';
    }
    return '';
  }
  function minCode(items) {
    var m = '99';
    items.forEach(function (p) { if (p.b < m) { m = p.b; } });
    return m;
  }
  function sortKeys(d, keys, g) {
    if (d === 't') {                                       /* کد نوع کالا: عددی صعودی */
      return keys.slice().sort(function (a, b) { return (+a) - (+b); });
    }
    if (d === 'spec') {
      return keys.slice().sort(function (a, b) {
        if (a === '') { return 1; } if (b === '') { return -1; }
        return g[a][0].spec.k - g[b][0].spec.k;
      });
    }
    if (d === 'b') {                                       /* کد عددی صعودی، «بدون برند» آخر */
      return keys.slice().sort(function (a, b) {
        var ca = minCode(g[a]), cb = minCode(g[b]);
        if (ca === '00') { return 1; } if (cb === '00') { return -1; }
        return (+ca) - (+cb);
      });
    }
    return keys.slice().sort(function (a, b) { return g[b].length - g[a].length || a.localeCompare(b, 'fa'); });
  }
  function distinctReal(list, d) {
    var s = {}, n = 0;
    list.forEach(function (p) { var k = keyOf(d, p); if (k !== '' && !s[k]) { s[k] = 1; n++; } });
    return n;
  }

  function itemHTML(p) {
    var ok = p.stock > 0;
    return '<article class="cc-item">' +
      (p.img ? '<img src="' + esc(p.img) + '" alt="" loading="lazy">' : '<div class="cc-noimg">' + esc(p.tn.charAt(0)) + '</div>') +
      '<div class="cc-info"><h3>' + esc(p.name) + '</h3>' +
      '<div class="cc-code" dir="ltr" title="نوع ' + p.t + ' | تخصصی ' + p.sp + ' | برند ' + p.b + '">' +
      p.code.slice(0, 3) + '<u>' + p.sp + '</u>' + p.code[5] + '<em>' + p.b + '</em></div>' +
      '<div class="cc-meta"><span>' + esc(p.tn) + '</span>' + (p.sub ? '<span>' + esc(p.sub) + '</span>' : '') +
      '<span>' + esc(p.bn) + '</span>' + (p.col ? '<span>' + esc(p.col) + '</span>' : '') + '</div></div>' +
      '<span class="cc-stock ' + '</span></article>';
  }

  function render() {
    var root = $('cc-body'), crumbs = [], html = '', showList = false, list;
    document.querySelectorAll('.cc-tab').forEach(function (b) { b.classList.toggle('active', b.dataset.mode === st.mode); });
    var ORDER = dims();
    var q = norm(st.q).trim();

    if (q) {                                               /* جستجوی سراسری */
      list = data.filter(function (p) { return q.split(/\s+/).every(function (w) { return p.q.indexOf(w) > -1; }); });
      crumbs.push('نتیجه جستجو');
      showList = true;
    } else {
      list = data.slice();
      ORDER.forEach(function (d) {
        if (st.sel[d] != null) {
          list = list.filter(function (p) { return keyOf(d, p) === st.sel[d]; });
          crumbs.push(labelOf(d, st.sel[d]));
        }
      });
      var next = null;
      if (!st.showAll) {
        for (var i = 0; i < ORDER.length; i++) {
          var d = ORDER[i];
          if (st.sel[d] != null) { continue; }
          if (d === 'sub' && distinctReal(list, d) < 2) { continue; }
          if (d === 'spec' && distinctReal(list, d) < 2) { continue; }
          next = d; break;
        }
      }
      if (next) {
        var g = {}, keys = [];
        list.forEach(function (p) { var k = keyOf(next, p); if (!g[k]) { g[k] = []; keys.push(k); } g[k].push(p); });
        keys = sortKeys(next, keys, g);
        if (crumbs.length) {
          html += '<button type="button" class="cc-all" data-all="1">مشاهده همه (' + fa(list.length) + ' کالا)</button>';
        }
        html += '<div class="cc-grid">' + keys.map(function (k) {
          var sub = tileSub(next, g[k], k), ic = tileIcon(next, g[k], k);
          return '<button type="button" class="cc-tile' + (ic ? ' has-ic' : '') + '" data-dim="' + next + '" data-k="' + esc(k) + '">' +
            ic + '<span class="cc-tx"><b>' + esc(labelOf(next, k)) + '</b>' + (sub ? '<i>' + esc(sub) + '</i>' : '') +
            '<span class="cc-n">' + fa(g[k].length) + ' کالا</span></span></button>';
        }).join('') + '</div>';
      } else {
        showList = true;
      }
    }

    if (showList) {
      var rows = list.slice().sort(function (a, b) { return a.code < b.code ? -1 : a.code > b.code ? 1 : 0; });
      html = '<div class="cc-count">' + fa(rows.length) + ' کالا</div><div class="cc-list">' +
        rows.slice(0, st.page * PAGE).map(itemHTML).join('') + '</div>' +
        (rows.length > st.page * PAGE ? '<button type="button" class="btn cc-more" id="cc-more">نمایش بیشتر</button>' : '');
      if (!rows.length) { html = '<p class="cc-empty">کالایی یافت نشد.</p>'; }
    }
    $('cc-crumbs').innerHTML = crumbs.length
      ? '<button type="button" class="cc-back" id="cc-back">‹ بازگشت</button><span>' + crumbs.map(esc).join(' › ') + '</span>'
      : '';
    root.innerHTML = html;
  }

  function back() {
    if (st.q) { st.q = ''; $('cc-search').value = ''; }
    else if (st.showAll) { st.showAll = false; }
    else {
      var ORDER = dims();
      for (var i = ORDER.length - 1; i >= 0; i--) {
        if (st.sel[ORDER[i]] != null) { st.sel[ORDER[i]] = null; break; }
      }
    }
    st.page = 1; render();
  }

  function init() {
    var el = $('code-catalog'); if (!el) { return; }
    el.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) { return; }
      if (t.classList.contains('cc-tab')) {
        st.mode = t.dataset.mode;
        st.sel = { t: null, sub: null, spec: null, b: null };
        st.showAll = false; st.page = 1;
      }
      else if (t.id === 'cc-back') { back(); return; }
      else if (t.id === 'cc-more') { st.page++; }
      else if (t.id === 'cc-pdfbtn') {                    /* PDF لینک‌دار؛ فیلتر فعلی (نوع/برند) */
        var u = 'print.html?ids=all&mode=compact';
        if (st.sel.t != null) { u += '&type=code-' + encodeURIComponent(st.sel.t); }
        if (st.sel.b != null) { u += '&brand=' + encodeURIComponent(st.sel.b); }
        window.open(u, '_blank'); return;
      }
      else if (t.dataset.all) { st.showAll = true; st.page = 1; }
      else if (t.dataset.dim) {
        st.sel[t.dataset.dim] = t.dataset.k;
        st.showAll = false; st.page = 1; window.scrollTo(0, 0);
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
