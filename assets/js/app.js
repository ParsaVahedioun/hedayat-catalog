/* =============================================================================
   هدایت گستر | کاتالوگ دیجیتال — منطق صفحه اصلی (نسخه موبایل‌محور و مینیمال)
   -----------------------------------------------------------------------------
   • جستجو، دسته‌بندی، فیلتر، مرتب‌سازی، علاقه‌مندی‌ها، مقایسه و خروجی PDF
   • شیت پایین‌کشی برای فیلترها، جزئیات کالا، مقایسه و PDF
   • اصلاح شمارش دسته‌بندی‌ها: هر دسته، تعداد کالاهای خودش + همه زیردسته‌ها
============================================================================= */
(function () {
  'use strict';
  var HG = window.HG = window.HG || {};
  var S = HG.store, U = HG.util;

  function $(id) { return document.getElementById(id); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function closest(el, sel) {
    while (el && el.nodeType === 1) {
      if (el.matches ? el.matches(sel) : false) { return el; }
      el = el.parentElement;
    }
    return null;
  }

  var FAV_KEY = 'hg_catalog_favs';
  var PAGE = 24;            // تعداد کالا در هر مرحله نمایش

  var AVAIL = { in: 'موجود', order: 'قابل سفارش', out: 'ناموجود' };
  var AVAIL_FULL = { in: 'موجود در انبار', order: 'قابل سفارش', out: 'اختصاصی / ناموجود' };
  var KEY_SPECS = ['power', 'lumen', 'cct', 'ip', 'warranty'];

  var state = {
    q: '', cat: '', brand: '', type: '', avail: '',
    specs: {}, featured: false, favOnly: false, sort: 'order',
    compare: [], favs: []
  };
  var expanded = {};       // وضعیت باز/بسته درخت دسته‌بندی
  var shown = PAGE;        // تعداد کالای نمایش‌داده‌شده
  var pdfScope = 'filtered';

  /* ------------------------------------------------------------- اعلان‌ها */
  function toast(msg, kind) {
    var wrap = $('toasts'); if (!wrap) { return; }
    var el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.innerHTML = msg;
    wrap.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      setTimeout(function () { el.remove(); }, 320);
    }, 3400);
  }

  /* ------------------------------------------------------- رنگ و تم */
  function lighten(hex, amt) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) { h = h.split('').map(function (c) { return c + c; }).join(''); }
    if (h.length !== 6 || /[^0-9a-f]/i.test(h)) { return '#1E6BD6'; }
    var n = parseInt(h, 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(r + (255 - r) * amt);
    g = Math.round(g + (255 - g) * amt);
    b = Math.round(b + (255 - b) * amt);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function setTheme(mode, silent) {
    document.documentElement.setAttribute('data-theme', mode);
    var b = $('btn-theme');
    if (b) { b.textContent = mode === 'dark' ? '☀️' : '🌙'; }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) { meta.setAttribute('content', mode === 'dark' ? '#0e1116' : '#0B3D91'); }
    if (!silent) { try { localStorage.setItem('hg_catalog_theme', mode); } catch (e) {} }
  }

  function applySettings() {
    var s = S.data.settings || {};
    var root = document.documentElement;
    root.style.setProperty('--primary', s.themePrimary || '#0B3D91');
    root.style.setProperty('--primary-2', lighten(s.themePrimary || '#0B3D91', 0.28));
    root.style.setProperty('--accent', s.themeAccent || '#F5A623');

    var set = function (id, val) { var el = $(id); if (el) { el.textContent = val == null ? '' : val; } };
    set('brand-fa', s.brandFa);
    set('brand-en', s.brandEn);
    set('brand-badge', s.logoText || 'HG');
    set('f-logo', s.logoText || 'HG');
    set('f-brand-fa', s.brandFa);
    set('f-brand-en', s.brandEn);
    set('f-slogan', s.slogan);
    set('f-address', s.address);
    set('f-year', U.fa(new Date().getFullYear()));

    var phone = $('f-phone'), mobile = $('f-mobile'), email = $('f-email'), site = $('f-site');
    if (phone) { phone.textContent = '☎️ ' + (s.phone || ''); phone.href = 'tel:' + String(s.phone || '').replace(/[^0-9+]/g, ''); }
    if (mobile) { mobile.textContent = '📱 ' + (s.mobile || ''); mobile.href = 'tel:' + String(s.mobile || '').replace(/[^0-9+]/g, ''); }
    if (email) { email.textContent = '✉️ ' + (s.email || ''); email.href = 'mailto:' + (s.email || ''); }
    if (site) { site.href = s.site || '#'; }

    var modes = {
      indexeddb: '💾 ذخیره‌سازی: دیتابیس داخلی مرورگر',
      localStorage: '💾 ذخیره‌سازی: حافظه محلی مرورگر',
      memory: '⚠️ ذخیره‌سازی موقت (داده ذخیره نمی‌شود)'
    };
    set('f-storage', modes[S.storageMode] || '');

    document.title = (s.catalogTitle || 'کاتالوگ محصولات') + ' | ' + (s.brandFa || '');

    var mode = 'light';
    try { mode = localStorage.getItem('hg_catalog_theme') || s.themeMode || 'light'; } catch (e) {}
    setTheme(mode, true);
  }

  /* ------------------------------------------------ شمارش درخت دسته‌بندی
     نکته مهم: از هر کالا به سمت «والدها» بالا می‌رویم تا دسته‌های مادر هم
     تعداد کل زیرمجموعه‌هایشان را نشان دهند (باگ نسخه قبلی: والدها صفر بودند). */
  function catCounts() {
    var counts = {};
    (S.data.products || []).forEach(function (p) {
      var id = p.categoryId, guard = 0;
      while (id && guard++ < 12) {
        counts[id] = (counts[id] || 0) + 1;
        var c = S.category(id);
        id = c && c.parentId ? c.parentId : null;
      }
    });
    return counts;
  }

  function rootCategories() {
    return (S.data.categories || [])
      .filter(function (c) { return !c.parentId; })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }

  function childrenOf(parentId) {
    return (S.data.categories || [])
      .filter(function (c) { return (c.parentId || null) === parentId; })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }

  /* -------------------------------------------------- نوار دسته‌بندی‌ها */
  function renderCatChips() {
    var counts = catCounts();
    var html = '<button class="cchip" type="button" data-cat="">همه <i>' +
      U.fa((S.data.products || []).length) + '</i></button>';
    rootCategories().forEach(function (c) {
      html += '<button class="cchip" type="button" data-cat="' + U.esc(c.id) + '">' +
        (c.icon ? c.icon + ' ' : '') + U.esc(c.title) +
        ' <i>' + U.fa(counts[c.id] || 0) + '</i></button>';
    });
    $('cat-chips').innerHTML = html;
    syncCatUI();
  }

  /* ------------------------------------------------- درخت آکاردئونی */
  /* seen/depth: محافظ در برابر داده معیوب (شناسه تکراری) تا هیچ‌وقت
     بازگشت بی‌پایان و خطای «stack overflow» رخ ندهد. */
  function treeHTML(parentId, counts, seen, depth) {
    seen = seen || {};
    depth = depth || 0;
    if (depth > 8) { return ''; }
    var kids = childrenOf(parentId).filter(function (c) { return c.id && !seen[c.id]; });
    if (!kids.length) { return ''; }
    return '<ul class="ftree">' + kids.map(function (c) {
      seen[c.id] = true;
      var kidsHTML = treeHTML(c.id, counts, seen, depth + 1);
      var hasKids = !!kidsHTML;
      var isOpen = !!expanded[c.id];
      return '<li class="ftree-item" data-id="' + U.esc(c.id) + '">' +
        '<div class="ftree-row">' +
          (hasKids
            ? '<button class="ftree-toggle' + (isOpen ? ' open' : '') + '" type="button" data-exp="' + U.esc(c.id) + '" aria-label="باز و بسته کردن">▾</button>'
            : '<span class="ftree-toggle ghost" aria-hidden="true">▾</span>') +
          '<button class="ftree-name" type="button" data-cat="' + U.esc(c.id) + '">' +
            (c.icon ? '<span class="ci">' + c.icon + '</span>' : '') +
            '<span>' + U.esc(c.title) + '</span>' +
            '<span class="fc-n">' + U.fa(counts[c.id] || 0) + '</span>' +
          '</button>' +
        '</div>' +
        (hasKids ? '<div class="ftree-kids' + (isOpen ? ' open' : '') + '" data-kids="' + U.esc(c.id) + '">' + kidsHTML + '</div>' : '') +
      '</li>';
    }).join('') + '</ul>';
  }

  /* ------------------------------------------------------- ساخت فیلترها */
  function buildFilters() {
    var counts = catCounts();
    var total = (S.data.products || []).length;

    var catHTML =
      '<div class="ftree-item" data-id=""><div class="ftree-row">' +
        '<span class="ftree-toggle ghost" aria-hidden="true">▾</span>' +
        '<button class="ftree-name" type="button" data-cat="">' +
          '<span class="ci">📦</span><span>همه محصولات</span><span class="fc-n">' + U.fa(total) + '</span>' +
        '</button>' +
      '</div></div>' + treeHTML(null, counts);

    var brandOpts = '<option value="">همه برندها</option>' + (S.data.brands || []).map(function (b) {
      return '<option value="' + U.esc(b) + '">' + U.esc(b) + '</option>';
    }).join('');

    var typeOpts = '<option value="">همه انواع کالا</option>' + (S.data.types || []).map(function (t) {
      return '<option value="' + U.esc(t.id) + '">' + U.esc(t.title) + '</option>';
    }).join('');

    var specHTML = (S.data.fields || []).filter(function (f) { return f.filter; }).map(function (f) {
      var values = {};
      (S.data.products || []).forEach(function (p) {
        var v = p.specs ? p.specs[f.key] : null;
        if (v === '' || v == null) { return; }
        String(v).split(/[،,/]/).forEach(function (part) {
          part = part.trim(); if (part) { values[part] = true; }
        });
      });
      var opts = Object.keys(values).slice(0, 18);
      if (!opts.length) { return ''; }
      return '<div class="field">' +
        '<label>' + U.esc(f.label) + (f.unit ? ' (' + U.esc(f.unit) + ')' : '') + '</label>' +
        '<div class="chips">' + opts.map(function (o) {
          return '<button class="chip spec-chip" type="button" data-field="' + U.esc(f.key) +
            '" data-value="' + U.esc(o) + '">' + U.esc(o) + '</button>';
        }).join('') + '</div></div>';
    }).join('');

    $('filters-body').innerHTML =
      '<section class="sec"><h3>دسته‌بندی</h3>' + catHTML + '</section>' +
      '<section class="sec"><h3>برند</h3><div class="field">' +
        '<select class="control" id="filter-brand">' + brandOpts + '</select></div></section>' +
      '<section class="sec"><h3>نوع کالا</h3><div class="field">' +
        '<select class="control" id="filter-type">' + typeOpts + '</select></div></section>' +
      '<section class="sec"><h3>وضعیت موجودی</h3><div class="field">' +
        '<select class="control" id="filter-avail">' +
          '<option value="">همه وضعیت‌ها</option>' +
          '<option value="in">موجود در انبار</option>' +
          '<option value="order">قابل سفارش</option>' +
          '<option value="out">اختصاصی / ناموجود</option>' +
        '</select></div></section>' +
      '<section class="sec"><h3>ترتیب نمایش</h3><div class="field">' +
        '<select class="control" id="sort-select">' +
          '<option value="order">ترتیب کاتالوگ</option>' +
          '<option value="name">نام کالا</option>' +
          '<option value="power">توان (کم به زیاد)</option>' +
          '<option value="power-desc">توان (زیاد به کم)</option>' +
          '<option value="new">جدیدترین</option>' +
        '</select></div></section>' +
      '<section class="sec"><h3>مشخصات فنی</h3>' +
        (specHTML || '<p style="font-size:.8rem;color:var(--muted);margin:0">فیلتر مشخصات فنی تعریف نشده است.</p>') +
      '</section>';

    syncFiltersUI();
  }

  /* ------------------------------------------------ همگام‌سازی UI فیلترها */
  function syncFiltersUI() {
    var setVal = function (id, val) { var el = $(id); if (el) { el.value = val; } };
    setVal('filter-brand', state.brand);
    setVal('filter-type', state.type);
    setVal('filter-avail', state.avail);
    setVal('sort-select', state.sort);
    qsa('.spec-chip').forEach(function (c) {
      var on = state.specs[c.getAttribute('data-field')] === c.getAttribute('data-value');
      c.classList.toggle('active', on);
    });
    $('chip-featured').classList.toggle('active', state.featured);
    $('chip-fav').classList.toggle('active', state.favOnly);
  }

  function syncCatUI() {
    var cur = state.cat || '';
    qsa('#cat-chips .cchip').forEach(function (b) {
      b.classList.toggle('active', (b.getAttribute('data-cat') || '') === cur);
    });
    qsa('#filters-body .ftree-item').forEach(function (li) {
      var nm = li.querySelector('.ftree-name');
      li.classList.toggle('active', !!nm && (nm.getAttribute('data-cat') || '') === cur);
    });
    var t = $('result-title');
    if (t) {
      var parts = [];
      if (cur) { parts.push(S.categoryPath(cur) || ''); }
      if (state.brand) { parts.push('برند ' + state.brand); }
      t.textContent = parts.filter(Boolean).join(' • ') || 'همه محصولات';
    }
  }

  /* --------------------------------------------------- نوار برندها
     برای مشتری عمده‌فروش، «تنوع برند» مهم است؛ پس برندها با تعداد کالا
     به‌صورت چیپ قابل کلیک بالای شبکه محصولات نمایش داده می‌شوند.        */
  function brandCounts() {
    var c = {};
    (S.data.products || []).forEach(function (p) {
      var b = p.brand || '';
      if (b) { c[b] = (c[b] || 0) + 1; }
    });
    return c;
  }

  function renderBrandChips() {
    var wrap = $('brand-chips');
    if (!wrap) { return; }
    var counts = brandCounts();
    var brands = (S.data.brands || []).slice();
    /* برندهایی که فقط در کالاها هستند ولی در لیست برندها نیستند */
    Object.keys(counts).forEach(function (b) { if (brands.indexOf(b) === -1) { brands.push(b); } });
    brands.sort(function (a, b) {
      return (counts[b] || 0) - (counts[a] || 0) || String(a).localeCompare(String(b), 'fa');
    });

    var total = (S.data.products || []).length;
    wrap.innerHTML =
      '<button class="bchip all" type="button" data-brand="">همه برندها<i>' + U.fa(total) + '</i></button>' +
      brands.map(function (b) {
        var n = counts[b] || 0;
        return '<button class="bchip' + (n ? '' : ' empty') + '" type="button" data-brand="' + U.esc(b) + '">' +
          U.esc(b) + '<i>' + U.fa(n) + '</i></button>';
      }).join('');
    syncBrandUI();
  }

  function syncBrandUI() {
    var cur = state.brand || '';
    qsa('#brand-chips .bchip').forEach(function (b) {
      b.classList.toggle('active', (b.getAttribute('data-brand') || '') === cur);
    });
    var bar = $('brandbar');
    if (bar) { bar.classList.toggle('has-active', !!cur); }
  }

  function activeFilterCount() {
    var n = 0;
    if (state.q) { n++; }
    if (state.cat) { n++; }
    if (state.brand) { n++; }
    if (state.type) { n++; }
    if (state.avail) { n++; }
    if (state.featured) { n++; }
    if (state.favOnly) { n++; }
    n += Object.keys(state.specs).filter(function (k) { return state.specs[k]; }).length;
    return n;
  }

  function syncFilterBadge() {
    var n = activeFilterCount(), el = $('filter-count');
    el.textContent = U.fa(n);
    el.hidden = n === 0;
  }

  /* ------------------------------------------------------ فیلتر و مرتب */
  function num(p) { return Number((p.specs || {}).power) || 0; }

  function filtered() {
    var catIds = state.cat ? S.descendants(state.cat) : null;
    var q = state.q.trim().toLowerCase();
    var out = (S.data.products || []).filter(function (p) {
      if (catIds && catIds.indexOf(p.categoryId) === -1) { return false; }
      if (state.brand && p.brand !== state.brand) { return false; }
      if (state.type && p.typeId !== state.type) { return false; }
      if (state.avail && (p.availability || 'in') !== state.avail) { return false; }
      if (state.featured && !p.featured) { return false; }
      if (state.favOnly && state.favs.indexOf(p.id) === -1) { return false; }
      for (var k in state.specs) {
        if (!state.specs[k]) { continue; }
        var raw = String((p.specs || {})[k] == null ? '' : p.specs[k]).toLowerCase();
        var want = String(state.specs[k]).toLowerCase();
        if (raw !== want && raw.split(/[،,/\s]+/).indexOf(want) === -1) { return false; }
      }
      if (q) {
        var hay = [p.name, p.nameEn, p.sku, p.brand, p.summary,
          S.categoryPath(p.categoryId), S.typeTitle(p.typeId),
          (p.tags || []).join(' '), (p.features || []).join(' ')].join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) { return false; }
      }
      return true;
    });

    if (state.sort === 'name') { out.sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'fa'); }); }
    else if (state.sort === 'power') { out.sort(function (a, b) { return num(a) - num(b); }); }
    else if (state.sort === 'power-desc') { out.sort(function (a, b) { return num(b) - num(a); }); }
    else if (state.sort === 'new') { out.sort(function (a, b) { return String(b.createdAt || '').localeCompare(String(a.createdAt || '')); }); }
    else { out.sort(U.byOrder); }
    return out;
  }

  /* -------------------------------------------------------- کارت کالا */
  function fieldByKey(k) {
    return (S.data.fields || []).filter(function (f) { return f.key === k; })[0];
  }

  function keySpecs(p, max) {
    var out = [];
    KEY_SPECS.forEach(function (k) {
      if (out.length >= (max || 3)) { return; }
      var f = fieldByKey(k), v = (p.specs || {})[k];
      if (!f || v == null || v === '') { return; }
      out.push({ label: f.label, unit: f.unit, value: U.fa(v) });
    });
    return out;
  }

  function cardHTML(p) {
    var badges = '';
    if (p.isNew) { badges += '<span class="badge new">جدید</span>'; }
    if (p.featured) { badges += '<span class="badge hot">ویژه</span>'; }

    var specs = keySpecs(p, 3).map(function (s) {
      return '<span class="spec-pill">' + U.esc(s.label) + ': ' + U.esc(s.value) +
        (s.unit && s.unit !== 'IP' ? ' ' + U.esc(s.unit) : '') + '</span>';
    }).join('');

    var av = p.availability || 'in';
    var price = (S.data.settings.showPrices && p.price)
      ? U.num(p.price) + ' تومان'
      : U.esc(S.data.settings.priceLabel || 'استعلام قیمت');

    return '<article class="card" data-id="' + U.esc(p.id) + '" tabindex="0">' +
      '<div class="card-media">' +
        '<img loading="lazy" src="' + U.img(p) + '" alt="' + U.esc(p.name) + '">' +
        (badges ? '<div class="card-badges">' + badges + '</div>' : '') +
        '<button class="media-btn fav' + (state.favs.indexOf(p.id) > -1 ? ' on' : '') + '" type="button" data-fav="' +
          U.esc(p.id) + '" aria-label="افزودن به علاقه‌مندی‌ها">♥</button>' +
        '<button class="media-btn cmp' + (state.compare.indexOf(p.id) > -1 ? ' on' : '') + '" type="button" data-cmp-btn="' +
          U.esc(p.id) + '" aria-label="افزودن به مقایسه">⚖</button>' +
      '</div>' +
      '<div class="card-body">' +
        '<h3 class="card-title">' + U.esc(p.name) + '</h3>' +
        '<div class="card-meta">' +
          '<span>' + U.esc(p.brand || '—') + '</span>' +
          (p.sku ? '<span class="sep">•</span><span class="sku">' + U.esc(p.sku) + '</span>' : '') +
        '</div>' +
        (specs ? '<div class="card-specs">' + specs + '</div>' : '') +
        '<div class="card-foot">' +
          '<span class="avail ' + av + '"><i></i>' + AVAIL[av] + '</span>' +
          '<span class="card-price">' + price + '</span>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function renderGrid() {
    var list = filtered(), grid = $('product-grid');
    $('result-count').textContent = U.fa(list.length) + ' کالا';

    if (!list.length) {
      grid.innerHTML = '<div class="empty"><b>کالایی با این مشخصات پیدا نشد</b>' +
        '<p>فیلترها را تغییر دهید یا عبارت جستجو را کوتاه‌تر کنید.</p>' +
        '<button class="btn btn-primary btn-sm" type="button" id="empty-reset">حذف همه فیلترها</button></div>';
      $('btn-more').hidden = true;
      return;
    }

    grid.innerHTML = list.slice(0, shown).map(cardHTML).join('');
    var more = $('btn-more');
    more.hidden = list.length <= shown;
    if (!more.hidden) {
      more.textContent = 'نمایش ' + U.fa(Math.min(PAGE, list.length - shown)) + ' محصول بیشتر';
    }
  }

  function refresh(resetPage) {
    if (resetPage !== false) { shown = PAGE; }
    syncCatUI();
    syncBrandUI();
    syncFiltersUI();
    syncFilterBadge();
    renderGrid();
    var ac = $('apply-count');
    if (ac) { ac.textContent = U.fa(filtered().length); }
  }

  /* ------------------------------------------------------------- شیت‌ها */
  function openSheet(id) {
    $(id).classList.add('open');
    document.body.classList.add('no-scroll');
  }
  function closeSheet(id) {
    var el = $(id); if (!el) { return; }
    el.classList.remove('open');
    if (!document.querySelector('.overlay.open')) { document.body.classList.remove('no-scroll'); }
  }
  function closeAllSheets() {
    ['filters-overlay', 'detail-overlay', 'compare-overlay', 'pdf-overlay'].forEach(closeSheet);
  }

  /* ------------------------------------------------------ جزئیات کالا */
  function kvHero(p) {
    var cells = ['power', 'lumen', 'cct', 'ip'].map(function (k) {
      var f = fieldByKey(k), v = (p.specs || {})[k];
      if (!f || v == null || v === '') { return ''; }
      return '<div class="kv"><b>' + U.fa(v) +
        (f.unit && f.unit !== 'IP' ? ' <small style="font-size:.66rem">' + U.esc(f.unit) + '</small>' : '') +
        '</b><span>' + U.esc(f.label) + '</span></div>';
    }).join('');
    return cells ? '<div class="kv-hero">' + cells + '</div>' : '';
  }

  function specTableHTML(p) {
    var rows = S.specRows(p);
    if (!rows.length) { return '<p style="font-size:.82rem;color:var(--muted);margin:0">مشخصات فنی برای این کالا ثبت نشده است.</p>'; }
    var groups = {};
    rows.forEach(function (r) { (groups[r.group] = groups[r.group] || []).push(r); });
    return Object.keys(groups).map(function (g) {
      return '<table class="spec-table"><caption>' + U.esc(g) + '</caption><tbody>' +
        groups[g].map(function (r) {
          return '<tr><th>' + U.esc(r.label) + '</th><td>' + U.esc(r.value) +
            (r.unit && r.unit !== 'IP' ? ' <small style="color:var(--muted)">' + U.esc(r.unit) + '</small>' : '') +
            '</td></tr>';
        }).join('') + '</tbody></table>';
    }).join('');
  }

  function openDetail(id) {
    var p = S.product(id); if (!p) { return; }
    var s = S.data.settings || {};
    var imgs = (p.images && p.images.length) ? p.images : [U.img(p)];
    var av = p.availability || 'in';
    var isFav = state.favs.indexOf(p.id) > -1;
    var isCmp = state.compare.indexOf(p.id) > -1;

    var html =
      '<header class="sheet-head">' +
        '<span class="sheet-handle" aria-hidden="true"></span>' +
        '<h2>' + U.esc(p.name) + '</h2>' +
        '<button class="icon-btn" type="button" data-close="detail-overlay" aria-label="بستن">✕</button>' +
      '</header>' +
      '<div class="sheet-body">' +
        '<div class="gallery">' +
          '<div class="gallery-main"><img id="gal-main" src="' + imgs[0] + '" alt="' + U.esc(p.name) + '"></div>' +
          (imgs.length > 1 ? '<div class="gallery-thumbs" id="gal-thumbs">' + imgs.map(function (src, i) {
            return '<img src="' + src + '" data-idx="' + i + '" class="' + (i === 0 ? 'active' : '') + '" alt="تصویر ' + (i + 1) + '">';
          }).join('') + '</div>' : '') +
        '</div>' +

        '<div class="d-meta">' +
          '<span class="d-cat">' + U.esc(S.categoryPath(p.categoryId)) +
            (S.typeTitle(p.typeId) ? ' • ' + U.esc(S.typeTitle(p.typeId)) : '') + '</span>' +
          '<div class="d-badges">' +
            (p.isNew ? '<span class="badge new">جدید</span>' : '') +
            (p.featured ? '<span class="badge hot">ویژه</span>' : '') +
            '<span class="avail ' + av + '"><i></i>' + AVAIL_FULL[av] + '</span>' +
          '</div>' +
        '</div>' +

        (p.nameEn ? '<div class="d-en">' + U.esc(p.nameEn) + '</div>' : '') +

        '<div class="d-ids">' +
          '<span>کد کالا: <b dir="ltr">' + U.esc(p.sku || '-') + '</b></span>' +
          '<span>برند: <b>' + U.esc(p.brand || '-') + '</b></span>' +
        '</div>' +

        kvHero(p) +
        (p.summary ? '<p class="d-summary">' + U.esc(p.summary) + '</p>' : '') +

        '<div class="d-actions">' +
          '<button class="btn btn-sm btn-accent" type="button" data-pdf-one="' + U.esc(p.id) + '">📄 PDF این کالا</button>' +
          '<button class="btn btn-sm' + (isFav ? ' fav-on' : '') + '" type="button" data-fav="' + U.esc(p.id) + '">♥ علاقه‌مندی</button>' +
          '<button class="btn btn-sm' + (isCmp ? ' cmp-on' : '') + '" type="button" data-cmp-btn="' + U.esc(p.id) + '">⚖ مقایسه</button>' +
          '<button class="btn btn-sm" type="button" data-contact="' + U.esc(p.id) + '">📞 استعلام قیمت</button>' +
        '</div>' +

        ((p.features || []).length
          ? '<section class="sec" style="margin-top:20px"><h3>ویژگی‌ها</h3><ul class="flist">' +
            p.features.map(function (f) { return '<li>' + U.esc(f) + '</li>'; }).join('') + '</ul></section>'
          : '') +

        (p.description
          ? '<section class="sec"><h3>توضیحات</h3><p style="font-size:.84rem;color:var(--muted);margin:0;text-align:justify">' +
            U.esc(p.description) + '</p></section>'
          : '') +

        '<section class="sec"><h3>مشخصات فنی</h3>' + specTableHTML(p) + '</section>' +

        '<section class="sec"><h3>گارانتی و دانلود</h3>' +
          '<p style="font-size:.82rem;color:var(--muted);margin:0 0 10px">گارانتی: <b style="color:var(--text)">' +
            U.fa((p.specs || {}).warranty || '-') + ' ماه</b>' +
            ((p.specs || {}).standard ? ' • استاندارد: ' + U.esc(p.specs.standard) : '') +
            ((p.specs || {}).moq ? ' • حداقل سفارش: ' + U.fa(p.specs.moq) + ' عدد' : '') + '</p>' +
          (p.datasheet
            ? '<a class="btn btn-sm" href="' + U.esc(p.datasheet) + '" target="_blank" rel="noopener">📥 دانلود دیتاشیت</a>'
            : '<p style="font-size:.78rem;color:var(--muted);margin:0">فایل دیتاشیت بارگذاری نشده است.</p>') +
          (p.video ? '<div style="margin-top:8px"><a class="btn btn-sm" href="' + U.esc(p.video) +
            '" target="_blank" rel="noopener">🎬 ویدیو محصول</a></div>' : '') +
        '</section>' +
      '</div>';

    var sheet = $('detail-sheet');
    sheet.innerHTML = html;
    openSheet('detail-overlay');
    sheet.querySelector('.sheet-body').scrollTop = 0;

    var thumbs = $('gal-thumbs');
    if (thumbs) {
      thumbs.addEventListener('click', function (e) {
        var img = e.target;
        if (!img || img.tagName !== 'IMG') { return; }
        $('gal-main').src = img.getAttribute('src');
        qsa('img', thumbs).forEach(function (t) { t.classList.remove('active'); });
        img.classList.add('active');
      });
    }
  }

  /* --------------------------------------------------------- علاقه‌مندی */
  function toggleFav(id) {
    var i = state.favs.indexOf(id);
    if (i > -1) { state.favs.splice(i, 1); } else { state.favs.push(id); }
    try { localStorage.setItem(FAV_KEY, JSON.stringify(state.favs)); } catch (e) {}

    // به‌روزرسانی بدون بستن شیت جزئیات
    qsa('[data-fav="' + id.replace(/"/g, '') + '"]').forEach(function (b) {
      b.classList.toggle('on', state.favs.indexOf(id) > -1);
      b.classList.toggle('fav-on', state.favs.indexOf(id) > -1);
    });
    refresh(false);
  }

  /* ------------------------------------------------------------- مقایسه */
  function toggleCompare(id) {
    var i = state.compare.indexOf(id);
    if (i > -1) {
      state.compare.splice(i, 1);
    } else {
      if (state.compare.length >= 4) { toast('حداکثر ۴ کالا را می‌توانید مقایسه کنید.', 'warn'); return; }
      state.compare.push(id);
    }
    var on = state.compare.indexOf(id) > -1;
    qsa('[data-cmp-btn="' + id.replace(/"/g, '') + '"]').forEach(function (b) {
      b.classList.toggle('on', on);
      b.classList.toggle('cmp-on', on);
    });
    renderCompareBar();
    refresh(false);
  }

  function renderCompareBar() {
    var bar = $('compare-bar'), thumbs = $('compare-thumbs');
    if (!state.compare.length) {
      bar.classList.remove('show');
      document.body.classList.remove('compare-open');
      thumbs.innerHTML = '';
      return;
    }
    thumbs.innerHTML = state.compare.map(function (id) {
      var p = S.product(id); if (!p) { return ''; }
      return '<img src="' + U.img(p) + '" title="' + U.esc(p.name) + '" alt="' + U.esc(p.name) + '">';
    }).join('');
    bar.classList.add('show');
    document.body.classList.add('compare-open');
  }

  function doCompare() {
    if (state.compare.length < 2) { toast('برای مقایسه حداقل دو کالا انتخاب کنید.', 'warn'); return; }
    var list = state.compare.map(S.product).filter(Boolean);
    var keys = [];
    list.forEach(function (p) {
      S.specRows(p).forEach(function (r) { if (keys.indexOf(r.key) === -1) { keys.push(r.key); } });
    });
    var rows = keys.map(function (k) {
      var label = '', unit = '';
      list.forEach(function (p) {
        S.specRows(p).forEach(function (r) { if (r.key === k) { label = r.label; unit = r.unit; } });
      });
      return '<tr><th>' + U.esc(label) +
        (unit && unit !== 'IP' ? ' <small style="color:var(--muted)">' + U.esc(unit) + '</small>' : '') + '</th>' +
        list.map(function (p) {
          var found = S.specRows(p).filter(function (r) { return r.key === k; })[0];
          return '<td>' + (found ? U.esc(found.value) : '—') + '</td>';
        }).join('') + '</tr>';
    }).join('');

    $('compare-sheet').innerHTML =
      '<header class="sheet-head">' +
        '<span class="sheet-handle" aria-hidden="true"></span>' +
        '<h2>مقایسه ' + U.fa(list.length) + ' کالا</h2>' +
        '<button class="icon-btn" type="button" data-close="compare-overlay" aria-label="بستن">✕</button>' +
      '</header>' +
      '<div class="sheet-body">' +
        '<div style="overflow-x:auto"><table class="compare-table"><thead><tr><th>مشخصه</th>' +
        list.map(function (p) {
          return '<th><img src="' + U.img(p) + '" alt="' + U.esc(p.name) + '">' +
            '<div style="font-weight:700;font-size:.78rem;margin-top:4px">' + U.esc(p.name) + '</div>' +
            '<div style="font-size:.68rem;color:var(--muted);direction:ltr">' + U.esc(p.sku || '') + '</div></th>';
        }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<div style="display:flex;gap:8px;margin-top:14px">' +
          '<button class="btn btn-sm btn-accent" type="button" id="cmp-pdf">📄 PDF مقایسه</button>' +
          '<button class="btn btn-sm" type="button" data-close="compare-overlay">بستن</button>' +
        '</div>' +
      '</div>';

    openSheet('compare-overlay');
    var b = $('cmp-pdf');
    if (b) { b.addEventListener('click', function () { openPrint(state.compare.join(','), true, 'detail'); }); }
  }

  /* --------------------------------------------------------- خروجی PDF
     mode: 'auto' (پیش‌فرض) | 'compact' | 'detail'
     auto → تک‌کالا یا مقایسه = کامل ؛ کاتالوگ = فشرده                    */
  function openPrint(ids, auto, mode) {
    var idsParam = ids || filtered().map(function (p) { return p.id; }).join(',');
    if (!idsParam) { toast('کالایی برای خروجی وجود ندارد.', 'warn'); return; }

    var per = '1', orient = 'portrait', toc = '1', md = mode || 'auto', src = '';
    try {
      per = localStorage.getItem('hg_pdf_per') || String((S.data.settings || {}).pdfPerPage || 1);
      orient = localStorage.getItem('hg_pdf_orient') || (S.data.settings || {}).pdfOrientation || 'portrait';
      var t = localStorage.getItem('hg_pdf_toc');
      toc = (t === null) ? '1' : t;
      if (!mode) { md = localStorage.getItem('hg_pdf_mode') || 'auto'; }
      if (md === 'auto' && ids && ids === state.compare.join(',')) { src = 'compare'; }
    } catch (e) {}

    var url = 'print.html?ids=' + encodeURIComponent(idsParam) +
      '&per=' + per + '&orient=' + orient + '&toc=' + toc + '&mode=' + md +
      (src ? '&src=' + src : '') + (auto ? '&auto=1' : '');

    var win = null;
    try { win = window.open(url, '_blank'); } catch (e) { win = null; }
    if (!win) {
      // اگر مرورگر پنجره جدید را مسدود کرد، همان صفحه نمای چاپ را نشان می‌دهیم
      toast('پنجره جدید مسدود شد؛ نمای چاپ در همین صفحه باز می‌شود.', 'warn');
      location.href = url;
    }
  }

  function openPdfSheet() {
    var count = filtered().length, s = S.data.settings || {};
    var total = (S.data.products || []).length;

    $('pdf-sheet').innerHTML =
      '<header class="sheet-head">' +
        '<span class="sheet-handle" aria-hidden="true"></span>' +
        '<h2>📄 ساخت خروجی PDF</h2>' +
        '<button class="icon-btn" type="button" data-close="pdf-overlay" aria-label="بستن">✕</button>' +
      '</header>' +
      '<div class="sheet-body">' +
        '<p style="margin:0 0 14px;font-size:.8rem;color:var(--muted)">' +
          'خروجی از داده‌های واقعی کاتالوگ ساخته می‌شود؛ متن فارسی در فایل نهایی قابل جستجو و انتخاب است.' +
        '</p>' +

        '<section class="sec"><h3>دامنه خروجی</h3><div class="chips" id="pdf-scope">' +
          '<button class="chip active" type="button" data-scope="filtered">نتیجه فیلتر فعلی (' + U.fa(count) + ')</button>' +
          '<button class="chip" type="button" data-scope="all">کل کاتالوگ (' + U.fa(total) + ')</button>' +
          (state.cat ? '<button class="chip" type="button" data-scope="cat">دسته «' + U.esc(S.categoryTitle(state.cat)) + '»</button>' : '') +
          (state.compare.length ? '<button class="chip" type="button" data-scope="compare">کالاهای مقایسه (' + U.fa(state.compare.length) + ')</button>' : '') +
        '</div></section>' +

        '<section class="sec"><h3>حالت نمایش</h3>' +
          '<div class="chips" id="pdf-mode">' +
            '<button class="chip active" type="button" data-mode="auto">خودکار (توصیه‌شده)</button>' +
            '<button class="chip" type="button" data-mode="compact">فشرده — برند + نام + کد</button>' +
            '<button class="chip" type="button" data-mode="detail">کامل — توضیحات و مشخصات</button>' +
          '</div>' +
          '<p style="font-size:.74rem;color:var(--muted);margin:8px 0 0">' +
            'خودکار: برای یک کالا یا خروجی مقایسه، حالت «کامل» و برای کاتالوگ، حالت «فشرده» انتخاب می‌شود.' +
          '</p>' +
        '</section>' +

        '<section class="sec"><h3>چیدمان صفحه</h3>' +
          '<div class="chips" id="pdf-layout">' +
            '<button class="chip active" type="button" data-per="1">یک کالا در هر صفحه</button>' +
            '<button class="chip" type="button" data-per="2">دو کالا در هر صفحه</button>' +
          '</div>' +
          '<div class="chips" id="pdf-orient" style="margin-top:8px">' +
            '<button class="chip' + (s.pdfOrientation === 'landscape' ? '' : ' active') + '" type="button" data-orient="portrait">A4 عمودی</button>' +
            '<button class="chip' + (s.pdfOrientation === 'landscape' ? ' active' : '') + '" type="button" data-orient="landscape">A4 افقی</button>' +
          '</div>' +
          '<label style="display:flex;gap:8px;align-items:center;margin-top:12px;font-size:.8rem">' +
            '<input type="checkbox" id="pdf-toc" checked> ساخت صفحه «فهرست مطالب» با شماره صفحه' +
          '</label>' +
        '</section>' +

        '<section class="sec"><h3>ساخت فایل</h3>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<button class="btn btn-accent" type="button" id="pdf-go">📄 ساخت و باز کردن PDF</button>' +
            '<button class="btn" type="button" id="pdf-open-print">🖨️ مشاهده نمای چاپ</button>' +
          '</div>' +
          '<p style="font-size:.76rem;color:var(--muted);margin:10px 0 0">' +
            'پس از باز شدن پنجره چاپ، گزینه «Save as PDF / ذخیره به‌عنوان PDF» را انتخاب کنید و اندازه کاغذ A4 را نگه دارید.' +
          '</p>' +
        '</section>' +
      '</div>';

    openSheet('pdf-overlay');

    // مقادیر ذخیره‌شده را اعمال کن
    try {
      var per = localStorage.getItem('hg_pdf_per');
      if (per === '2') {
        qsa('#pdf-layout .chip').forEach(function (b) {
          b.classList.toggle('active', b.getAttribute('data-per') === '2');
        });
      }
      var t = localStorage.getItem('hg_pdf_toc');
      if (t === '0') { $('pdf-toc').checked = false; }
      var md = localStorage.getItem('hg_pdf_mode') || 'auto';
      qsa('#pdf-mode .chip').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-mode') === md);
      });
    } catch (e) {}

    pdfScope = 'filtered';

    var bindChips = function (sel, onPick) {
      qsa(sel + ' .chip').forEach(function (b) {
        b.addEventListener('click', function () {
          qsa(sel + ' .chip').forEach(function (x) { x.classList.remove('active'); });
          b.classList.add('active');
          onPick(b);
        });
      });
    };
    bindChips('#pdf-scope', function (b) { pdfScope = b.getAttribute('data-scope'); });
    bindChips('#pdf-mode', function (b) {
      try { localStorage.setItem('hg_pdf_mode', b.getAttribute('data-mode')); } catch (e) {}
    });
    bindChips('#pdf-layout', function (b) {
      try { localStorage.setItem('hg_pdf_per', b.getAttribute('data-per')); } catch (e) {}
    });
    bindChips('#pdf-orient', function (b) {
      try { localStorage.setItem('hg_pdf_orient', b.getAttribute('data-orient')); } catch (e) {}
    });
    $('pdf-toc').addEventListener('change', function () {
      try { localStorage.setItem('hg_pdf_toc', this.checked ? '1' : '0'); } catch (e) {}
    });

    function currentIds() {
      if (pdfScope === 'all') { return S.products().map(function (p) { return p.id; }).join(','); }
      if (pdfScope === 'compare') { return state.compare.join(','); }
      if (pdfScope === 'cat') { return S.descendants(state.cat).join(','); }
      return filtered().map(function (p) { return p.id; }).join(',');
    }
    /* در حالت «خودکار»، خروجی مقایسه همیشه کامل (با توضیحات و ویژگی‌ها) است */
    function scopeMode() { return pdfScope === 'compare' ? 'detail' : ''; }

    $('pdf-go').addEventListener('click', function () { openPrint(currentIds(), true, scopeMode()); });
    $('pdf-open-print').addEventListener('click', function () { openPrint(currentIds(), false, scopeMode()); });
  }

  /* ------------------------------------------------------ بازنشانی و خانه */
  function resetFilters() {
    state.q = ''; state.cat = ''; state.brand = ''; state.type = ''; state.avail = '';
    state.specs = {}; state.featured = false; state.favOnly = false; state.sort = 'order';
    var si = $('search-input'); if (si) { si.value = ''; }
    $('search-reset').hidden = true;
    refresh();
  }

  function goHome() {
    resetFilters();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* -------------------------------------------------------- رویدادها */
  function bind() {
    /* --- جستجو --- */
    var search = $('search-input');
    var runSearch = U.debounce(function () {
      state.q = search.value;
      $('search-reset').hidden = !state.q;
      refresh();
    }, 180);
    search.addEventListener('input', runSearch);
    $('search-reset').addEventListener('click', function () {
      search.value = ''; state.q = ''; this.hidden = true; refresh(); search.focus();
    });

    /* --- دکمه‌های بالای صفحه --- */
    $('brand').addEventListener('click', goHome);
    $('btn-filters').addEventListener('click', function () { refresh(false); openSheet('filters-overlay'); });
    $('btn-pdf').addEventListener('click', openPdfSheet);
    $('btn-theme').addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(cur);
    });

    /* --- نوار نتیجه --- */
    $('chip-featured').addEventListener('click', function () {
      state.featured = !state.featured; refresh();
    });
    $('chip-fav').addEventListener('click', function () {
      state.favOnly = !state.favOnly;
      if (state.favOnly && !state.favs.length) { toast('هنوز کالایی به علاقه‌مندی‌ها اضافه نکرده‌اید.', 'warn'); }
      refresh();
    });

    /* --- فوتر --- */
    $('f-pdf').addEventListener('click', openPdfSheet);
    $('f-print').addEventListener('click', function () { openPrint('', false); });

    /* --- نمایش بیشتر --- */
    $('btn-more').addEventListener('click', function () { shown += PAGE; renderGrid(); });

    /* --- دسته‌بندی‌های افقی --- */
    $('cat-chips').addEventListener('click', function (e) {
      var b = closest(e.target, '[data-cat]');
      if (!b) { return; }
      var id = b.getAttribute('data-cat') || '';
      state.cat = (state.cat === id) ? '' : id;
      refresh();
    });

    /* --- نوار برندها --- */
    var brandChips = $('brand-chips');
    if (brandChips) {
      brandChips.addEventListener('click', function (e) {
        var b = closest(e.target, '.bchip');
        if (!b) { return; }
        var val = b.getAttribute('data-brand') || '';
        state.brand = (state.brand === val) ? '' : val;
        refresh();
        if (state.brand) { toast('فقط کالاهای برند <b>' + U.esc(state.brand) + '</b> نمایش داده می‌شود.'); }
      });
    }

    /* --- بدنه فیلترها --- */
    $('filters-body').addEventListener('click', function (e) {
      var tog = closest(e.target, '.ftree-toggle');
      if (tog && !tog.classList.contains('ghost')) {
        var id = tog.getAttribute('data-exp');
        var kids = this.querySelector('[data-kids="' + id + '"]');
        if (kids) {
          var open = kids.classList.toggle('open');
          tog.classList.toggle('open', open);
          expanded[id] = open;
        }
        return;
      }
      var nm = closest(e.target, '.ftree-name');
      if (nm) {
        var cid = nm.getAttribute('data-cat') || '';
        state.cat = (state.cat === cid) ? '' : cid;
        refresh();
        return;
      }
      var sc = closest(e.target, '.spec-chip');
      if (sc) {
        var f = sc.getAttribute('data-field'), v = sc.getAttribute('data-value');
        if (state.specs[f] === v) { delete state.specs[f]; } else { state.specs[f] = v; }
        refresh();
      }
    });
    $('filters-body').addEventListener('change', function (e) {
      var t = e.target;
      if (!t || !t.id) { return; }
      if (t.id === 'filter-brand') { state.brand = t.value; }
      else if (t.id === 'filter-type') { state.type = t.value; }
      else if (t.id === 'filter-avail') { state.avail = t.value; }
      else if (t.id === 'sort-select') { state.sort = t.value; }
      else { return; }
      refresh();
    });

    $('btn-reset-filters').addEventListener('click', resetFilters);
    $('btn-apply-filters').addEventListener('click', function () { closeSheet('filters-overlay'); });

    /* --- مقایسه --- */
    $('btn-do-compare').addEventListener('click', doCompare);
    $('btn-clear-compare').addEventListener('click', function () {
      state.compare = [];
      qsa('[data-cmp-btn]').forEach(function (b) { b.classList.remove('on', 'cmp-on'); });
      renderCompareBar();
      refresh(false);
    });

    /* --- رویدادهای عمومی --- */
    document.addEventListener('click', function (e) {
      var closer = closest(e.target, '[data-close]');
      if (closer) { closeSheet(closer.getAttribute('data-close')); return; }

      if (e.target.classList && e.target.classList.contains('overlay')) { closeSheet(e.target.id); return; }

      var fav = closest(e.target, '[data-fav]');
      if (fav) { e.preventDefault(); toggleFav(fav.getAttribute('data-fav')); return; }

      var cmp = closest(e.target, '[data-cmp-btn]');
      if (cmp) { e.preventDefault(); toggleCompare(cmp.getAttribute('data-cmp-btn')); return; }

      var one = closest(e.target, '[data-pdf-one]');
      if (one) { e.preventDefault(); openPrint(one.getAttribute('data-pdf-one'), true, 'detail'); return; }

      var ct = closest(e.target, '[data-contact]');
      if (ct) {
        var p = S.product(ct.getAttribute('data-contact')), s = S.data.settings || {};
        if (p) {
          toast('📞 استعلام قیمت <b>' + U.esc(p.name) + '</b> (کد <b dir="ltr">' + U.esc(p.sku || '-') +
            '</b>)<br>فروش: <b dir="ltr">' + U.fa(s.phone) + '</b> — پشتیبانی: <b dir="ltr">' + U.fa(s.mobile) + '</b>');
        }
        return;
      }

      var card = closest(e.target, '.card');
      if (card) { openDetail(card.getAttribute('data-id')); return; }

      var reset = closest(e.target, '#empty-reset');
      if (reset) { resetFilters(); }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeAllSheets(); }
      if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('card')) {
        openDetail(e.target.getAttribute('data-id'));
      }
    });

    /* --- نوار پیشرفت و دکمه بالا --- */
    var bar = $('scroll-progress'), top = $('to-top');
    var onScroll = function () {
      var y = window.scrollY || document.documentElement.scrollTop;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (y / h * 100) : 0) + '%';
      top.classList.toggle('show', y > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* --------------------------------------------------------- راه‌اندازی */
  function init() {
    try { state.favs = JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { state.favs = []; }

    S.load().then(function () {
      applySettings();
      renderCatChips();
      renderBrandChips();
      buildFilters();
      bind();
      refresh();
      renderCompareBar();

      if (!(S.data.products || []).length) {
        toast('دیتابیس خالی است. از پنل مدیریت کالا اضافه کنید.', 'warn');
      }
      if (location.hash && location.hash.length > 1) {
        var id = location.hash.slice(1);
        if (S.product(id)) { openDetail(id); }
      }
    }).catch(function (err) {
      toast('خطا در بارگذاری داده‌ها: ' + U.esc(err && err.message ? err.message : 'ناشناخته'), 'err');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

  /* ------------------------------------------------- دسترسی از بیرون */
  HG.app = HG.app || {};
  HG.app.state = state;
  HG.app.toast = toast;
  HG.app.goHome = goHome;
  HG.app.resetFilters = resetFilters;
  HG.app.openDetail = openDetail;
  HG.app.openPrint = openPrint;
  HG.app.openPdfSheet = openPdfSheet;
  HG.app.closeSheet = closeSheet;
  HG.app.doCompare = doCompare;
  HG.app.toggleFav = toggleFav;
})();
