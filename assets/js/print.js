/* =============================================================================
   هدایت گستر | ساخت نمای چاپ و PDF
   -----------------------------------------------------------------------------
   ورودی‌های آدرس (querystring):
     ids   : فهرست شناسه کالاها با کاما — خالی یا all = همه کالاها
     per   : 1 یا 2 (تعداد کالا در هر صفحه — فقط در حالت کامل)
     orient: portrait | landscape
     toc   : 1 یا 0 (ساخت صفحه فهرست)
     mode  : compact | detail | auto
             auto = تک‌کالا یا مقایسه → کامل ؛ بقیه → فشرده
             compact = فقط برند + تصویر + نام + کد کالا (بدون توضیح/ویژگی/مشخصات)
             detail  = توضیح + ویژگی‌ها + جدول مشخصات فنی
     auto  : 1 = باز شدن خودکار پنجره چاپ پس از آماده شدن فونت و تصاویر
============================================================================= */
(function () {
  'use strict';
  var HG = window.HG = window.HG || {};
  var S = HG.store, U = HG.util;

  var q = new URLSearchParams(location.search);
  var IDS = (q.get('ids') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var PER = q.get('per') === '2' ? 2 : 1;
  var ORIENT = q.get('orient') === 'landscape' ? 'landscape' : 'portrait';
  var TOC = q.get('toc') !== '0';
  var AUTO = q.get('auto') === '1';
  var MODE = q.get('mode') || 'auto';
  var SRC = q.get('src') || '';        // 'compare' = خروجی از مقایسه محصولات
  var LIST = [];

  /* تعداد کالا در هر صفحه‌ی حالت فشرده (۳ ستون × ۳ ردیف عمودی) */
  var COMPACT_PER_PAGE = ORIENT === 'landscape' ? 12 : 9;

  var AVAIL = { in: 'موجود در انبار', order: 'قابل سفارش', out: 'اختصاصی / ناموجود' };

  function esc(s) { return U.esc(s); }
  function fa(s) { return U.fa(s); }

  function mainCat(p) {
    var c = S.category(p.categoryId), guard = 0;
    while (c && c.parentId && guard++ < 10) { c = S.category(c.parentId); }
    return c ? c.title : 'سایر';
  }

  function foot(st, pageNo) {
    return '<div class="p-foot"><span class="brand-mini">' + esc(st.brandFa) + '</span>' +
      '<span>تلفن تماس: ' + fa(st.phone) + '</span>' +
      '<span>صفحه ' + fa(pageNo) + '</span></div>';
  }

  /* --------------------------------------------------------------- جلد */
  function coverSheet(st) {
    var today = '';
    try { today = new Date().toLocaleDateString('fa-IR'); } catch (e) { today = ''; }
    return '<section class="sheet cover' + (ORIENT === 'landscape' ? ' landscape' : '') + '">' +
      '<div class="glow"></div><div class="glow b"></div>' +
      '<div class="cover-logo">' + esc(st.logoText || 'HG') + '</div>' +
      '<h1>' + esc(st.catalogTitle || 'کاتالوگ محصولات') + '</h1>' +
      '<h2>' + esc(st.brandFa) + '</h2>' +
      '<div class="rule"></div>' +
      '<div class="meta">' + esc(st.catalogSubtitle || '') + '<br>' +
      'شماره تماس: ' + fa(st.phone) + ' — پشتیبانی: ' + fa(st.mobile) + '<br>' +
      esc(st.address || '') + '<br>' +
      'تعداد کالاهای این نسخه: ' + fa(LIST.length) +
      (today ? ' — تاریخ تهیه: ' + fa(today) : '') + '</div>' +
      '<div class="foot">' + esc(st.site || '') + '</div>' +
      '</section>';
  }

  /* --------------------------------------------------- فهرست مطالب */
  function tocSheet(st) {
    var startPage = 3, items = '', lastGroup = '';
    LIST.forEach(function (p, i) {
      var g = mainCat(p);
      if (g !== lastGroup) {
        items += '<li class="grp"><span>' + esc(g) + '</span></li>';
        lastGroup = g;
      }
      items += '<li><span>' + esc(p.name) + '</span><span class="dots"></span>' +
        '<span class="pg">' + fa(startPage + Math.floor(i / PER)) + '</span></li>';
    });
    return '<section class="sheet toc' + (ORIENT === 'landscape' ? ' landscape' : '') + '">' +
      '<h1>فهرست مطالب</h1><ol>' + items + '</ol>' +
      foot(st, 2) + '</section>';
  }

  /* ---------------------------------------------------- بلوک یک کالا */
  function kvHTML(p) {
    var cells = ['power', 'lumen', 'cct', 'ip'].map(function (k) {
      var f = (S.data.fields || []).filter(function (x) { return x.key === k; })[0];
      var v = (p.specs || {})[k];
      if (!f || v == null || v === '') { return ''; }
      return '<div><b>' + fa(v) + (f.unit && f.unit !== 'IP' ? ' ' + esc(f.unit) : '') +
        '</b><span>' + esc(f.label) + '</span></div>';
    }).join('');
    return cells ? '<div class="p-kv">' + cells + '</div>' : '';
  }

  function specsHTML(p) {
    var rows = S.specRows(p);
    if (!rows.length) { return ''; }
    var groups = {};
    rows.forEach(function (r) { (groups[r.group] = groups[r.group] || []).push(r); });
    return Object.keys(groups).map(function (g) {
      return '<table class="specs"><caption>' + esc(g) + '</caption><tbody>' +
        groups[g].map(function (r) {
          return '<tr><th>' + esc(r.label) + '</th><td>' + esc(r.value) +
            (r.unit && r.unit !== 'IP' ? ' ' + esc(r.unit) : '') + '</td></tr>';
        }).join('') + '</tbody></table>';
    }).join('');
  }

  function productBlock(p) {
    var feats = (p.features || []).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('');
    return '<div class="p-block">' +
      '<div class="p-head">' +
        '<div style="flex:1">' +
          '<div class="p-cat">' + esc(S.categoryPath(p.categoryId)) +
            (S.typeTitle(p.typeId) ? ' • نوع کالا: ' + esc(S.typeTitle(p.typeId)) : '') + '</div>' +
          '<h2 class="p-title">' + esc(p.name) + '</h2>' +
          (p.nameEn ? '<div class="p-en">' + esc(p.nameEn) + '</div>' : '') +
        '</div>' +
        '<div class="p-code">' +'<br>کد کالا : '+ esc(p.sku || '') +
          '<br>برند: ' + esc(p.brand || '-') +
          '<br>' + esc(AVAIL[p.availability || 'in']) + '</div>' +
      '</div>' +
      '<div class="p-body">' +
        '<div>' +
          '<div class="p-img"><img src="' + U.img(p) + '" alt="' + esc(p.name) + '"></div>' +
          '<p class="p-summary">' + esc(p.summary || '') + '</p>' +
        '</div>' +
        '<div>' +
          kvHTML(p) +
          (feats ? '<ul class="feats">' + feats + '</ul>' : '') +
          (p.description ? '<p class="desc">' + esc(p.description) + '</p>' : '') +
          specsHTML(p) +
          '<p class="desc" style="margin-top:3mm;font-size:9pt;color:var(--soft)">' +
            'گارانتی: ' + fa((p.specs || {}).warranty || '-') + ' ماه' +
            ((p.specs || {}).standard ? ' • استاندارد: ' + esc(p.specs.standard) : '') +
            ((p.specs || {}).moq ? ' • حداقل سفارش: ' + fa(p.specs.moq) + ' عدد' : '') +
          '</p>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ==========================================================================
     حالت فشرده (کاتالوگ کامل)
     در این حالت فقط «برند + تصویر + نام کالا + کد» چاپ می‌شود؛ هیچ توضیح،
     ویژگی یا جدول مشخصات فنی نمایش داده نمی‌شود. کالاها بر اساس برند گروه‌بندی
     می‌شوند تا تنوع برند در یک نگاه دیده شود.
  ========================================================================== */

  /* انتخاب حالت نهایی خروجی */
  function resolvedMode() {
    if (MODE === 'compact' || MODE === 'detail') { return MODE; }
    /* auto: تک‌کالا یا خروجی مقایسه → کامل (با توضیح و ویژگی) ؛ کاتالوگ → فشرده */
    return (LIST.length === 1 || SRC === 'compare') ? 'detail' : 'compact';
  }

  /* گروه‌بندی کالاها بر اساس برند (الفبایی فارسی، سپس ترتیب نمایش) */
  function byBrand() {
    var groups = [], index = {};
    LIST.slice().sort(function (a, b) {
      var cmp = String(a.brand || '').localeCompare(String(b.brand || ''), 'fa');
      if (cmp !== 0) { return cmp; }
      return (a.order || 0) - (b.order || 0);
    }).forEach(function (p) {
      var b = p.brand || 'بدون برند';
      if (!index[b]) { index[b] = { brand: b, items: [] }; groups.push(index[b]); }
      index[b].items.push(p);
    });
    return groups;
  }

  /* چیدمان صفحه‌ها: هر آیتم یا سربرگ برند است یا یک کالا */
  function planCompact() {
    var groups = byBrand(), flow = [];
    groups.forEach(function (g) {
      flow.push({ type: 'brand', brand: g.brand, count: g.items.length });
      g.items.forEach(function (p) { flow.push({ type: 'product', p: p }); });
    });

    var pages = [], cur = [];
    flow.forEach(function (it) {
      if (cur.length >= COMPACT_PER_PAGE) { pages.push(cur); cur = []; }
      cur.push(it);
    });
    if (cur.length) { pages.push(cur); }

    /* شماره صفحه‌ی شروع هر برند برای «فهرست برندها» */
    var brandPage = {}, startPage = (TOC && LIST.length > 1) ? 3 : 2;
    pages.forEach(function (items, i) {
      items.forEach(function (it) {
        if (it.type === 'brand' && brandPage[it.brand] == null) {
          brandPage[it.brand] = startPage + i;
        }
      });
    });
    return { groups: groups, pages: pages, brandPage: brandPage };
  }

  function compactCard(p) {
    return '<article class="c-card">' +
      '<div class="c-img"><img src="' + U.img(p) + '" alt="' + esc(p.name) + '"></div>' +
      '<div class="c-name">' + esc(p.name) + '</div>' +
      (p.sku ? '<div class="c-code">کد کالا: ' + esc(p.sku) + '</div>' : '') +
    '</article>';
  }

  function compactSheets(plan, st) {
    var startPage = (TOC && LIST.length > 1) ? 3 : 2;
    return plan.pages.map(function (items, i) {
      var inner = items.map(function (it) {
        if (it.type === 'brand') {
          return '<h2 class="c-brand"><span>' + esc(it.brand) + '</span>' +
            '<i>' + fa(it.count) + ' کالا</i></h2>';
        }
        return compactCard(it.p);
      }).join('');
      return '<section class="sheet compact-sheet' + (ORIENT === 'landscape' ? ' landscape' : '') + '">' +
        '<div class="c-grid">' + inner + '</div>' +
        foot(st, startPage + i) + '</section>';
    }).join('');
  }

  /* فهرست برندها (جای «فهرست مطالب» در حالت فشرده) */
  function brandIndexSheet(plan, st) {
    var items = plan.groups.map(function (g) {
      var pg = plan.brandPage[g.brand];
      return '<li><span>' + esc(g.brand) + '</span><span class="dots"></span>' +
        '<span class="pg">' + (pg ? fa(pg) : '—') + '</span></li>';
    }).join('');
    return '<section class="sheet toc' + (ORIENT === 'landscape' ? ' landscape' : '') + '">' +
      '<h1>فهرست برندها</h1>' +
      '<p class="toc-note">' + fa(plan.groups.length) + ' برند • ' + fa(LIST.length) + ' کالا</p>' +
      '<ol>' + items + '</ol>' +
      foot(st, 2) + '</section>';
  }

  /* -------------------------------------------- اندازه و جهت کاغذ چاپ */
  function applyPageSize() {
    var el = document.getElementById('page-size');
    if (!el) {
      el = document.createElement('style');
      el.id = 'page-size';
      document.head.appendChild(el);
    }
    el.textContent = '@page { size: A4 ' + (ORIENT === 'landscape' ? 'landscape' : 'portrait') + '; margin: 0; }';
  }

  /* ------------------------------------------------------ انتخاب کالاها */
  function resolveProducts() {
    if (!IDS.length || IDS[0] === 'all') { return S.products(); }
    return IDS.map(S.product).filter(Boolean);
  }

  /* --------------------------------------------------------- ساخت صفحات */
  function render() {
    var st = S.data.settings || {};
    var hasToc = TOC && LIST.length > 1;
    var mode = resolvedMode();

    applyPageSize();

    var out = coverSheet(st);

    if (mode === 'compact') {
      /* کاتالوگ کامل: فقط برند + تصویر + نام + کد کالا */
      var plan = planCompact();
      if (hasToc) { out += brandIndexSheet(plan, st); }
      out += compactSheets(plan, st);
    } else {
      /* حالت کامل: توضیحات، ویژگی‌ها و جدول مشخصات فنی */
      if (hasToc) { out += tocSheet(st); }
      var startPage = hasToc ? 3 : 2;
      for (var i = 0; i < LIST.length; i += PER) {
        var pageNo = startPage + Math.floor(i / PER);
        var chunk = LIST.slice(i, i + PER);
        out += '<section class="sheet' + (ORIENT === 'landscape' ? ' landscape' : '') +
          (PER === 2 ? ' compact' : '') + '">' +
          chunk.map(productBlock).join('') +
          foot(st, pageNo) + '</section>';
      }
    }

    document.getElementById('sheets').innerHTML = out;
    document.title = (st.catalogTitle || 'کاتالوگ') + ' | ' + st.brandFa;
    document.body.classList.toggle('mode-compact', mode === 'compact');

    var info = document.getElementById('tp-info');
    if (info) {
      info.textContent = fa(LIST.length) + ' کالا • ' +
        (mode === 'compact' ? 'نمایش فشرده (برند + نام + کد)' :
          (PER === 1 ? 'یک کالا در هر صفحه' : 'دو کالا در هر صفحه')) + ' • ' +
        (ORIENT === 'portrait' ? 'A4 عمودی' : 'A4 افقی') +
        (hasToc ? (mode === 'compact' ? ' • همراه فهرست برندها' : ' • همراه فهرست مطالب') : '');
    }
    syncToolbar();
  }

  function syncToolbar() {
    var set = function (id, on) {
      var b = document.getElementById(id);
      if (b) { b.classList.toggle('active', !!on); }
    };
    var mode = resolvedMode();
    set('tp-per1', PER === 1);
    set('tp-per2', PER === 2);
    set('tp-portrait', ORIENT === 'portrait');
    set('tp-landscape', ORIENT === 'landscape');
    set('tp-mode-compact', mode === 'compact');
    set('tp-mode-detail', mode === 'detail');
    /* گروه «تعداد در صفحه» فقط در حالت کامل معنا دارد */
    var perGroup = document.getElementById('tp-per-group');
    if (perGroup) { perGroup.hidden = (mode === 'compact'); }
  }

  /* ------------------------------------------------------- نوار ابزار */
  function setOpt(key, value) {
    if (key === 'per') { PER = value === '2' ? 2 : 1; }
    if (key === 'orient') { ORIENT = value === 'landscape' ? 'landscape' : 'portrait'; }
    if (key === 'mode') { MODE = (value === 'detail' || value === 'compact') ? value : 'auto'; }
    try {
      var u = new URL(location.href);
      u.searchParams.set(key, value);
      u.searchParams.delete('auto');
      history.replaceState(null, '', u.toString());
    } catch (e) {}
    render();
  }

  function bindToolbar() {
    var on = function (id, fn) {
      var el = document.getElementById(id);
      if (el) { el.addEventListener('click', fn); }
    };
    on('tp-print', function () { window.print(); });
    on('tp-per1', function () { setOpt('per', '1'); });
    on('tp-per2', function () { setOpt('per', '2'); });
    on('tp-portrait', function () { setOpt('orient', 'portrait'); });
    on('tp-landscape', function () { setOpt('orient', 'landscape'); });
    on('tp-mode-compact', function () { setOpt('mode', 'compact'); });
    on('tp-mode-detail', function () { setOpt('mode', 'detail'); });
  }

  /* --------------------------------- انتظار برای فونت و عکس‌ها سپس چاپ */
  function whenReady(cb) {
    var fonts = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    fonts.catch(function () {}).then(function () {
      var imgs = Array.prototype.slice.call(document.images);
      if (!imgs.length) { return cb(); }
      var left = imgs.length, done = false;
      var finish = function () { if (!done) { done = true; clearTimeout(timer); cb(); } };
      var timer = setTimeout(finish, 4000);
      imgs.forEach(function (img) {
        if (img.complete) { if (--left <= 0) { finish(); } return; }
        img.addEventListener('load', function () { if (--left <= 0) { finish(); } });
        img.addEventListener('error', function () { if (--left <= 0) { finish(); } });
      });
    });
  }

  /* ------------------------------------------------------- راه‌اندازی */
  S.load().then(function () {
    LIST = resolveProducts();

    if (!LIST.length) {
      document.getElementById('sheets').innerHTML =
        '<section class="sheet"><h1 style="color:#0B3D91">کالایی برای چاپ یافت نشد</h1>' +
        '<p>از کاتالوگ، محصولات مورد نظر را انتخاب کنید و دوباره خروجی بگیرید.</p>' +
        '<p><a href="index.html">بازگشت به کاتالوگ</a></p></section>';
      return;
    }

    render();
    bindToolbar();

    if (AUTO) {
      whenReady(function () {
        setTimeout(function () { window.print(); }, 400);
      });
    }
  });

  HG.printView = {
    get LIST() { return LIST; },
    render: render,
    setOpt: setOpt
  };
})();
