/* =============================================================================
   هدایت گستر | کاتالوگ دیجیتال — داده‌های اولیه (Seed Database)
   -----------------------------------------------------------------------------
   این فایل "دیتابیس اولیه" و ساختار پیش‌فرض کاتالوگ است.
   مدیر می‌تواند همه چیز (دسته‌بندی، نوع کالا، برند، فیلد مشخصات و کالا) را
   از داخل پنل مدیریت تغییر دهد؛ تغییرات در دیتابیس مرورگر ذخیره می‌شود و با
   دکمه «پشتیبان‌گیری JSON» قابل انتقال به هر دستگاه دیگر است.

   نکته فنی: داده به صورت فایل JS نوشته شده (نه JSON) تا با دابل‌کلیک روی
   index.html هم بدون وب‌سرور و بدون خطای CORS کار کند.
============================================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- تنظیمات */
  var SETTINGS = {
    brandFa: 'صنایع برق و روشنایی هدایت گستر',
    brandEn: 'Hedayat Gostar Electrical & Lighting Industries',
    slogan: 'بیش از یک دهه تجربه در تأمین عمده صنعت برق و روشنایی ایران',
    logoText: 'HG',
    phone: '021-91303336',
    mobile: '0913-699-3810',
    email: 'info@hedayatgostar.com',
    address: 'اصفهان — دفتر مرکزی فروش و انبار',
    site: 'https://hedayatgostar.com',
    instagram: '',
    themePrimary: '#e4af1e',
    themeAccent: '#F5A623',
    themeMode: 'light',
    showPrices: false,
    priceLabel: 'استعلام قیمت',
    catalogTitle: 'کاتالوگ محصولات',
    catalogSubtitle: 'تأمین عمده لامپ، پنل، براکت، پروژکتور، چراغ، سیم و کابل و تجهیزات برق صنعتی از برندهای معتبر',
    pdfOrientation: 'portrait',
    pdfPerPage: 1,
    adminPasswordHash: ''
  };

  /* ------------------------------------------------- فیلدهای مشخصات فنی (Schema)
     مدیر می‌تواند از پنل، فیلد جدید بسازد یا فیلدها را ویرایش کند.
     filter:true → این فیلد در نوار فیلتر کاتالوگ نمایش داده می‌شود
     type: number | text | select                                          */
  var FIELDS = [
    { key: 'power',      label: 'توان',           unit: 'وات',      type: 'number', filter: true,  group: 'مشخصات الکتریکی' },
    { key: 'voltage',    label: 'ولتاژ ورودی',     unit: 'ولت',      type: 'text',   filter: false, group: 'مشخصات الکتریکی' },
    { key: 'frequency',  label: 'فرکانس',         unit: 'هرتز',     type: 'text',   filter: false, group: 'مشخصات الکتریکی' },
    { key: 'pf',         label: 'ضریب توان',      unit: 'PF',       type: 'text',   filter: false, group: 'مشخصات الکتریکی' },
    { key: 'lumen',      label: 'شار نوری',        unit: 'لومن',     type: 'number', filter: true,  group: 'مشخصات نوری' },
    { key: 'cct',        label: 'دمای رنگ',        unit: 'کلوین',    type: 'select', filter: true,  group: 'مشخصات نوری',
      options: ['2700', '3000', '4000', '5000', '6500'] },
    { key: 'efficacy',   label: 'راندمان نوری',    unit: 'لومن/وات', type: 'number', filter: false, group: 'مشخصات نوری' },
    { key: 'cri',        label: 'شاخص نمود رنگ',   unit: 'Ra',       type: 'number', filter: false, group: 'مشخصات نوری' },
    { key: 'beam',       label: 'زاویه پخش نور',   unit: 'درجه',     type: 'text',   filter: false, group: 'مشخصات نوری' },
    { key: 'housing',    label: 'جنس بدنه',        unit: '',         type: 'text',   filter: false, group: 'ساختار' },
    { key: 'dimensions', label: 'ابعاد / برش',     unit: 'میلی‌متر', type: 'text',   filter: false, group: 'ساختار' },
    { key: 'weight',     label: 'وزن',             unit: 'گرم',      type: 'number', filter: false, group: 'ساختار' },
    { key: 'ip',         label: 'درجه حفاظت',      unit: 'IP',       type: 'select', filter: true,  group: 'استاندارد',
      options: ['IP20', 'IP40', 'IP44', 'IP54', 'IP65', 'IP66', 'IP67'] },
    { key: 'life',       label: 'عمر مفید',        unit: 'ساعت',     type: 'number', filter: false, group: 'استاندارد' },
    { key: 'standard',   label: 'استاندارد',       unit: '',         type: 'text',   filter: false, group: 'استاندارد' },
    { key: 'warranty',   label: 'گارانتی',         unit: 'ماه',      type: 'number', filter: true,  group: 'استاندارد' },
    { key: 'pack',       label: 'تعداد در کارتن',  unit: 'عدد',      type: 'number', filter: false, group: 'بسته‌بندی' },
    { key: 'moq',        label: 'حداقل سفارش',     unit: 'عدد',      type: 'number', filter: false, group: 'بسته‌بندی' }
  ];

  /* --------------------------------------------------------- درخت دسته‌بندی
     برگرفته از دسته‌بندی‌های واقعی سایت هدایت گستر (۱۴ دسته اصلی)          */
  var CATEGORY_TREE = {
    lamp: { t: 'لامپ', i: '💡', c: {
      'lamp-led':      { t: 'لامپ LED' },
      'lamp-bolb':     { t: 'لامپ حبابی' },
      'lamp-cylinder': { t: 'لامپ استوانه‌ای' },
      'lamp-safine':   { t: 'لامپ سفینه‌ای' },
      'lamp-ashki':    { t: 'لامپ اشکی' },
      'lamp-halogen':  { t: 'لامپ هالوژن' },
      'lamp-shop':     { t: 'لامپ فروشگاهی - سوله‌ای' },
      'lamp-pll':      { t: 'مهتابی PLL-FPL' },
      'lamp-cfl':      { t: 'لامپ کم‌مصرف' },
      'lamp-smd':      { t: 'لامپ SMD' }
    }},
    panel: { t: 'پنل', i: '⬜', c: {
      'panel-recessed': { t: 'پنل توکار', c: {
        'panel-recessed-round':  { t: 'توکار گرد' },
        'panel-recessed-square': { t: 'توکار مربع' } } },
      'panel-surface': { t: 'پنل روکار', c: {
        'panel-surface-round':   { t: 'روکار گرد' },
        'panel-surface-square':  { t: 'روکار مربع' } } }
    }},
    bracket: { t: 'براکت', i: '📐', c: {
      'bracket-20-30':   { t: 'براکت ۲۰ تا ۳۰ سانت' },
      'bracket-50-60':   { t: 'براکت ۵۰ الی ۶۰ سانت' },
      'bracket-75-90':   { t: 'براکت ۷۵ تا ۹۰ سانت' },
      'bracket-100-120': { t: 'براکت ۱۰۰ تا ۱۲۰ سانت' },
      'bracket-under': { t: 'زیر کابینتی', c: {
        'bracket-under-120': { t: 'زیر کابینتی ۱۲۰ سانت' },
        'bracket-under-90':  { t: 'زیر کابینتی ۹۰ سانت' },
        'bracket-under-60':  { t: 'زیر کابینتی ۶۰ سانت' },
        'bracket-under-30':  { t: 'زیر کابینتی ۳۰ سانت' } } },
      'rope': { t: 'ریسه', c: {
        'rope-line':  { t: 'ریسه خطی' },
        'rope-party': { t: 'ریسه چراغانی' },
        'rope-hose':  { t: 'ریسه شلنگی نواری' } } }
    }},
    projector: { t: 'پروژکتورها', i: '🔆', c: {
      'projector-smd': { t: 'پروژکتور SMD' },
      'projector-cob': { t: 'پروژکتور COB' }
    }},
    light: { t: 'چراغ', i: '🛋️', c: {
      'light-decor':      { t: 'چراغ دکوراتیو' },
      'light-street':     { t: 'چراغ خیابانی' },
      'light-rail':       { t: 'چراغ ریلی' },
      'light-waterproof': { t: 'چراغ ضد آب' },
      'light-wall':       { t: 'چراغ دیواری' },
      'light-ceiling':    { t: 'چراغ سقفی' },
      'light-bed':        { t: 'چراغ خواب' },
      'light-facade':     { t: 'چراغ نما' },
      'light-buried':     { t: 'چراغ دفنی' }
    }},
    router: { t: 'رابط، محافظ و چند راهی', i: '🔌', c: {
      'protector': { t: 'محافظ', c: {
        'protector-earth':   { t: 'محافظ ارت‌دار' },
        'protector-noearth': { t: 'محافظ بدون ارت' } } },
      'connector': { t: 'رابط', c: {
        'connector-earth':   { t: 'رابط ارت‌دار' },
        'connector-noearth': { t: 'رابط بدون ارت' } } }
    }},
    fan: { t: 'هواکش', i: '🌀', c: {
      'fan-home':     { t: 'هواکش خانگی' },
      'fan-industry': { t: 'هواکش صنعتی' }
    }},
    cable: { t: 'سیم و کابل', i: '🧵', c: {
      'wire': { t: 'سیم', c: {
        'wire-1':    { t: 'سیم یک رشته‌ای' },
        'wire-2':    { t: 'سیم دو رشته‌ای' },
        'wire-pair': { t: 'سیم زوجی' } } },
      'kabel': { t: 'کابل', c: {
        'kabel-1': { t: 'کابل یک رشته‌ای' },
        'kabel-2': { t: 'کابل دو رشته‌ای' },
        'kabel-3': { t: 'کابل سه رشته‌ای' },
        'kabel-4': { t: 'کابل چهار رشته‌ای' },
        'kabel-5': { t: 'کابل پنج رشته‌ای' } } }
    }},
    mcb: { t: 'کلید مینیاتوری و تجهیزات صنعتی', i: '⚙️', c: {
      'mcb-switch': { t: 'کلید مینیاتوری', c: {
        'mcb-1p': { t: 'کلید مینیاتوری تک فاز' },
        'mcb-3p': { t: 'کلید مینیاتوری سه فاز' } } },
      'photocell':   { t: 'فتوسل' },
      'elcb': { t: 'محافظ جان', c: {
        'elcb-1p': { t: 'محافظ جان تک فاز' },
        'elcb-3p': { t: 'محافظ جان سه فاز' } } },
      'contactor':   { t: 'کنتاکتور' },
      'pushbutton':  { t: 'پوشن باتن' },
      'stabilizer':  { t: 'استابلایزر' },
      'microswitch': { t: 'میکروسوئیچ / لیمیت سوئیچ' },
      'terminal':    { t: 'ترمینال' }
    }},
    duct: { t: 'داکت و لوله', i: '🪛', c: {
      'duct-main': { t: 'داکت' },
      'pipe': { t: 'لوله', c: {
        'pipe-1':       { t: 'لوله' },
        'pipe-elbow':   { t: 'لوله زانو' },
        'pipe-box':     { t: 'قوطی' },
        'pipe-bushing': { t: 'بوشن' } } },
      'junction': { t: 'جعبه' }
    }},
    battery: { t: 'باطری', i: '🔋', c: {
      'battery-pen':    { t: 'باطری قلمی' },
      'battery-half':   { t: 'باطری نیم قلمی' },
      'battery-charge': { t: 'باطری قابل شارژ' },
      'battery-coin':   { t: 'باطری سکه‌ای' },
      'battery-li':     { t: 'لیتیوم' }
    }},
    switch: { t: 'کلید و پریز', i: '🎛️', c: {
      'switch-surface':  { t: 'کلید و پریز روکار' },
      'switch-recessed': { t: 'کلید و پریز توکار' }
    }},
    bakelite: { t: 'باکالیجات', i: '🧱', c: {} }
  };

  /* ------------------------------------------------------------ نوع کالا (Type)
     فیلد مستقل و کاملاً قابل مدیریت توسط مدیر.
     cats = دسته‌های مجاز برای این نوع (خالی = برای همه دسته‌ها)               */
  var TYPES = [
    { id: 'type-recessed', t: 'توکار',           cats: ['panel', 'switch', 'light'] },
    { id: 'type-surface',  t: 'روکار',           cats: ['panel', 'switch', 'light'] },
    { id: 'type-round',    t: 'گرد',             cats: ['panel'] },
    { id: 'type-square',   t: 'مربع',            cats: ['panel'] },
    { id: 'type-1p',       t: 'تک فاز',          cats: ['mcb', 'elcb'] },
    { id: 'type-3p',       t: 'سه فاز',          cats: ['mcb', 'elcb'] },
    { id: 'type-earth',    t: 'ارت‌دار',          cats: ['router'] },
    { id: 'type-noearth',  t: 'بدون ارت',         cats: ['router'] },
    { id: 'type-smd',      t: 'SMD',             cats: ['projector', 'lamp', 'panel'] },
    { id: 'type-cob',      t: 'COB',             cats: ['projector', 'lamp'] },
    { id: 'type-home',     t: 'خانگی',           cats: ['fan'] },
    { id: 'type-industry', t: 'صنعتی',           cats: ['fan', 'light', 'lamp'] },
    { id: 'type-strand',   t: 'رشته‌ای - افشان',  cats: ['cable'] },
    { id: 'type-pair',     t: 'زوجی',            cats: ['cable'] },
    { id: 'type-line',     t: 'خطی',             cats: ['bracket'] },
    { id: 'type-hose',     t: 'شلنگی',           cats: ['bracket'] },
    { id: 'type-under',    t: 'زیر کابینتی',     cats: ['bracket'] },
    { id: 'type-decor',    t: 'دکوراتیو',        cats: ['light'] },
    { id: 'type-water',    t: 'ضد آب',           cats: ['light', 'projector'] },
    { id: 'type-smart',    t: 'هوشمند',          cats: [] }
  ];

  /* ------------------------------------------------------------------- برندها */
  var BRANDS = ['پارس شوان', 'خزر شید', 'دلتا', 'ایران زمین', 'پارس کیمیا', 'آروشا', 'پرتو پارس', 'هدایت گستر'];

  /* --------------------------------- تبدیل درخت تودرتو به لیست تخت دسته‌بندی */
  function flatten(tree, parentId, depth, out) {
    Object.keys(tree).forEach(function (id, idx) {
      var node = tree[id];
      out.push({
        id: id, title: node.t, icon: node.i || '',
        parentId: parentId || null, depth: depth, order: idx,
        builtin: true
      });
      if (node.c) { flatten(node.c, id, depth + 1, out); }
    });
    return out;
  }

  window.HG_SEED = {
    version: 4,
    settings: SETTINGS,
    fields: FIELDS,
    categories: flatten(CATEGORY_TREE, null, 0, []),
    types: TYPES,
    brands: BRANDS,
    products: []   // در فایل data/seed-products.js پر می‌شود
  };
})();
