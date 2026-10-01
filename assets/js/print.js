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
  var TYPE_F = q.get('type') || '';    // فیلتر اولیه: نوع کالا (مثلاً 10 یا code-10)
  var BRAND_F = q.get('brand') || '';  // فیلتر اولیه: نام برند
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

  /* ------------------------------------------- جلد و صفحه‌های مقدمه (تصویری)
     برای کاتالوگ کامل: صفحه ۱ = جلد، صفحه ۲ و ۳ = مقدمه (تصویر). فهرست و کالاها بعد از آن‌ها
     می‌آیند و شماره‌ی صفحه‌ها به‌اندازه‌ی INTRO صفحه جلو می‌روند.
     تصویرها: assets/img/intro/cover.jpg ، p2.jpg ، p3.jpg (A4 افقی) */
  var INTRO = 0, TI = window.HG_TYPE_ICONS, BL = window.HG_BRAND_LOGOS;
  function imgSheet(src) {
    return '<section class="sheet img-sheet"><img src="' + src + '" alt=""></section>';
  }
  function introSheets() {
    return imgSheet('assets/img/intro/cover.jpg') + imgSheet('assets/img/intro/p2.jpg') + imgSheet('assets/img/intro/p3.jpg');
  }
  function tIcon(t, sz) {
    var c = String(t.id || '').replace('code-', '');
    var v = TI ? TI.svg(c, sz) : '';
    return v ? '<span class="ix-ic">' + v + '</span>' : '';
  }
  function bLogo(name, cls) {
    return BL ? '<img class="' + cls + '" src="' + BL.forName(name) + '" alt="">' : '';
  }

  /* --------------------------------------------------------------- جلد */
  function coverSheet(st) {
    if (INTRO) { return introSheets(); }
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
    var startPage = 3 + INTRO, items = '', lastGroup = '';
    LIST.forEach(function (p, i) {
      var g = mainCat(p);
      if (g !== lastGroup) {
        items += '<li class="grp"><span>' + esc(g) + '</span></li>';
        lastGroup = g;
      }
      items += '<li><a class="toc-link" href="#pb-' + esc(p.id) + '"><span>' + esc(p.name) + '</span><span class="dots"></span>' +
        '<span class="pg">' + fa(startPage + Math.floor(i / PER)) + '</span></a></li>';
    });
    return '<section class="sheet toc' + (ORIENT === 'landscape' ? ' landscape' : '') + '" id="idx-toc">' +
      '<h1>فهرست مطالب</h1><ol>' + items + '</ol>' +
      foot(st, 2 + INTRO) + '</section>';
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
    return '<div class="p-block" id="pb-' + esc(p.id) + '">' +
      (TOC && LIST.length > 1 ? '<nav class="p-nav"><a href="#idx-toc">📂 فهرست مطالب</a></nav>' : '') +
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

  /* ------------------------------------------------------------------
     مدل کاتالوگ فشرده: نوع کالا ← برند ← کالا  (+ فهرست برند ← انواع)
     همه‌ی عنوان‌ها لینک داخلی PDF هستند (anchor) تا با کلیک بین بخش‌ها بروید.
  ------------------------------------------------------------------ */
  function rootCat(p) {
    var c = S.category(p.categoryId), guard = 0;
    while (c && c.parentId && guard++ < 10) { c = S.category(c.parentId); }
    return c ? { id: c.id, title: c.title, order: c.order || 0 } : { id: 'x', title: 'سایر', order: 9999 };
  }

  function buildModel() {
    var types = [], tIdx = {}, gIdx = {}, brands = [];
    LIST.slice().sort(function (a, b) {
      var ra = rootCat(a), rb = rootCat(b);
      if (ra.order !== rb.order) { return ra.order - rb.order; }
      var c = String(a.brand || '').localeCompare(String(b.brand || ''), 'fa');
      if (c !== 0) { return c; }
      return (a.order || 0) - (b.order || 0);
    }).forEach(function (p) {
      var rc = rootCat(p), t = tIdx[rc.id];
      if (!t) { t = tIdx[rc.id] = { id: rc.id, title: rc.title, n: 0, brands: [], bIdx: {}, num: types.length }; types.push(t); }
      var bn = p.brand || 'بدون برند', b = t.bIdx[bn];
      if (!b) { b = t.bIdx[bn] = { name: bn, items: [], t: t, num: t.brands.length }; b.anchor = 't' + t.num + 'b' + b.num; t.brands.push(b); }
      b.items.push(p); t.n++;
      var g = gIdx[bn];
      if (!g) { g = gIdx[bn] = { name: bn, n: 0, refs: [] }; brands.push(g); }
      g.n++; if (g.refs.indexOf(b) < 0) { g.refs.push(b); }
    });
    types.forEach(function (t) { t.anchor = 't' + t.num; });
    brands.sort(function (a, b) { return a.name.localeCompare(b.name, 'fa'); });
    return { types: types, brands: brands };
  }

  var LAND = function () { return ORIENT === 'landscape'; };

  /* صفحه‌بندی ردیف‌های فهرست بر اساس ارتفاع تقریبی (میلی‌متر) */
  function paginate(rows, hFn, cap) {
    var pages = [], cur = [], y = 0;
    rows.forEach(function (r) {
      var h = hFn(r);
      if (y + h > cap && cur.length) { pages.push(cur); cur = []; y = 0; }
      cur.push(r); y += h;
    });
    if (cur.length) { pages.push(cur); }
    return pages;
  }

  function planCompact() {
    var m = buildModel();
    var CHIPS = LAND() ? 7 : 4, CAP = LAND() ? 100 : 183;
    m.typePages = paginate(m.types, function (t) { return 9 + 6.5 * Math.ceil(t.brands.length / CHIPS); }, CAP);
    m.brandPages = paginate(m.brands, function (g) { return 9 + 6.5 * Math.ceil(g.refs.length / CHIPS); }, CAP);
    m.noIndex = !(TOC && LIST.length > 1);
    if (m.noIndex) { m.typePages = []; m.brandPages = []; }
    m.startPage = 2 + INTRO + m.typePages.length + m.brandPages.length;

    /* چیدمان صفحه‌های کالا با شبیه‌ساز ارتفاع: عنوان نوع → صفحه‌ی جدید */
    var COLS = LAND() ? 4 : 3, ROW = LAND() ? 64 : 67, CAP2 = LAND() ? 158 : 246;
    var pages = [], cur = [], y = 0, col = 0;
    var newPage = function () { if (cur.length) { pages.push(cur); } cur = []; y = 0; col = 0; };
    var endRow = function () { if (col !== 0) { col = 0; y += ROW; } };
    m.types.forEach(function (t) {
      newPage();
      var th = 20 + 6.5 * Math.ceil(t.brands.length / (LAND() ? 8 : 5));
      cur.push({ type: 'type', t: t }); y += th; t.page = m.startPage + pages.length;
      t.brands.forEach(function (b) {
        endRow();
        if (y + 13 + ROW > CAP2) { newPage(); }
        cur.push({ type: 'brand', b: b }); y += 13; b.page = m.startPage + pages.length;
        b.items.forEach(function (p) {
          if (col === 0 && y + ROW > CAP2) { newPage(); cur.push({ type: 'cont', b: b }); y += 13; }
          cur.push({ type: 'product', p: p });
          col++; if (col === COLS) { col = 0; y += ROW; }
        });
      });
    });
    newPage();
    m.pages = pages;
    m.brands.forEach(function (g) { g.page = g.refs.length ? g.refs[0].page : 0; });
    return m;
  }

  function compactCard(p) {
    return '<article class="c-card">' +
      '<div class="c-img">' + ((p.images && p.images.length) ? '<img src="' + U.img(p) + '" alt="' + esc(p.name) + '">' :
        '<span class="c-ph">' + esc(rootCat(p).title.charAt(0)) + '</span>') + '</div>' +
      '<div class="c-name">' + esc(p.name) + '</div>' +
      (p.sku ? '<div class="c-code">کد کالا: ' + esc(p.sku) + '</div>' : '') +
    '</article>';
  }

  var NAV_ON = true;
  function navBar(cur) {
    if (!NAV_ON) { return ''; }
    return '<nav class="p-nav">' +
      '<a href="#idx-types">📂 فهرست انواع کالا</a>' +
      '<a href="#idx-brands">🏷️ فهرست برندها</a>' +
      (cur || '') + '</nav>';
  }

  function chipsHTML(list, hrefFn, labelFn, cntFn) {
    return list.map(function (x) {
      return '<a class="chip" href="#' + hrefFn(x) + '">' + esc(labelFn(x)) + '<i>' + fa(cntFn(x)) + '</i></a>';
    }).join('');
  }

  function compactSheets(plan, st) {
    var cls = 'sheet compact-sheet' + (LAND() ? ' landscape' : '');
    return plan.pages.map(function (items, i) {
      var curT = '', inner = items.map(function (it) {
        if (it.type === 'type') {
          curT = it.t.title;
          return '<div class="c-type" id="' + it.t.anchor + '"><h1>' + tIcon(it.t, 22) + esc(it.t.title) + '</h1>' +
            '<i>' + fa(it.t.n) + ' کالا • ' + fa(it.t.brands.length) + ' برند</i>' +
            '<div class="chips">' + chipsHTML(it.t.brands, function (b) { return b.anchor; },
              function (b) { return b.name; }, function (b) { return b.items.length; }) + '</div></div>';
        }
        if (it.type === 'brand' || it.type === 'cont') {
          return '<h2 class="c-brand" ' + (it.type === 'brand' ? 'id="' + it.b.anchor + '"' : '') + '><span>' + bLogo(it.b.name, 'c-logo') + esc(it.b.name) + '</span>' +
            '<i>' + fa(it.b.items.length) + ' کالا' + (it.type === 'cont' ? ' — ادامه' : '') + '</i>' +
            '<a class="up" href="#' + it.b.t.anchor + '">↑ ' + esc(it.b.t.title) + '</a></h2>';
        }
        return compactCard(it.p);
      }).join('');
      return '<section class="' + cls + '">' + navBar() +
        '<div class="c-grid">' + inner + '</div>' +
        foot(st, plan.startPage + i) + '</section>';
    }).join('');
  }

  /* فهرست ۱: نوع کالا ← برندها  |  فهرست ۲: برند ← انواع کالا */
  function indexSheets(plan, st) {
    var cls = 'sheet toc idx-sheet' + (LAND() ? ' landscape' : ''), out = '', pageNo = 2 + INTRO;
    var tabs = function (on) {
      return '<div class="idx-tabs"><a class="' + (on === 't' ? 'on' : '') + '" href="#idx-types">بر اساس نوع کالا</a>' +
        '<a class="' + (on === 'b' ? 'on' : '') + '" href="#idx-brands">بر اساس برند</a></div>';
    };
    plan.typePages.forEach(function (rows, i) {
      out += '<section class="' + cls + '"' + (i === 0 ? ' id="idx-types"' : '') + '>' +
        '<h1>فهرست بر اساس نوع کالا</h1>' + tabs('t') +
        '<p class="toc-note">' + fa(plan.types.length) + ' نوع کالا • ' + fa(LIST.length) + ' کالا — روی نوع کالا یا برند بزنید</p>' +
        rows.map(function (t) {
          return '<div class="ix-row"><a class="ix-main" href="#' + t.anchor + '">' + tIcon(t, 17) + '<b>' + esc(t.title) + '</b>' +
            '<i>' + fa(t.n) + ' کالا</i><span class="dots"></span><em>ص ' + fa(t.page) + '</em></a>' +
            '<div class="chips">' + chipsHTML(t.brands, function (b) { return b.anchor; },
              function (b) { return b.name; }, function (b) { return b.items.length; }) + '</div></div>';
        }).join('') + foot(st, pageNo++) + '</section>';
    });
    plan.brandPages.forEach(function (rows, i) {
      out += '<section class="' + cls + '"' + (i === 0 ? ' id="idx-brands"' : '') + '>' +
        '<h1>فهرست بر اساس برند</h1>' + tabs('b') +
        '<p class="toc-note">' + fa(plan.brands.length) + ' برند — پس از انتخاب برند فقط انواع کالای همان برند نمایش داده می‌شود</p>' +
        rows.map(function (g) {
          return '<div class="ix-row"><a class="ix-main" href="#' + (g.refs[0] ? g.refs[0].anchor : 'idx-types') + '">' + bLogo(g.name, 'ix-logo') + '<b>' + esc(g.name) + '</b>' +
            '<i>' + fa(g.n) + ' کالا</i><span class="dots"></span><em>ص ' + fa(g.page) + '</em></a>' +
            '<div class="chips">' + chipsHTML(g.refs, function (b) { return b.anchor; },
              function (b) { return b.t.title; }, function (b) { return b.items.length; }) + '</div></div>';
        }).join('') + foot(st, pageNo++) + '</section>';
    });
    return out;
  }

  /* -------------------------------------------- اندازه و جهت کاغذ چاپ */
  function applyPageSize() {
    var el = document.getElementById('page-size');
    if (!el) {
      el = document.createElement('style');
      el.id = 'page-size';
      document.head.appendChild(el);
    }
    el.textContent = '@page { size: A4 ' + (ORIENT === 'landscape' ? 'landscape' : 'portrait') + '; margin: 0; } @page imgland { size: A4 landscape; margin: 0; }';
  }

  /* ------------------------------------------------------ انتخاب کالاها */
  function resolveProducts() {
    var arr = (!IDS.length || IDS[0] === 'all') ? S.products() : IDS.map(S.product).filter(Boolean);
    if (TYPE_F) {
      arr = arr.filter(function (p) {
        var r = rootCat(p);
        return r.id === TYPE_F || r.id === 'code-' + TYPE_F;
      });
    }
    if (BRAND_F) { arr = arr.filter(function (p) { return (p.brand || '') === BRAND_F; }); }
    return arr;
  }

  /* --------------------------------------------------------- ساخت صفحات */
  function render() {
    var st = S.data.settings || {};
    var hasToc = TOC && LIST.length > 1;
    var mode = resolvedMode();
    INTRO = (LIST.length > 1 && SRC !== 'compare') ? 2 : 0;

    applyPageSize();

    var out = coverSheet(st);

    if (mode === 'compact') {
      /* کاتالوگ کامل: فقط برند + تصویر + نام + کد کالا */
      var plan = planCompact();
      NAV_ON = !plan.noIndex;
      out += indexSheets(plan, st);
      out += compactSheets(plan, st);
    } else {
      /* حالت کامل: توضیحات، ویژگی‌ها و جدول مشخصات فنی */
      if (hasToc) { out += tocSheet(st); }
      var startPage = (hasToc ? 3 : 2) + INTRO;
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
        (mode === 'compact' ? 'نمایش فشرده (نوع ← برند ← کالا)' :
          (PER === 1 ? 'یک کالا در هر صفحه' : 'دو کالا در هر صفحه')) + ' • ' +
        (ORIENT === 'portrait' ? 'A4 عمودی' : 'A4 افقی') +
        (hasToc ? (mode === 'compact' ? ' • همراه فهرست انواع و برندها (لینک‌دار)' : ' • همراه فهرست مطالب (لینک‌دار)') : '');
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
    if (key === 'type') { TYPE_F = value; }
    if (key === 'brand') { BRAND_F = value; }
    if (key === 'type' || key === 'brand') { LIST = resolveProducts(); }
    try {
      var u = new URL(location.href);
      if (value === '') { u.searchParams.delete(key); } else { u.searchParams.set(key, value); }
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
    var selT = document.getElementById('tp-type'), selB = document.getElementById('tp-brand');
    if (selT && selB) {
      var all = (IDS.length && IDS[0] !== 'all') ? IDS.map(S.product).filter(Boolean) : S.products();
      var ts = {}, bs = {};
      all.forEach(function (p) { var r = rootCat(p); ts[r.id] = r; bs[p.brand || 'بدون برند'] = 1; });
      selT.innerHTML = '<option value="">همه انواع کالا</option>' + Object.keys(ts).sort(function (a, b) { return ts[a].order - ts[b].order; })
        .map(function (id) { return '<option value="' + esc(id) + '">' + esc(ts[id].title) + '</option>'; }).join('');
      selB.innerHTML = '<option value="">همه برندها</option>' + Object.keys(bs).sort(function (a, b) { return a.localeCompare(b, 'fa'); })
        .map(function (n) { return '<option value="' + esc(n) + '">' + esc(n) + '</option>'; }).join('');
      selT.value = TYPE_F ? (ts[TYPE_F] ? TYPE_F : 'code-' + TYPE_F) : '';
      selB.value = BRAND_F;
      selT.addEventListener('change', function () { setOpt('type', selT.value); });
      selB.addEventListener('change', function () { setOpt('brand', selB.value); });
    }
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
