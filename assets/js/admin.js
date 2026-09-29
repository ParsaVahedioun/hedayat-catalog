/* =============================================================================
   هدایت گستر | منطق پنل مدیریت کاتالوگ
   مدیریت کالا، دسته‌بندی، نوع کالا، برند، فیلدهای مشخصات، تنظیمات و پشتیبان‌گیری
============================================================================= */
(function () {
  'use strict';
  var HG = window.HG = window.HG || {};
  var S = HG.store, U = HG.util;
  var $ = function (id) { return document.getElementById(id); };
  var editingId = null;

  /* -------------------------------------------------------------- ابزارها */
  function toast(msg, kind) {
    var wrap = $('toasts'); if (!wrap) { return; }
    var el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.innerHTML = msg;
    wrap.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .4s, transform .4s';
      el.style.opacity = '0'; el.style.transform = 'translateX(26px)';
      setTimeout(function () { el.remove(); }, 420);
    }, 3200);
  }

  /* رمز ساده (بدون سرور). هش سبک برای اینکه رمز به‌صورت متن ساده ذخیره نشود. */
  function hash(str) {
    var h = 5381, i;
    str = String(str || '');
    for (i = 0; i < str.length; i++) { h = ((h << 5) + h) ^ str.charCodeAt(i); }
    return 'h' + (h >>> 0).toString(16);
  }

  function openOverlay(id) { $(id).classList.add('open'); }
  function closeOverlay(id) { $(id).classList.remove('open'); }

  var confirmCb = null;
  function askConfirm(title, msg, cb) {
    $('confirm-title').textContent = title;
    $('confirm-msg').innerHTML = msg;
    confirmCb = cb;
    openOverlay('confirm-overlay');
  }
  $('confirm-yes').addEventListener('click', function () {
    closeOverlay('confirm-overlay');
    var cb = confirmCb; confirmCb = null;
    if (typeof cb === 'function') { cb(); }
  });

  function showText(title, help, text, filename) {
    $('text-title').textContent = title;
    $('text-help').innerHTML = help || '';
    $('text-area').value = text;
    $('text-overlay').setAttribute('data-file', filename || 'export.txt');
    openOverlay('text-overlay');
  }
  $('text-copy').addEventListener('click', function () {
    var ta = $('text-area');
    ta.select();
    try {
      if (navigator.clipboard) { navigator.clipboard.writeText(ta.value); } else { document.execCommand('copy'); }
      toast('متن در حافظه کپی شد. می‌توانید آن را در فایل <b>data/seed-products.js</b> بچسبانید.');
    } catch (e) { toast('کپی خودکار ممکن نشد؛ متن را دستی انتخاب و کپی کنید.', 'warn'); }
  });
  $('text-download').addEventListener('click', function () {
    download($('text-overlay').getAttribute('data-file'), $('text-area').value, 'text/plain;charset=utf-8');
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-close]'), function (b) {
    b.addEventListener('click', function () { closeOverlay(b.getAttribute('data-close')); });
  });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      ['preview-overlay', 'confirm-overlay', 'text-overlay'].forEach(closeOverlay);
    }
  });

  function download(filename, content, mime) {
    var blob = new Blob(['\ufeff' + content], { type: mime || 'application/json;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* --------------------------------------------------------------- ورود */
  var SESSION_KEY = 'hg_admin_session';
  function currentHash() {
    var h = S.data.settings.adminPasswordHash;
    return h || hash('hg1404');   // رمز پیش‌فرض
  }
  function tryLogin(pass) {
    if (hash(pass) === currentHash()) {
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) {}
      showApp();
      return true;
    }
    return false;
  }
  function showApp() {
    $('login-gate').hidden = true;
    $('admin-app').hidden = false;
    renderAll();
  }

  $('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!tryLogin($('login-pass').value)) {
      toast('رمز وارد‌شده نادرست است.', 'err');
    }
  });
  $('btn-logout').addEventListener('click', function () {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    location.reload();
  });

  /* ----------------------------------------------------------- تب‌ها */
  function switchTab(name) {
    Array.prototype.forEach.call(document.querySelectorAll('.tab-page'), function (p) { p.classList.remove('active'); });
    Array.prototype.forEach.call(document.querySelectorAll('#admin-nav button'), function (b) { b.classList.remove('active'); });
    var page = $('page-' + name);
    if (page) { page.classList.add('active'); }
    var btn = document.querySelector('#admin-nav button[data-tab="' + name + '"]');
    if (btn) { btn.classList.add('active'); }
    if (name !== 'editor') { $('nav-editor').hidden = true; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  Array.prototype.forEach.call(document.querySelectorAll('#admin-nav button'), function (b) {
    b.addEventListener('click', function () { switchTab(b.getAttribute('data-tab')); });
  });

  /* ------------------------------------------------------------ داشبورد */
  function renderDash() {
    var prods = S.data.products || [];
    var noImg = prods.filter(function (p) { return !(p.images || []).length; }).length;
    var featured = prods.filter(function (p) { return p.featured; }).length;
    var availIn = prods.filter(function (p) { return (p.availability || 'in') === 'in'; }).length;

    $('dash-stats').innerHTML =
      '<div class="stat-card"><b>' + U.fa(prods.length) + '</b><span>کل کالاها</span></div>' +
      '<div class="stat-card"><b>' + U.fa((S.data.categories || []).length) + '</b><span>دسته‌بندی</span></div>' +
      '<div class="stat-card"><b>' + U.fa((S.data.types || []).length) + '</b><span>نوع کالا</span></div>' +
      '<div class="stat-card"><b>' + U.fa((S.data.brands || []).length) + '</b><span>برند</span></div>' +
      '<div class="stat-card"><b>' + U.fa((S.data.fields || []).length) + '</b><span>فیلد مشخصات فنی</span></div>' +
      '<div class="stat-card"><b>' + U.fa(featured) + '</b><span>کالای ویژه</span></div>' +
      '<div class="stat-card"><b>' + U.fa(noImg) + '</b><span>کالا بدون تصویر</span></div>' +
      '<div class="stat-card"><b>' + U.fa(availIn) + '</b><span>موجود در انبار</span></div>';

    var recent = prods.slice().sort(function (a, b) {
      return String(b.createdAt).localeCompare(String(a.createdAt));
    }).slice(0, 8);

    $('dash-recent').innerHTML = '<table class="admin"><thead><tr>' +
      '<th>تصویر</th><th>نام کالا</th><th>کد</th><th>دسته‌بندی</th><th>تاریخ ثبت</th><th>عملیات</th></tr></thead><tbody>' +
      (recent.length ? recent.map(function (p) {
        return '<tr><td><img class="thumb" src="' + U.img(p) + '" alt=""></td>' +
          '<td>' + U.esc(p.name) + '</td>' +
          '<td style="direction:ltr">' + U.esc(p.sku || '-') + '</td>' +
          '<td>' + U.esc(S.categoryTitle(p.categoryId)) + '</td>' +
          '<td>' + U.fa(p.createdAt || '-') + '</td>' +
          '<td><button class="btn btn-sm" data-edit="' + p.id + '">✏️ ویرایش</button></td></tr>';
      }).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--soft)">هنوز کالایی ثبت نشده است.</td></tr>') +
      '</tbody></table>';

    $('hdr-storage').textContent = ({
      indexeddb: '💾 دیتابیس مرورگر (IndexedDB)',
      localStorage: '💾 حافظه محلی',
      memory: '⚠️ حافظه موقت'
    })[S.storageMode] || '';
    $('hdr-logo').textContent = S.data.settings.logoText || 'HG';
    $('hdr-title').textContent = 'پنل مدیریت کاتالوگ — ' + S.data.settings.brandFa;

    $('backup-status').innerHTML =
      'محل ذخیره داده فعلی: <b>' + ({
        indexeddb: 'IndexedDB مرورگر (پایدار)',
        localStorage: 'localStorage مرورگر',
        memory: 'حافظه موقت — با بستن مرورگر پاک می‌شود'
      })[S.storageMode] + '</b><br>' +
      'آخرین ذخیره‌سازی: ' + U.fa(String(S.data.updatedAt || '').slice(0, 19).replace('T', ' ')) + '<br>' +
      'تعداد کالا: ' + U.fa(prods.length) + ' • دسته‌بندی: ' + U.fa((S.data.categories || []).length) +
      ' • فیلد مشخصات: ' + U.fa((S.data.fields || []).length) + '<br>' +
      (S.supportsIdb
        ? '✅ حالت اجرا: روی وب‌سرور — ظرفیت ذخیره‌سازی بالا (IndexedDB فعال)'
        : 'ℹ️ حالت اجرا: فایل محلی (file://) — داده در localStorage با ظرفیت محدود ذخیره می‌شود. ' +
          'برای ظرفیت بیشتر و استفاده چند کاربره، کاتالوگ را روی هاست یا یک وب‌سرور ساده اجرا کنید.');
  }

  /* -------------------------------------------------------- جدول کالاها */
  function prodCatOptions(selected) {
    var cats = (S.data.categories || []).slice().sort(function (a, b) {
      return S.categoryPath(a.id).localeCompare(S.categoryPath(b.id), 'fa');
    });
    return '<option value="">همه دسته‌بندی‌ها</option>' + cats.map(function (c) {
      return '<option value="' + c.id + '"' + (c.id === selected ? ' selected' : '') + '>' +
        S.categoryPath(c.id) + '</option>';
    }).join('');
  }

  var AV = { in: 'موجود', order: 'قابل سفارش', out: 'ناموجود' };

  function renderProducts() {
    var q = ($('prod-search').value || '').trim().toLowerCase();
    var cat = $('prod-cat-filter').value;
    var catIds = cat ? S.descendants(cat) : null;
    var list = S.products().filter(function (p) {
      if (catIds && catIds.indexOf(p.categoryId) === -1) { return false; }
      if (!q) { return true; }
      return [p.name, p.sku, p.brand, S.categoryPath(p.categoryId)].join(' ').toLowerCase().indexOf(q) > -1;
    });

    $('prod-table').innerHTML = '<table class="admin"><thead><tr>' +
      '<th>تصویر</th><th>نام کالا</th><th>کد کالا</th><th>دسته‌بندی</th><th>نوع کالا</th><th>برند</th>' +
      '<th>وضعیت</th><th>ترتیب</th><th>عملیات</th></tr></thead><tbody>' +
      (list.length ? list.map(function (p) {
        var av = p.availability || 'in';
        return '<tr>' +
          '<td><img class="thumb" src="' + U.img(p) + '" alt=""></td>' +
          '<td>' + U.esc(p.name) + (p.featured ? ' <span class="pill">ویژه</span>' : '') + '</td>' +
          '<td style="direction:ltr">' + U.esc(p.sku || '-') + '</td>' +
          '<td>' + U.esc(S.categoryTitle(p.categoryId)) + '</td>' +
          '<td>' + U.esc(S.typeTitle(p.typeId) || '-') + '</td>' +
          '<td>' + U.esc(p.brand || '-') + '</td>' +
          '<td><span class="pill ' + (av === 'in' ? 'ok' : (av === 'out' ? 'bad' : '')) + '">' + AV[av] + '</span></td>' +
          '<td>' + U.fa(p.order || 0) + '</td>' +
          '<td style="white-space:nowrap">' +
            '<button class="btn btn-sm" data-edit="' + p.id + '" title="ویرایش">✏️</button>' +
            '<button class="btn btn-sm" data-copy="' + p.id + '" title="کپی کالا">📑</button>' +
            '<button class="btn btn-sm" data-up="' + p.id + '" title="بالا">⬆️</button>' +
            '<button class="btn btn-sm" data-down="' + p.id + '" title="پایین">⬇️</button>' +
            '<button class="btn btn-sm btn-danger" data-del="' + p.id + '" title="حذف">🗑️</button>' +
          '</td></tr>';
      }).join('') : '<tr><td colspan="9" style="text-align:center;color:var(--soft)">کالایی مطابق فیلتر یافت نشد.</td></tr>') +
      '</tbody></table>';
  }

  function moveProduct(id, dir) {
    var list = S.products(), i = -1, k;
    for (k = 0; k < list.length; k++) { if (list[k].id === id) { i = k; break; } }
    if (i < 0) { return; }
    var j = i + dir;
    if (j < 0 || j >= list.length) { return; }
    var tmp = list[i].order;
    list[i].order = list[j].order;
    list[j].order = tmp;
    S.save().then(function () { renderProducts(); toast('ترتیب نمایش به‌روز شد.'); });
  }

  /* -------------------------------------------------------- فرم کالا */
  var draft = null;

  function newProduct() {
    editingId = null;
    draft = {
      id: '', sku: '', name: '', nameEn: '', brand: '', categoryId: '', typeId: '',
      tags: [], featured: false, isNew: true, availability: 'in', price: 0,
      summary: '', description: '', features: [], specs: {}, extraSpecs: [],
      images: [], video: '', datasheet: '', order: (S.data.products.length + 1),
      createdAt: '', views: 0
    };
    fillForm(draft);
    $('nav-editor').hidden = false;
    switchTab('editor');
    toast('فرم کالای جدید آماده است. اطلاعات را وارد و ذخیره کنید.');
  }

  function editProduct(id) {
    var p = S.product(id);
    if (!p) { return; }
    editingId = id;
    draft = U.clone(p);
    fillForm(draft);
    $('nav-editor').hidden = false;
    switchTab('editor');
  }

  function fillForm(p) {
    $('f-name').value = p.name || '';
    $('f-nameEn').value = p.nameEn || '';
    $('f-sku').value = p.sku || '';
    $('f-order').value = p.order || 0;
    $('f-price').value = p.price || 0;
    $('f-tags').value = (p.tags || []).join('، ');
    $('f-featured').checked = !!p.featured;
    $('f-isNew').checked = !!p.isNew;
    $('f-availability').value = p.availability || 'in';
    $('f-summary').value = p.summary || '';
    $('f-description').value = p.description || '';
    $('f-video').value = p.video || '';
    $('f-datasheet').value = p.datasheet || '';

    $('f-categoryId').innerHTML = '<option value="">— انتخاب دسته‌بندی —</option>' +
      (S.data.categories || []).slice().sort(function (a, b) {
        return S.categoryPath(a.id).localeCompare(S.categoryPath(b.id), 'fa');
      }).map(function (c) {
        return '<option value="' + c.id + '"' + (c.id === p.categoryId ? ' selected' : '') + '>' +
          S.categoryPath(c.id) + '</option>';
      }).join('');

    $('f-brand').innerHTML = '<option value="">— بدون برند —</option>' + (S.data.brands || []).map(function (b) {
      return '<option value="' + U.esc(b) + '"' + (b === p.brand ? ' selected' : '') + '>' + U.esc(b) + '</option>';
    }).join('');

    refreshTypeOptions(p.typeId);
    renderImages();
    renderFeatRows();
    renderSpecRows();
    $('btn-delete-current').style.display = editingId ? '' : 'none';
  }

  /* نوع کالا بر اساس دسته انتخاب‌شده فیلتر می‌شود؛ اگر نوعی به دسته‌ای محدود نشده باشد، همه‌جا دیده می‌شود */
  function refreshTypeOptions(selected) {
    var catId = $('f-categoryId').value;
    var list = (S.data.types || []).filter(function (t) {
      if (!t.cats || !t.cats.length) { return true; }
      var chain = catId ? S.descendants(catId) : [];
      if (catId) { chain.push(catId); }
      return t.cats.some(function (c) { return chain.indexOf(c) > -1; });
    });
    var hasSel = list.some(function (t) { return t.id === selected; });
    $('f-typeId').innerHTML = '<option value="">— بدون نوع —</option>' + list.map(function (t) {
      return '<option value="' + t.id + '"' + (t.id === selected ? ' selected' : '') + '>' + U.esc(t.title) + '</option>';
    }).join('') + (selected && !hasSel ? '<option value="' + selected + '" selected>' + U.esc(S.typeTitle(selected)) + ' (خارج از دسته)</option>' : '');
  }

  /* ------------------------------------------------------------ تصاویر */
  function renderImages() {
    $('img-thumbs').innerHTML = (draft.images || []).map(function (src, i) {
      return '<div class="thumb-edit"><img src="' + U.esc(U.asset(src)) + '" alt="">' +
        (i === 0 ? '<span class="pill" style="position:absolute;bottom:3px;right:3px">اصلی</span>' : '') +
        '<button type="button" data-rmimg="' + i + '" title="حذف تصویر">✕</button></div>';
    }).join('') || '<span style="color:var(--soft);font-size:.84rem">تصویری ثبت نشده است؛ کاتالوگ از تصویر گرافیکی خودکار استفاده می‌کند.</span>';
  }

  function addImages(files) {
    var list = Array.prototype.slice.call(files);
    if (!list.length) { return; }
    var done = 0;
    list.forEach(function (file) {
      if (!/^image\//.test(file.type)) { done++; return; }
      var reader = new FileReader();
      reader.onload = function () {
        compressImage(reader.result, function (dataUrl) {
          draft.images = draft.images || [];
          draft.images.push(dataUrl);
          if (++done === list.length) {
            renderImages();
            toast(U.fa(list.length) + ' تصویر افزوده شد (فشرده‌شده).');
          }
        });
      };
      reader.onerror = function () { if (++done === list.length) { renderImages(); } };
      reader.readAsDataURL(file);
    });
  }

  /* فشرده‌سازی تصویر تا عرض ۱۲۸۰ پیکسل و کیفیت ۰.۸۲ برای کم‌حجم ماندن کاتالوگ */
  function compressImage(dataUrl, cb) {
    var img = new Image();
    img.onload = function () {
      var maxW = 1280;
      var scale = img.width > maxW ? maxW / img.width : 1;
      var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      var cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      try { cb(cv.toDataURL('image/jpeg', 0.82)); } catch (e) { cb(dataUrl); }
    };
    img.onerror = function () { cb(dataUrl); };
    img.src = dataUrl;
  }

  /* --------------------------------------------------- ویژگی‌ها و مشخصات */
  function renderFeatRows() {
    var list = draft.features || [];
    if (!list.length) { list = ['']; draft.features = list; }
    $('feat-rows').innerHTML = list.map(function (f, i) {
      return '<div class="feat-row">' +
        '<input data-feat="' + i + '" value="' + U.esc(f) + '" placeholder="مثال: گارانتی ۲۴ ماه">' +
        '<button type="button" class="btn btn-sm btn-danger" data-rmfeat="' + i + '">✕</button></div>';
    }).join('');
  }

  function renderSpecRows() {
    var html = (S.data.fields || []).map(function (f) {
      var v = (draft.specs || {})[f.key];
      v = (v == null ? '' : String(v));
      var input;
      if (f.type === 'select' && (f.options || []).length) {
        input = '<select data-spec="' + f.key + '"><option value="">—</option>' +
          (f.options || []).map(function (o) {
            return '<option value="' + U.esc(o) + '"' + (String(o) === v ? ' selected' : '') + '>' + U.esc(o) + '</option>';
          }).join('') + '</select>';
      } else {
        input = '<input data-spec="' + f.key + '" ' + (f.type === 'number' ? 'type="number"' : '') +
          ' value="' + U.esc(v) + '">';
      }
      return '<div class="spec-row">' +
        '<span style="font-size:.86rem;color:var(--soft)">' + U.esc(f.label) +
          (f.unit ? ' <small>(' + U.esc(f.unit) + ')</small>' : '') + '</span>' +
        input +
        '<span style="font-size:.8rem;color:var(--soft)">' + U.esc(f.group || '') + '</span>' +
        '<span></span></div>';
    }).join('');

    html += (draft.extraSpecs || []).map(function (x, i) {
      return '<div class="spec-row">' +
        '<input data-xs-lab="' + i + '" value="' + U.esc(x.label || '') + '" placeholder="عنوان مشخصه (مثلاً سرپیچ)">' +
        '<input data-xs-val="' + i + '" value="' + U.esc(x.value || '') + '" placeholder="مقدار (مثلاً E27)">' +
        '<span></span>' +
        '<button type="button" class="btn btn-sm btn-danger" data-rmx="' + i + '">✕</button></div>';
    }).join('');

    html += '<button type="button" class="btn btn-sm" id="btn-add-x" style="margin-top:6px">➕ مشخصه دلخواه (خارج از فیلدهای استاندارد)</button>';
    $('spec-rows').innerHTML = html;
    $('btn-add-x').addEventListener('click', function () {
      draft.extraSpecs = syncExtra();
      draft.extraSpecs.push({ label: '', value: '' });
      renderSpecRows();
    });
  }

  /* خواندن ردیف‌های مشخصه دلخواه از فرم */
  function syncExtra() {
    var out = [], i = 0, lab, val;
    while (true) {
      lab = document.querySelector('[data-xs-lab="' + i + '"]');
      val = document.querySelector('[data-xs-val="' + i + '"]');
      if (!lab && !val) { break; }
      var l = lab ? lab.value.trim() : '', v = val ? val.value.trim() : '';
      if (l || v) { out.push({ label: l, value: v }); }
      i++;
    }
    return out;
  }

  /* ------------------------------------------------- خواندن و ذخیره فرم */
  function collectForm() {
    var p = U.clone(draft);
    p.name = $('f-name').value.trim();
    p.nameEn = $('f-nameEn').value.trim();
    p.sku = $('f-sku').value.trim();
    p.categoryId = $('f-categoryId').value;
    p.typeId = $('f-typeId').value;
    p.brand = $('f-brand').value;
    p.availability = $('f-availability').value;
    p.order = Number($('f-order').value) || 0;
    p.price = Number($('f-price').value) || 0;
    p.tags = $('f-tags').value.split(/[،,]/).map(function (s) { return s.trim(); }).filter(Boolean);
    p.featured = $('f-featured').checked;
    p.isNew = $('f-isNew').checked;
    p.summary = $('f-summary').value.trim();
    p.description = $('f-description').value.trim();
    p.video = $('f-video').value.trim();
    p.datasheet = $('f-datasheet').value.trim();

    p.features = Array.prototype.slice.call(document.querySelectorAll('[data-feat]'))
      .map(function (el) { return el.value.trim(); }).filter(Boolean);

    p.specs = {};
    Array.prototype.forEach.call(document.querySelectorAll('[data-spec]'), function (el) {
      var v = el.value.trim();
      if (v) { p.specs[el.getAttribute('data-spec')] = v; }
    });

    p.extraSpecs = syncExtra();
    p.images = (draft.images || []).slice();
    return p;
  }

  function saveProduct() {
    var p = collectForm();
    if (!p.name) { toast('نام کالا الزامی است.', 'err'); return; }
    if (!p.categoryId) { toast('دسته‌بندی را انتخاب کنید.', 'err'); return; }
    if (editingId) { p.id = editingId; }
    S.upsertProduct(p).then(function (saved) {
      editingId = saved.id;
      $('nav-editor').hidden = false;
      renderAll();
      toast('کالای «' + U.esc(saved.name) + '» ذخیره شد.');
      if (S.storageMode === 'memory') {
        toast('⚠️ حجم ذخیره‌سازی مرورگر پر شده است. تصاویر کمتری استفاده کنید یا داده را با فایل JSON پشتیبان <b>خروجی</b> بگیرید.', 'err');
      }
      switchTab('products');
    });
  }

  /* -------------------------------------------------------- دسته‌بندی‌ها */
  function catSelectOptions(selected, excludeId) {
    var out = '<option value="">— دسته اصلی (بدون والد) —</option>';
    (S.data.categories || []).forEach(function (c) {
      if (excludeId && (c.id === excludeId || S.descendants(excludeId).indexOf(c.id) > -1)) { return; }
      out += '<option value="' + c.id + '"' + (c.id === selected ? ' selected' : '') + '>' +
        S.categoryPath(c.id) + '</option>';
    });
    return out;
  }

  function renderCategories() {
    $('cat-parent').innerHTML = catSelectOptions('');
    var cats = (S.data.categories || []).slice().sort(function (a, b) {
      return S.categoryPath(a.id).localeCompare(S.categoryPath(b.id), 'fa');
    });
    $('cat-list').innerHTML = cats.map(function (c) {
      var count = (S.data.products || []).filter(function (p) { return p.categoryId === c.id; }).length;
      var depth = 0, cur = c;
      while (cur && cur.parentId) { depth++; cur = S.category(cur.parentId); }
      return '<div class="cat-row" style="margin-inline-start:' + (depth * 22) + 'px">' +
        '<span class="nm">' + (c.icon || '') + ' ' + U.esc(c.title) +
          ' <span class="pill">' + U.fa(count) + ' کالا</span></span>' +
        '<div class="row-actions">' +
          '<button class="btn btn-sm" data-cat-ren="' + c.id + '">✏️ تغییر نام</button>' +
          '<button class="btn btn-sm" data-cat-move="' + c.id + '">↔️ جابه‌جایی</button>' +
          '<button class="btn btn-sm btn-danger" data-cat-del="' + c.id + '">🗑️</button>' +
        '</div></div>';
    }).join('');
  }

  function addCategory() {
    var title = $('cat-title').value.trim();
    if (!title) { toast('عنوان دسته را وارد کنید.', 'err'); return; }
    S.addCategory({
      title: title, parentId: $('cat-parent').value || null,
      icon: $('cat-icon').value.trim(), depth: 0, builtin: false
    }).then(function () {
      $('cat-title').value = ''; $('cat-icon').value = '';
      renderCategories(); renderDash();
      toast('دسته‌بندی «' + U.esc(title) + '» افزوده شد.');
    });
  }

  /* ------------------------------------------------------------- انواع کالا */
  function renderTypes() {
    $('type-cats').innerHTML = (S.data.categories || []).map(function (c) {
      return '<option value="' + c.id + '">' + S.categoryPath(c.id) + '</option>';
    }).join('');

    $('type-table').innerHTML = '<table class="admin"><thead><tr>' +
      '<th>عنوان نوع</th><th>دسته‌های مرتبط</th><th>تعداد کالا</th><th>عملیات</th></tr></thead><tbody>' +
      ((S.data.types || []).length ? S.data.types.map(function (t) {
        var cats = (t.cats || []).length ? (t.cats || []).map(function (id) { return S.categoryTitle(id); }).join('، ') : 'همه دسته‌ها';
        var used = (S.data.products || []).filter(function (p) { return p.typeId === t.id; }).length;
        return '<tr><td>' + U.esc(t.title) + '</td><td>' + U.esc(cats) + '</td>' +
          '<td>' + U.fa(used) + '</td>' +
          '<td><button class="btn btn-sm btn-danger" data-type-del="' + t.id + '">🗑️ حذف</button></td></tr>';
      }).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--soft)">نوعی ثبت نشده است.</td></tr>') +
      '</tbody></table>';
  }

  function addType() {
    var title = $('type-title').value.trim();
    if (!title) { toast('عنوان نوع کالا را وارد کنید.', 'err'); return; }
    var cats = Array.prototype.slice.call($('type-cats').selectedOptions).map(function (o) { return o.value; });
    S.addType({ title: title, cats: cats }).then(function () {
      $('type-title').value = '';
      Array.prototype.slice.call($('type-cats').options).forEach(function (o) { o.selected = false; });
      renderTypes(); renderDash();
      toast('نوع کالای «' + U.esc(title) + '» افزوده شد.');
    });
  }

  /* ---------------------------------------------------------------- برندها */
  function renderBrands() {
    $('brand-list').innerHTML = (S.data.brands || []).map(function (b) {
      var used = (S.data.products || []).filter(function (p) { return p.brand === b; }).length;
      return '<span class="chip-item">' + U.esc(b) + ' <small>(' + U.fa(used) + ')</small>' +
        '<button data-brand-del="' + U.esc(b) + '" title="حذف">✕</button></span>';
    }).join('') || '<span style="color:var(--soft);font-size:.86rem">برندی ثبت نشده است.</span>';
  }

  /* -------------------------------------------------- فیلدهای مشخصات فنی */
  function renderFields() {
    $('field-table').innerHTML = '<table class="admin"><thead><tr>' +
      '<th>عنوان</th><th>کلید</th><th>واحد</th><th>نوع</th><th>گروه</th><th>فیلتر کاتالوگ</th><th>عملیات</th></tr></thead><tbody>' +
      ((S.data.fields || []).length ? S.data.fields.map(function (f) {
        return '<tr><td>' + U.esc(f.label) + '</td>' +
          '<td style="direction:ltr">' + U.esc(f.key) + '</td>' +
          '<td>' + U.esc(f.unit || '-') + '</td>' +
          '<td>' + ({ text: 'متنی', number: 'عددی', select: 'انتخابی' })[f.type] + '</td>' +
          '<td>' + U.esc(f.group || '-') + '</td>' +
          '<td>' + (f.filter ? '<span class="pill ok">فعال</span>' : '<span class="pill">غیرفعال</span>') + '</td>' +
          '<td><button class="btn btn-sm btn-danger" data-field-del="' + f.key + '">🗑️ حذف</button></td></tr>';
      }).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--soft)">فیلدی ثبت نشده است.</td></tr>') +
      '</tbody></table>';
  }

  function addField() {
    var label = $('fld-label').value.trim();
    if (!label) { toast('عنوان فیلد را وارد کنید.', 'err'); return; }
    var key = $('fld-key').value.trim().replace(/[^a-zA-Z0-9-_]/g, '');
    if (!key) { key = 'f' + Date.now().toString(36); }
    if ((S.data.fields || []).some(function (f) { return f.key === key; })) {
      toast('این کلید قبلاً استفاده شده است.', 'err'); return;
    }
    var opts = $('fld-options').value.split(/[،,]/).map(function (s) { return s.trim(); }).filter(Boolean);
    S.addField({
      key: key, label: label, unit: $('fld-unit').value.trim(),
      type: $('fld-type').value, options: opts,
      filter: $('fld-filter').checked, group: $('fld-group').value.trim() || 'سایر'
    }).then(function () {
      ['fld-label', 'fld-key', 'fld-unit', 'fld-options', 'fld-group'].forEach(function (id) { $(id).value = ''; });
      $('fld-filter').checked = false;
      renderFields(); renderDash();
      toast('فیلد «' + U.esc(label) + '» به مشخصات فنی افزوده شد.');
    });
  }

  /* ------------------------------------------------------------ تنظیمات */
  function loadSettingsForm() {
    var s = S.data.settings;
    ['brandFa', 'brandEn', 'slogan', 'logoText', 'phone', 'mobile', 'email', 'site', 'address',
      'instagram', 'catalogTitle', 'catalogSubtitle', 'priceLabel'].forEach(function (k) {
        var el = $('s-' + k); if (el) { el.value = s[k] || ''; }
      });
    $('s-themePrimary').value = s.themePrimary || '#0B3D91';
    $('s-themeAccent').value = s.themeAccent || '#F5A623';
    $('s-pdfOrientation').value = s.pdfOrientation || 'portrait';
    $('s-showPrices').checked = !!s.showPrices;
  }

  function saveSettings() {
    var s = S.data.settings;
    ['brandFa', 'brandEn', 'slogan', 'logoText', 'phone', 'mobile', 'email', 'site', 'address',
      'instagram', 'catalogTitle', 'catalogSubtitle', 'priceLabel'].forEach(function (k) {
        var el = $('s-' + k); if (el) { s[k] = el.value.trim(); }
      });
    s.themePrimary = $('s-themePrimary').value;
    s.themeAccent = $('s-themeAccent').value;
    s.pdfOrientation = $('s-pdfOrientation').value;
    s.showPrices = $('s-showPrices').checked;

    var p1 = $('s-pass1').value, p2 = $('s-pass2').value;
    if (p1 || p2) {
      if (p1 !== p2) { toast('رمز جدید و تکرار آن یکسان نیست.', 'err'); return; }
      if (p1.length < 4) { toast('رمز باید حداقل ۴ کاراکتر باشد.', 'err'); return; }
      s.adminPasswordHash = hash(p1);
      $('s-pass1').value = ''; $('s-pass2').value = '';
    }
    S.save().then(function () {
      renderDash();
      toast('تنظیمات ذخیره شد.');
    });
  }

  /* -------------------------------------------------- پشتیبان‌گیری CSV/JSON */
  function csvCell(v) {
    v = (v == null ? '' : String(v));
    return '"' + v.replace(/"/g, '""') + '"';
  }

  function exportCSV() {
    var cols = ['sku', 'name', 'nameEn', 'brand', 'categoryId', 'typeId', 'availability', 'price',
      'order', 'featured', 'isNew', 'tags', 'features', 'specs', 'summary', 'description'];
    var rows = [cols.map(csvCell).join(',')];
    S.products().forEach(function (p) {
      var vals = {
        sku: p.sku || '', name: p.name || '', nameEn: p.nameEn || '', brand: p.brand || '',
        categoryId: p.categoryId || '', typeId: p.typeId || '', availability: p.availability || 'in',
        price: p.price || 0, order: p.order || 0, featured: p.featured ? 1 : 0, isNew: p.isNew ? 1 : 0,
        tags: (p.tags || []).join('|'), features: (p.features || []).join('|'),
        specs: Object.keys(p.specs || {}).map(function (k) { return k + '=' + p.specs[k]; }).join('|'),
        summary: p.summary || '', description: p.description || ''
      };
      rows.push(cols.map(function (c) { return csvCell(vals[c]); }).join(','));
    });
    download('hedayat-catalog-products.csv', rows.join('\r\n'), 'text/csv;charset=utf-8');
    toast('فایل CSV ساخته شد (قابل باز کردن در اکسل).');
  }

  function parseCSV(text) {
    var rows = [], row = [], cell = '', inQ = false, i, ch;
    text = String(text).replace(/^\ufeff/, '');
    for (i = 0; i < text.length; i++) {
      ch = text[i];
      if (inQ) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; } else { inQ = false; }
        } else { cell += ch; }
      } else if (ch === '"') { inQ = true; }
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else if (ch !== '\r') { cell += ch; }
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  function importCSV(text) {
    var rows = parseCSV(text);
    if (rows.length < 2) { toast('فایل CSV خالی است.', 'err'); return; }
    var head = rows[0].map(function (h) { return h.trim(); });
    var added = 0;
    rows.slice(1).forEach(function (r) {
      if (!r.length || !String(r[0] || '').trim() && !String(r[1] || '').trim()) { return; }
      var o = {};
      head.forEach(function (h, i) { o[h] = (r[i] || '').trim(); });
      if (!o.name) { return; }
      var p = {
        sku: o.sku || '', name: o.name, nameEn: o.nameEn || '', brand: o.brand || '',
        categoryId: o.categoryId || '', typeId: o.typeId || '',
        availability: o.availability || 'in', price: Number(o.price) || 0,
        order: Number(o.order) || (S.data.products.length + added + 1),
        featured: o.featured === '1', isNew: o.isNew === '1',
        tags: (o.tags || '').split('|').filter(Boolean),
        features: (o.features || '').split('|').filter(Boolean),
        specs: {}, extraSpecs: [], images: [],
        summary: o.summary || '', description: o.description || '',
        video: '', datasheet: '', createdAt: new Date().toLocaleDateString('fa-IR'), views: 0
      };
      (o.specs || '').split('|').forEach(function (kv) {
        var idx = kv.indexOf('=');
        if (idx > 0) { p.specs[kv.slice(0, idx).trim()] = kv.slice(idx + 1).trim(); }
      });
      S.data.products.push(p);
      added++;
    });
    S.save().then(function () {
      renderAll();
      toast(U.fa(added) + ' کالا از فایل CSV افزوده شد.');
    });
  }

  function exportJSON() {
    var data = U.clone(S.data);
    download('hedayat-catalog-backup-' + new Date().toISOString().slice(0, 10) + '.json',
      JSON.stringify(data, null, 2), 'application/json;charset=utf-8');
    toast('فایل پشتیبان JSON ساخته شد.');
  }

  function makeSeed() {
    var data = U.clone(S.data);
    var text = '/* ============================================================================\n' +
      '   هدایت گستر | داده تولیدشده از پنل مدیریت — تاریخ: ' + new Date().toLocaleString('fa-IR') + '\n' +
      '   این فایل را می‌توانید به‌عنوان data/seed-products.js استفاده کنید یا\n' +
      '   بعد از seed.js در صفحات include کنید تا کاتالوگ با همین داده بالا بیاید.\n' +
      '============================================================================ */\n' +
      '(function () {\n  var D = ' + JSON.stringify({
        settings: data.settings, fields: data.fields, categories: data.categories,
        types: data.types, brands: data.brands, products: data.products
      }, null, 2) + ';\n' +
      '  window.HG_SEED = window.HG_SEED || {};\n' +
      '  Object.keys(D).forEach(function (k) { window.HG_SEED[k] = D[k]; });\n' +
      '  window.HG_SEED.products = D.products;\n' +
      '})();\n';
    showText('فایل seed تولیدشده',
      'این متن را در فایل <b>data/seed-products.js</b> جایگزین کنید یا با نام دیگری ذخیره و بعد از <code>seed.js</code> در صفحات اضافه کنید.',
      text, 'seed-products.js');
  }

  /* --------------------------------------------------------- رویدادها */
  function bindEvents() {
    /* ---- ناوبری و دکمه‌های اصلی ---- */
    $('btn-new-product').addEventListener('click', newProduct);
    $('btn-new-product-2').addEventListener('click', newProduct);
    $('btn-add-cat').addEventListener('click', addCategory);
    $('btn-add-type').addEventListener('click', addType);
    $('btn-add-field').addEventListener('click', addField);
    $('prod-search').addEventListener('input', U.debounce(renderProducts, 200));
    $('prod-cat-filter').addEventListener('change', renderProducts);

    $('btn-add-brand').addEventListener('click', function () {
      var b = $('brand-input').value.trim();
      if (!b) { return; }
      S.addBrand(b).then(function () { $('brand-input').value = ''; renderBrands(); renderDash(); refreshTypeOptions($('f-typeId').value); });
    });
    $('brand-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); $('btn-add-brand').click(); }
    });

    /* ---- فرم کالا ---- */
    $('product-form').addEventListener('submit', function (e) { e.preventDefault(); saveProduct(); });
    $('f-categoryId').addEventListener('change', function () { refreshTypeOptions(''); });
    $('btn-cancel-edit').addEventListener('click', function () { switchTab('products'); });
    $('btn-add-feat').addEventListener('click', function () {
      draft.features = syncFeats(); draft.features.push(''); renderFeatRows();
    });
    $('btn-add-spec').addEventListener('click', function () {
      draft.extraSpecs = syncExtra(); draft.extraSpecs.push({ label: '', value: '' }); renderSpecRows();
    });
    $('btn-preview').addEventListener('click', function () {
      var p = collectForm();
      $('preview-body').innerHTML =
        '<div class="card" style="border:1px solid var(--line);border-radius:14px;overflow:hidden">' +
        '<img src="' + U.img(p) + '" alt="" style="width:100%;height:170px;object-fit:cover">' +
        '<div style="padding:12px">' +
        '<div style="font-size:.78rem;color:var(--soft)">' + U.esc(S.categoryPath(p.categoryId)) + '</div>' +
        '<b>' + U.esc(p.name || 'بدون نام') + '</b>' +
        '<div style="font-size:.76rem;color:var(--soft)">' + U.esc(p.sku || '-') + ' • ' + U.esc(p.brand || '-') + '</div>' +
        '<ul style="margin:8px 0 0;padding-inline-start:18px;font-size:.82rem">' +
          (p.features || []).slice(0, 3).map(function (f) { return '<li>' + U.esc(f) + '</li>'; }).join('') +
        '</ul></div></div>';
      openOverlay('preview-overlay');
    });
    $('btn-delete-current').addEventListener('click', function () {
      if (!editingId) { return; }
      var p = S.product(editingId);
      askConfirm('حذف کالا', 'آیا از حذف «' + U.esc(p ? p.name : '') + '» مطمئن هستید؟ این عمل قابل بازگشت نیست.', function () {
        S.removeProduct(editingId).then(function () {
          editingId = null;
          renderAll();
          toast('کالا حذف شد.');
          switchTab('products');
        });
      });
    });

    /* ---- تصاویر ---- */
    $('img-drop').addEventListener('click', function () { $('img-file').click(); });
    $('img-file').addEventListener('change', function () { addImages(this.files); this.value = ''; });
    ['dragover', 'dragenter'].forEach(function (ev) {
      $('img-drop').addEventListener(ev, function (e) { e.preventDefault(); this.classList.add('hover'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      $('img-drop').addEventListener(ev, function (e) { e.preventDefault(); this.classList.remove('hover'); });
    });
    $('img-drop').addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files) { addImages(e.dataTransfer.files); }
    });
    $('btn-img-url').addEventListener('click', function () {
      var url = prompt('آدرس تصویر (URL) را وارد کنید:');
      if (!url) { return; }
      draft.images = draft.images || [];
      draft.images.push(url.trim());
      renderImages();
    });

    /* ---- تنظیمات و پشتیبان‌گیری ---- */
    $('settings-form').addEventListener('submit', function (e) { e.preventDefault(); saveSettings(); });
    $('btn-export-json').addEventListener('click', exportJSON);
    $('btn-export-csv').addEventListener('click', exportCSV);
    $('btn-import-json').addEventListener('click', function () { $('file-json').click(); });
    $('btn-import-csv').addEventListener('click', function () { $('file-csv').click(); });
    $('file-json').addEventListener('change', function () {
      var f = this.files[0]; if (!f) { return; }
      var r = new FileReader();
      r.onload = function () {
        try {
          S.importData(JSON.parse(r.result)).then(function () {
            renderAll(); toast('داده‌ها از فایل پشتیبان بازگردانی شد.');
          });
        } catch (err) { toast('فایل پشتیبان معتبر نیست: ' + U.esc(err.message), 'err'); }
      };
      r.readAsText(f, 'utf-8');
      this.value = '';
    });
    $('file-csv').addEventListener('change', function () {
      var f = this.files[0]; if (!f) { return; }
      var r = new FileReader();
      r.onload = function () { importCSV(r.result); };
      r.readAsText(f, 'utf-8');
      this.value = '';
    });
    $('btn-make-seed').addEventListener('click', makeSeed);
    $('btn-reset-seed').addEventListener('click', function () {
      askConfirm('بازگردانی داده‌های اولیه',
        'تمام تغییرات شما (کالاها، دسته‌بندی‌ها و تنظیمات) حذف و داده‌های اولیه بازگردانی می‌شود. ادامه می‌دهید؟',
        function () {
          S.reset().then(function () { editingId = null; renderAll(); toast('داده‌های اولیه بازگردانی شد.', 'warn'); });
        });
    });
  }

  function syncFeats() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-feat]'))
      .map(function (el) { return el.value.trim(); }).filter(Boolean);
  }

  /* ------------------------------------------- رویدادهای عمومی (delegation) */
  function bindGlobal() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      var closest = t.closest ? t.closest.bind(t) : function () { return null; };
      var el, id, p;

      if ((el = closest('[data-edit]'))) { editProduct(el.getAttribute('data-edit')); return; }
      if ((el = closest('[data-up]'))) { moveProduct(el.getAttribute('data-up'), -1); return; }
      if ((el = closest('[data-down]'))) { moveProduct(el.getAttribute('data-down'), 1); return; }

      if ((el = closest('[data-copy]'))) {
        id = el.getAttribute('data-copy'); p = S.product(id);
        if (!p) { return; }
        var cp = U.clone(p);
        cp.id = '';
        cp.sku = (p.sku || '') + '-COPY';
        cp.name = p.name + ' (کپی)';
        cp.order = S.data.products.length + 1;
        S.upsertProduct(cp).then(function () {
          renderAll(); toast('نسخه کپی از «' + U.esc(p.name) + '» ساخته شد.');
        });
        return;
      }

      if ((el = closest('[data-del]'))) {
        id = el.getAttribute('data-del'); p = S.product(id);
        askConfirm('حذف کالا', 'کالای «' + U.esc(p ? p.name : '') + '» حذف شود؟', function () {
          S.removeProduct(id).then(function () { renderAll(); toast('کالا حذف شد.'); });
        });
        return;
      }

      if ((el = closest('[data-cat-ren]'))) {
        id = el.getAttribute('data-cat-ren');
        var cur = S.category(id);
        var nt = prompt('عنوان جدید دسته‌بندی:', cur ? cur.title : '');
        if (nt && nt.trim()) {
          S.renameCategory(id, nt.trim()).then(function () { renderAll(); toast('عنوان دسته‌بندی تغییر کرد.'); });
        }
        return;
      }

      if ((el = closest('[data-cat-move]'))) {
        id = el.getAttribute('data-cat-move');
        var exclude = S.descendants(id);
        var opts = (S.data.categories || []).filter(function (c) { return exclude.indexOf(c.id) === -1; });
        var msg = 'والد جدید برای «' + S.categoryPath(id) + '» را انتخاب کنید:\n0 = دسته اصلی (بدون والد)\n' +
          opts.map(function (c, i) { return (i + 1) + ' = ' + S.categoryPath(c.id); }).join('\n');
        var sel = prompt(msg, '0');
        if (sel === null) { return; }
        var idx = parseInt(sel, 10) || 0;
        var parent = (idx > 0 && opts[idx - 1]) ? opts[idx - 1].id : null;
        S.moveCategory(id, parent).then(function (ok) {
          if (!ok) { toast('جابه‌جایی امکان‌پذیر نیست.', 'err'); return; }
          renderAll(); toast('دسته‌بندی جابه‌جا شد.');
        });
        return;
      }

      if ((el = closest('[data-cat-del]'))) {
        id = el.getAttribute('data-cat-del');
        askConfirm('حذف دسته‌بندی', 'دسته «' + U.esc(S.categoryTitle(id)) + '» حذف شود؟ (دسته دارای زیرمجموعه یا کالا حذف نمی‌شود)', function () {
          S.removeCategory(id).then(function (ok) {
            if (!ok) { toast('این دسته زیرمجموعه یا کالا دارد؛ ابتدا آن‌ها را منتقل یا حذف کنید.', 'err'); return; }
            renderAll(); toast('دسته‌بندی حذف شد.');
          });
        });
        return;
      }

      if ((el = closest('[data-type-del]'))) {
        id = el.getAttribute('data-type-del');
        askConfirm('حذف نوع کالا', 'این نوع کالا حذف شود؟ کالاهای مرتبط بدون نوع خواهند شد.', function () {
          S.removeType(id).then(function () { renderAll(); toast('نوع کالا حذف شد.'); });
        });
        return;
      }

      if ((el = closest('[data-brand-del]'))) {
        var b = el.getAttribute('data-brand-del');
        askConfirm('حذف برند', 'برند «' + U.esc(b) + '» حذف شود؟ (کالاهای ثبت‌شده بدون تغییر می‌مانند)', function () {
          S.removeBrand(b).then(function () { renderAll(); toast('برند حذف شد.'); });
        });
        return;
      }

      if ((el = closest('[data-field-del]'))) {
        var k = el.getAttribute('data-field-del');
        askConfirm('حذف فیلد مشخصات', 'فیلد «' + U.esc(k) + '» حذف شود؟ مقادیر ثبت‌شده در کالاها دیگر نمایش داده نمی‌شود.', function () {
          S.removeField(k).then(function () { renderAll(); toast('فیلد حذف شد.'); });
        });
        return;
      }

      if ((el = closest('[data-rmimg]'))) { draft.images.splice(Number(el.getAttribute('data-rmimg')), 1); renderImages(); return; }
      if ((el = closest('[data-rmfeat]'))) {
        var keep = syncFeats();
        keep.splice(Number(el.getAttribute('data-rmfeat')), 1);
        draft.features = keep;
        renderFeatRows();
        return;
      }
      if ((el = closest('[data-rmx]'))) {
        var xs = syncExtra();
        xs.splice(Number(el.getAttribute('data-rmx')), 1);
        draft.extraSpecs = xs;
        renderSpecRows();
        return;
      }
      if (t.classList && t.classList.contains('overlay') && t.id !== 'confirm-overlay') { closeOverlay(t.id); }
    });
  }

  /* -------------------------------------------------------- رندر کل پنل */
  function renderAll() {
    renderDash();
    $('prod-cat-filter').innerHTML = prodCatOptions($('prod-cat-filter').value);
    renderProducts();
    renderCategories();
    renderTypes();
    renderBrands();
    renderFields();
    loadSettingsForm();
  }

  /* ---------------------------------------------------------- راه‌اندازی */
  function init() {
    S.load().then(function () {
      bindEvents();
      bindGlobal();
      var authed = false;
      try { authed = sessionStorage.getItem(SESSION_KEY) === '1'; } catch (e) {}
      if (authed) { showApp(); } else { $('login-pass').focus(); }
    }).catch(function (err) {
      toast('خطا در بارگذاری داده‌ها: ' + U.esc(err.message), 'err');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

  HG.admin = {
    toast: toast,
    switchTab: switchTab,
    renderAll: renderAll,
    newProduct: newProduct,
    editProduct: editProduct,
    exportJSON: exportJSON,
    exportCSV: exportCSV,
    makeSeed: makeSeed
  };
})();










