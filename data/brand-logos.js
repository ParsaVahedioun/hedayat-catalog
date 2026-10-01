/* هدایت گستر | لوگوی برندها — قابل ویرایش
   byCode : کد برند (رقم ۷-۸ کد کالا) ← فایل لوگو در assets/img/brands
   برندی که اینجا نباشد، لوگوی هدایت گستر (fallback) را می‌گیرد. */
(function () {
  'use strict';
  var DIR = 'assets/img/brands/';
  var byCode = {
    '01': 'khazarshid.png',   /* نارون لیان — لوگوی «خزر شید» (Untitled-1.png) */
    '02': 'shwan.png',        /* شوان */
    '60': 'shwan.png',        /* شوان صنعتی */
    '03': 'iranzamin.png',    /* ایران زمین */
    '04': 'aroosha.png',      /* آروشا */
    '05': 'delta.png',        /* پارس اسکای — لوگوی «دلتا» (delta.png) */
    '07': 'parskimia.png',    /* پارس کیمیا */
    '10': 'burux.png',        /* بروکس */
    '21': 'fardan.png'        /* فردان */
  };
  var FALLBACK = DIR + 'hg.png';
  var M = window.HG_CODEMAP || { brands: {} }, byName = {};
  Object.keys(M.brands || {}).sort().forEach(function (c) { if (!byName[M.brands[c]]) { byName[M.brands[c]] = c; } });
  window.HG_BRAND_LOGOS = {
    byCode: byCode, fallback: FALLBACK,
    forCode: function (c) { return byCode[c] ? DIR + byCode[c] : FALLBACK; },
    forName: function (n) { var c = byName[n]; return c ? (byCode[c] ? DIR + byCode[c] : FALLBACK) : FALLBACK; },
    isOwn: function (c) { return !!byCode[c]; }
  };
})();
