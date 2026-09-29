/* =============================================================================
   هدایت گستر | لایه ذخیره‌سازی داده (Store)
   -----------------------------------------------------------------------------
   • ذخیره‌سازی اصلی: IndexedDB   • ذخیره‌سازی پشتیبان: localStorage
   • اگر مرورگر اجازه IndexedDB نداد (مثلاً اجرای مستقیم فایل با file://)،
     به‌طور خودکار از localStorage استفاده می‌شود تا هیچ‌وقت داده از دست نرود.
   • صدور/ورود داده: JSON و CSV از پنل مدیریت
============================================================================= */
(function () {
  'use strict';
  var HG = window.HG = window.HG || {};

  var DB_NAME = 'hg_catalog_db', STORE = 'kv', KEY = 'data';
  var LS_KEY = 'hg_catalog_data_v1';

  /* ------------------------------------------------------------------ ابزارها */

  /* پیشوند مسیر دارایی‌ها: صفحه‌های ریشه '' و پنل مدیریت '../' */
  var ASSET_PREFIX = (function () {
    try {
      var p = String(location.pathname || '').replace(/\\/g, '/');
      return /\/admin\/?$/i.test(p) || /\/admin\/[^/]*$/i.test(p) ? '../' : '';
    } catch (e) { return ''; }
  })();

  var util = HG.util = {
    uid: function (prefix) {
      return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
    },
    esc: function (s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },
    fa: function (v) {   // تبدیل ارقام لاتین به فارسی
      return String(v == null ? '' : v).replace(/[0-9]/g, function (d) {
        return '۰۱۲۳۴۵۶۷۸۹'[d];
      });
    },
    num: function (v) {  // جداکننده هزارگان + ارقام فارسی
      var n = Number(String(v == null ? '' : v).replace(/[^0-9.\-]/g, ''));
      if (isNaN(n)) { return util.fa(v); }
      return util.fa(n.toLocaleString('en-US'));
    },
    debounce: function (fn, ms) {
      var t; return function () {
        var a = arguments, self = this;
        clearTimeout(t); t = setTimeout(function () { fn.apply(self, a); }, ms || 200);
      };
    },
    clone: function (o) { return JSON.parse(JSON.stringify(o)); },
    byOrder: function (a, b) { return (a.order || 0) - (b.order || 0); },
    /* تصویر گرافیکی خودکار وقتی محصول عکس ندارد */
    placeholder: function (product, w, h) {
      var name = (product && (product.name || product.nameEn)) || 'کالا';
      var c1 = '#0B3D91', c2 = '#1e6bd6';
      var seed = 0, i;
      for (i = 0; i < name.length; i++) { seed = (seed * 31 + name.charCodeAt(i)) % 360; }
      var hue = seed % 360;
      c1 = 'hsl(' + hue + ',62%,32%)'; c2 = 'hsl(' + ((hue + 40) % 360) + ',70%,52%)';
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + (w || 600) + '" height="' + (h || 450) + '" viewBox="0 0 600 450">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>' +
        '<radialGradient id="r" cx="0.75" cy="0.2" r="0.8"><stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/>' +
        '<stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>' +
        '<rect width="600" height="450" fill="url(#g)"/><rect width="600" height="450" fill="url(#r)"/>' +
        '<g fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2">' +
        '<circle cx="300" cy="200" r="120"/><circle cx="300" cy="200" r="80"/><circle cx="300" cy="200" r="40"/></g>' +
        '<text x="300" y="205" text-anchor="middle" font-family="Vazirmatn, Tahoma, sans-serif" font-size="42" fill="#ffffff" fill-opacity="0.95">' + util.esc(name.slice(0, 22)) + '</text>' +
        '<text x="300" y="255" text-anchor="middle" font-family="Tahoma, sans-serif" font-size="20" fill="#ffffff" fill-opacity="0.7">' +
        util.esc((product && product.brand) || 'Hedayat Gostar') + '</text>' +
        '<text x="300" y="410" text-anchor="middle" font-family="Tahoma, sans-serif" font-size="16" fill="#ffffff" fill-opacity="0.55">HG DIGITAL CATALOG</text>' +
        '</svg>';
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    },
    img: function (product, index) {
      var imgs = (product && product.images) || [];
      if (imgs[index || 0]) { return util.asset(imgs[index || 0]); }
      if (imgs.length) { return util.asset(imgs[0]); }
      return util.placeholder(product, 600, 450);
    },
    /* مسیر دارایی‌ها را نسبت به صفحه‌ی جاری درست می‌کند.
       صفحات ریشه (index.html/print.html) در ریشه‌اند، ولی پنل مدیریت در
       پوشه admin/ است؛ بدون این اصلاح، تصاویر پنل ۴۰۴ می‌شدند. */
    asset: function (p) {
      if (!p) { return p; }
      if (/^(https?:|data:|blob:|\/\/|\/)/i.test(p)) { return p; }
      return ASSET_PREFIX + p;
    }
  };

  /* ------------------------------------------------------- ابزار IndexedDB */
  var idb = {
    supported: function () {
      try { return !!window.indexedDB; } catch (e) { return false; }
    },
    open: function () {
      return new Promise(function (resolve, reject) {
        if (!idb.supported()) { return reject(new Error('no-idb')); }
        var req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = function () {
          var db = req.result;
          if (!db.objectStoreNames.contains(STORE)) { db.createObjectStore(STORE); }
        };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
        req.onblocked = function () { reject(new Error('blocked')); };
      });
    },
    get: function () {
      return idb.open().then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction(STORE, 'readonly'), r = tx.objectStore(STORE).get(KEY);
          r.onsuccess = function () { resolve(r.result || null); };
          r.onerror = function () { reject(r.error); };
        });
      });
    },
    set: function (value) {
      return idb.open().then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).put(value, KEY);
          tx.oncomplete = function () { resolve(true); };
          tx.onerror = function () { reject(tx.error); };
        });
      });
    }
  };

  /* ------------------------------------------------------------ ذخیره‌سازی */
  /* نکته مهم: در حالت اجرای مستقیم فایل (file://) مرورگر کروم اجازه ساخت
     IndexedDB نمی‌دهد و درخواست معلق می‌ماند؛ بنابراین فقط در حالت وب‌سرور
     (http/https) از IndexedDB استفاده می‌کنیم و در حالت file:// دیتابیس
     در localStorage نگه داشته می‌شود. این کار باعث می‌شود کاتالوگ هم با
     دابل‌کلیک روی index.html و هم روی هاست بدون مشکل کار کند.            */
  var IS_HTTP = (location.protocol === 'http:' || location.protocol === 'https:');
  var USE_IDB = IS_HTTP && idb.supported();

  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () { reject(new Error('timeout')); }, ms);
      promise.then(function (v) { clearTimeout(t); resolve(v); },
        function (e) { clearTimeout(t); reject(e); });
    });
  }

  /* --------------------------------------------------------------------------
     رفع شناسه‌های تکراری دسته‌بندی
     در داده‌های نسخه قبلی، شناسه دو دسته («mcb» و «duct») هم برای والد و هم
     برای فرزند استفاده شده بود؛ همین باعث بازگشت بی‌پایان در ساخت درخت
     دسته‌بندی و از کار افتادن کل صفحه کاتالوگ می‌شد. این تابع شناسه تکراری را
     یکتا می‌کند و فرزندانش را به شناسه جدید منتقل می‌کند.
  --------------------------------------------------------------------------- */
  function repairCategoryIds(cats) {
    var list = cats || [], seen = {};
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (!c || !c.id) { continue; }
      if (!seen[c.id]) { seen[c.id] = 1; continue; }

      var oldId = c.id, n = 1, nid;
      do { nid = oldId + '-b' + (++n); } while (seen[nid]);
      seen[nid] = 1;
      c.id = nid;

      /* در لیست تخت، فرزندان هر گره بلافاصله بعد از آن آمده‌اند */
      var d0 = (c.depth == null) ? 0 : c.depth;
      for (var j = i + 1; j < list.length; j++) {
        var dj = (list[j].depth == null) ? 0 : list[j].depth;
        if (dj <= d0) { break; }
        if (list[j].parentId === oldId) { list[j].parentId = nid; }
      }
    }
    return list;
  }

  var store = HG.store = {
    data: null,
    storageMode: 'memory',
    supportsIdb: USE_IDB,

    defaults: function () {
      var s = window.HG_SEED || {};
      return {
        version: s.version || 1,
        settings: util.clone(s.settings || {}),
        fields: util.clone(s.fields || []),
        categories: util.clone(s.categories || []),
        types: util.clone(s.types || []),
        brands: util.clone(s.brands || []),
        products: util.clone(s.products || []),
        updatedAt: new Date().toISOString()
      };
    },

    load: function () {
      var first = USE_IDB
        ? withTimeout(idb.get(), 2000).catch(function () { return null; })
        : Promise.resolve(null);

      return first.then(function (fromIdb) {
        if (fromIdb && fromIdb.products) {
          store.storageMode = 'indexeddb';
          store.data = store.migrate(fromIdb);
          return store.data;
        }
        try {
          var raw = localStorage.getItem(LS_KEY);
          if (raw) {
            store.storageMode = 'localStorage';
            store.data = store.migrate(JSON.parse(raw));
            return store.data;
          }
        } catch (e) { /* localStorage در دسترس نیست */ }
        store.storageMode = 'memory';
        store.data = store.migrate(store.defaults());
        return store.data;
      });
    },

    /* پرکردن فیلدهای جاافتاده در داده‌های نسخه قدیمی */
    migrate: function (d) {
      var def = store.defaults();
      var seedV = def.version;
      d = d || {};

      /* اگر داده‌ی ذخیره‌شده مربوط به نسخه‌ی قدیمی‌تر کاتالوگ باشد، محتوای
         جدید (کالاها/برندها/دسته‌ها) جایگزین می‌شود؛ فقط تنظیمات برند، تم و
         رمز مدیر حفظ می‌گردد تا کار کاربر از دست نرود. */
      if ((d.version || 0) < seedV) {
        def.settings = Object.assign({}, def.settings, d.settings || {});
        def.updatedAt = new Date().toISOString();
        return def;
      }

      d.settings = Object.assign({}, def.settings, d.settings || {});
      d.fields = d.fields && d.fields.length ? d.fields : def.fields;
      d.categories = d.categories && d.categories.length ? d.categories : def.categories;
      d.categories = repairCategoryIds(d.categories);
      d.types = d.types || def.types;
      d.brands = d.brands || def.brands;
      d.products = (d.products || []).map(function (p, i) {
        p.specs = p.specs || {};
        p.extraSpecs = p.extraSpecs || [];
        p.features = p.features || [];
        p.tags = p.tags || [];
        p.images = p.images || [];
        if (p.order == null) { p.order = i + 1; }
        p.availability = p.availability || 'in';
        return p;
      });
      d.version = seedV;
      return d;
    },

    save: function () {
      store.data.updatedAt = new Date().toISOString();
      var snapshot = util.clone(store.data);
      var okLocal = false;

      /* ۱) ذخیره در localStorage (سریع، و در حالت file:// تنها گزینه) */
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(snapshot));
        okLocal = true;
      } catch (e) {
        okLocal = false;   // معمولاً به‌خاطر پر شدن حجم (تصاویر زیاد)
      }

      /* ۲) در حالت وب‌سرور، نسخه بزرگ‌تر را در IndexedDB هم نگه می‌داریم */
      if (USE_IDB) {
        var prev = store.storageMode;
        store.storageMode = okLocal ? 'localStorage' : prev;
        idb.set(snapshot).then(function () { store.storageMode = 'indexeddb'; })
          .catch(function () { store.storageMode = okLocal ? 'localStorage' : 'memory'; });
        return Promise.resolve(true);
      }

      store.storageMode = okLocal ? 'localStorage' : 'memory';
      return Promise.resolve(okLocal);
    },

    reset: function () {
      store.data = store.defaults();
      return store.save();
    },

    /* ------------------------------------------------------------- پرس‌وجو */
    products: function () {
      return (store.data.products || []).slice().sort(util.byOrder);
    },
    product: function (id) {
      return (store.data.products || []).filter(function (p) { return p.id === id; })[0] || null;
    },
    category: function (id) {
      return (store.data.categories || []).filter(function (c) { return c.id === id; })[0] || null;
    },
    categoryTitle: function (id) {
      var c = store.category(id); return c ? c.title : 'دسته‌بندی‌نشده';
    },
    typeTitle: function (id) {
      var t = (store.data.types || []).filter(function (x) { return x.id === id; })[0];
      return t ? t.title : '';
    },
    /* مسیر کامل دسته‌بندی: لامپ › لامپ LED */
    categoryPath: function (id) {
      var parts = [], cur = store.category(id), guard = 0;
      while (cur && guard++ < 10) {
        parts.unshift(cur.title);
        cur = cur.parentId ? store.category(cur.parentId) : null;
      }
      return parts.join(' › ');
    },
    /* خود دسته + همه زیردسته‌هایش (برای فیلتر سلسله‌مراتبی) */
    descendants: function (id) {
      var out = [id], again = true;
      while (again) {
        again = false;
        (store.data.categories || []).forEach(function (c) {
          if (c.parentId && out.indexOf(c.parentId) > -1 && out.indexOf(c.id) === -1) {
            out.push(c.id); again = true;
          }
        });
      }
      return out;
    },

    /* ------------------------------------------------------------ ویرایش داده */
    upsertProduct: function (p) {
      var list = store.data.products, i;
      for (i = 0; i < list.length; i++) {
        if (list[i].id === p.id) {
          list[i] = p;
          return store.save().then(function () { return p; });
        }
      }
      p.id = p.id || util.uid('p');
      p.createdAt = p.createdAt || new Date().toLocaleDateString('fa-IR');
      if (p.order == null) { p.order = list.length + 1; }
      list.push(p);
      return store.save().then(function () { return p; });
    },
    removeProduct: function (id) {
      store.data.products = store.data.products.filter(function (p) { return p.id !== id; });
      return store.save();
    },
    /* دسته‌بندی: افزودن/تغییرنام/جابه‌جایی/حذف (توسط مدیر) */
    addCategory: function (cat) {
      cat.id = cat.id || util.uid('cat');
      cat.order = cat.order == null ? (store.data.categories.length + 1) : cat.order;
      store.data.categories.push(cat);
      return store.save().then(function () { return cat; });
    },
    renameCategory: function (id, title) {
      var c = store.category(id); if (c) { c.title = title; }
      return store.save();
    },
    moveCategory: function (id, newParentId) {
      var c = store.category(id);
      if (!c) { return Promise.resolve(false); }
      if (newParentId && store.descendants(id).indexOf(newParentId) > -1) { return Promise.resolve(false); }
      c.parentId = newParentId || null;
      return store.save();
    },
    removeCategory: function (id) {
      var kids = (store.data.categories || []).filter(function (c) { return c.parentId === id; });
      if (kids.length) { return Promise.resolve(false); }
      var used = (store.data.products || []).some(function (p) { return p.categoryId === id; });
      if (used) { return Promise.resolve(false); }
      store.data.categories = store.data.categories.filter(function (c) { return c.id !== id; });
      return store.save();
    },
    /* نوع کالا */
    addType: function (t) {
      t.id = t.id || util.uid('type');
      store.data.types.push(t);
      return store.save().then(function () { return t; });
    },
    removeType: function (id) {
      store.data.types = store.data.types.filter(function (t) { return t.id !== id; });
      (store.data.products || []).forEach(function (p) { if (p.typeId === id) { p.typeId = ''; } });
      return store.save();
    },
    /* فیلدهای مشخصات فنی */
    addField: function (f) {
      f.key = f.key || util.uid('f');
      store.data.fields.push(f);
      return store.save().then(function () { return f; });
    },
    removeField: function (key) {
      store.data.fields = store.data.fields.filter(function (f) { return f.key !== key; });
      return store.save();
    },
    addBrand: function (b) {
      if (b && store.data.brands.indexOf(b) === -1) { store.data.brands.push(b); }
      return store.save();
    },
    removeBrand: function (b) {
      store.data.brands = store.data.brands.filter(function (x) { return x !== b; });
      return store.save();
    },
    setSetting: function (key, value) {
      store.data.settings[key] = value;
      return store.save();
    },
    /* ورود کامل داده از فایل پشتیبان */
    importData: function (obj) {
      if (!obj || !obj.products) { throw new Error('ساختار فایل پشتیبان معتبر نیست'); }
      store.data = store.migrate(obj);
      return store.save();
    },
    /* ساخت ردیف‌های جدول مشخصات فنی یک کالا بر اساس فیلدهای تعریف‌شده */
    specRows: function (p) {
      var rows = [];
      (store.data.fields || []).forEach(function (f) {
        var v = p.specs ? p.specs[f.key] : '';
        if (v === '' || v == null) { return; }
        rows.push({ key: f.key, label: f.label, value: String(v), unit: f.unit || '', group: f.group || 'سایر' });
      });
      (p.extraSpecs || []).forEach(function (x) {
        if (!x || !x.label) { return; }
        rows.push({ key: 'x-' + x.label, label: x.label, value: String(x.value || ''), unit: '', group: 'سایر' });
      });
      return rows;
    }
  };
})();

