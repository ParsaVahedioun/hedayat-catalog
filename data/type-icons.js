/* هدایت گستر | ایکون نوع کالا (SVG ساده، همرنگ متن) — قابل ویرایش
   window.HG_TYPE_ICONS.byType : کد نوع (۲ رقم) ← کلید ایکون
   window.HG_TYPE_ICONS.svg(code, size) : HTML ایکون یک نوع ('' اگر نداشته باشد) */
(function () {
  'use strict';
  function dots(n) {                                 /* مقطع کابل با n رشته */
    var P = { 1: [[12, 12]], 2: [[9, 12], [15, 12]], 3: [[12, 8.5], [8.5, 15], [15.5, 15]],
      4: [[9, 9], [15, 9], [9, 15], [15, 15]], 5: [[9, 9], [15, 9], [9, 15], [15, 15], [12, 12]],
      7: [[12, 7.5], [8, 10], [16, 10], [8, 14.5], [16, 14.5], [12, 17], [12, 12]] }[n] || [];
    return '<circle cx="12" cy="12" r="9"/>' + P.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.4" fill="currentColor"/>'; }).join('');
  }
  var I = {
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
    projector: '<rect x="3" y="5" width="12" height="9" rx="1.5"/><path d="M9 14v5M6 19h6M18 7l3-2M18 9.5h3.5M18 12l3 2"/>',
    panelRound: '<path d="M3 5h18"/><circle cx="12" cy="14" r="6.5"/><circle cx="12" cy="14" r="3"/>',
    panelSquare: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="7.5" y="7.5" width="9" height="9" rx="1"/>',
    strip: '<path d="M2 6c4 7 8 7 10 1 2 6 6 6 10-1"/><circle cx="6" cy="12.3" r="1.5"/><circle cx="12" cy="8" r="1.5"/><circle cx="18" cy="12.3" r="1.5"/>',
    bracket: '<rect x="2" y="9" width="20" height="6" rx="3"/><path d="M7 12h10"/>',
    fixture: '<path d="M4 16a8 8 0 0 1 16 0z"/><path d="M12 3v5M9 20h6"/>',
    outdoor: '<path d="M12 3v3M5 10l2-4h10l2 4zM7 10v11M17 10v11M10 14h4"/>',
    powerStrip: '<rect x="3" y="8" width="18" height="8" rx="2"/><circle cx="8" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="16" cy="12" r="1"/>',
    shieldBolt: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M13 8l-3 5h4l-3 5"/>',
    outlet: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9.5" cy="12" r="1"/><circle cx="14.5" cy="12" r="1"/>',
    plug: '<path d="M9 3v5M15 3v5M6 8h12v4a6 6 0 0 1-12 0zM12 18v3"/>',
    fan: '<circle cx="12" cy="12" r="9"/><path d="M12 12c0-4 1-6 3-6s2 3-3 6zM12 12c4 0 6 1 6 3s-3 2-6-3zM12 12c0 4-1 6-3 6s-2-3 3-6zM12 12c-4 0-6-1-6-3s3-2 6 3z"/>',
    antenna: '<path d="M12 12v9M8 21h8M6 6a8 8 0 0 0 0 8M18 6a8 8 0 0 1 0 8M9 8.5a4 4 0 0 0 0 3M15 8.5a4 4 0 0 1 0 3"/><circle cx="12" cy="10" r="1.2"/>',
    heater: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9v6M12 9v6M16 9v6"/>',
    tubeFrame: '<rect x="2" y="8" width="20" height="8" rx="1.5"/><path d="M5 12h14M2 5h20"/>',
    transformer: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
    halogenSocket: '<path d="M9 3v4M15 3v4M7 7h10l-1 8a4 4 0 0 1-8 0zM12 19v2"/>',
    battery: '<rect x="3" y="8" width="16" height="9" rx="2"/><path d="M21 11v3M7 12.5h4M9 10.5v4"/>',
    duct: '<rect x="3" y="7" width="18" height="10" rx="1"/><path d="M3 12h18M8 7v10M16 7v10"/>',
    pipe: '<path d="M4 8h16M4 16h16"/><ellipse cx="4" cy="12" rx="1.6" ry="4"/><ellipse cx="20" cy="12" rx="1.6" ry="4"/>',
    elbow: '<path d="M4 4v10a6 6 0 0 0 6 6h10M10 4v7.5a2.5 2.5 0 0 0 2.5 2.5H20"/>',
    photocell: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
    fusebox: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h8"/>',
    wire: '<path d="M3 12c3-6 6 6 9 0s6 6 9 0"/>',
    wire2: '<path d="M3 9c3-5 6 5 9 0s6 5 9 0M3 16c3-5 6 5 9 0s6 5 9 0"/>',
    phone: '<path d="M6 3h12v5l-3 2v3a3 3 0 0 1-6 0V9L6 8zM12 16v5"/>',
    breaker: '<rect x="7" y="3" width="10" height="18" rx="1.5"/><rect x="10" y="7" width="4" height="6"/><path d="M9 17h6"/>',
    shieldCheck: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2.2 2.2L15.5 9.8"/>',
    contactor: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="9" r="2"/><path d="M8 15h8M8 18h8"/>',
    pushButton: '<circle cx="12" cy="10" r="5"/><path d="M6 15h12v5H6z"/>',
    stabilizer: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M6 12c1.5-4 3-4 4.5 0s3 4 4.5 0"/>',
    moldedBreaker: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M12 8v6M8 17h8"/>',
    limit: '<rect x="4" y="12" width="12" height="8" rx="1"/><path d="M10 12V6l6-3M6 20v1M14 20v1"/>',
    gauge: '<circle cx="12" cy="13" r="8"/><path d="M12 13l4-4M12 6.5V8M5.5 13H7M17 13h1.5"/>',
    terminal: '<rect x="3" y="9" width="18" height="8" rx="1"/><path d="M7.5 9v8M12 9v8M16.5 9v8M5 5v4M10 5v4M14 5v4M19 5v4"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/>',
    cable1: dots(1), cable2: dots(2), cable3: dots(3), cable4: dots(4), cable5: dots(5), cableMulti: dots(7)
  };
  var BY = { '10': 'bulb', '11': 'projector', '12': 'panelRound', '13': 'panelSquare', '14': 'strip', '15': 'bracket',
    '16': 'fixture', '17': 'outdoor', '21': 'powerStrip', '22': 'shieldBolt', '23': 'outlet', '24': 'plug', '25': 'fan',
    '26': 'antenna', '27': 'heater', '28': 'tubeFrame', '29': 'transformer', '30': 'halogenSocket', '31': 'battery',
    '35': 'duct', '36': 'pipe', '37': 'elbow', '38': 'photocell', '39': 'fusebox', '45': 'wire', '46': 'wire2',
    '47': 'phone', '50': 'cable1', '51': 'cable2', '52': 'cable3', '53': 'cable4', '54': 'cable5', '55': 'cableMulti',
    '60': 'breaker', '61': 'shieldCheck', '62': 'contactor', '63': 'pushButton', '64': 'stabilizer', '65': 'moldedBreaker',
    '66': 'limit', '68': 'gauge', '69': 'terminal', '99': 'box' };
  /* ---- ایکن «نوع کالا» (زیردسته) — هر زیردسته ایکن مخصوص خودش را دارد.
     کلید: کد نوع کالا ← برچسب زیردسته (همان برچسب data/subtypes.js) ← کلید ایکن در SI.
     زیردسته‌ای که اینجا نباشد، ایکن نوع کالای مادر را می‌گیرد. */
  var SI = {
    globe: '<circle cx="12" cy="10" r="6.5"/><path d="M9.5 17.5h5M10 20h4"/>',
    cyl: '<rect x="7.5" y="3" width="9" height="13" rx="3.5"/><path d="M9.5 19h5M10 21h4"/>',
    ufo: '<path d="M3 13c0-4 4-7 9-7s9 3 9 7z"/><path d="M7.5 13v3h9v-3M10 19.5h4"/>',
    tear: '<path d="M12 2.5c3.2 3 5 5.5 5 8.2a5 5 0 0 1-10 0c0-2.7 1.8-5.2 5-8.2z"/><path d="M10 18.5h4M10.5 21h3"/>',
    candle: '<path d="M12 2c2 2 3 3.6 3 5.4a3 3 0 0 1-6 0C9 5.6 10 4 12 2z"/><path d="M9 11.5h6v5H9zM10 19.5h4"/>',
    tubeLamp: '<rect x="2" y="9.5" width="20" height="5" rx="2.5"/><path d="M4.5 6.5v11M19.5 6.5v11"/>',
    pll: '<path d="M8 3v11a4 4 0 0 0 8 0V3M9.5 20h5"/>',
    halo: '<circle cx="12" cy="9" r="5.5"/><path d="M9 15v5M15 15v5"/>',
    filament: '<circle cx="12" cy="10" r="6.5"/><path d="M9 13c1-4 2-4 3 0s2 4 3 0M10 19.5h4"/>',
    spiral: '<path d="M9 18V8a3 3 0 0 1 6 0v10M9 11.5h6M9 8.5h6M9 14.5h6M8 21h8"/>',
    highbay: '<path d="M4 12a8 8 0 0 1 16 0z"/><path d="M12 2.5v2M8.5 16v4M12 16v5M15.5 16v4"/>',
    panel6060: '<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M3 12h18M12 3v18"/>',
    eyeLamp: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/>',
    hose: '<path d="M2 15c3-9 6 9 10 0s7 9 10 0"/>',
    fairy: '<path d="M3 5c4 4 14 4 18 0M7 8.5v2.5M12 9.5v2.5M17 8.5v2.5"/><circle cx="7" cy="13.5" r="1.8"/><circle cx="12" cy="14.5" r="1.8"/><circle cx="17" cy="13.5" r="1.8"/>',
    dotsLine: '<path d="M2 12h20"/><circle cx="5" cy="12" r="1.7"/><circle cx="10" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="20" cy="12" r="1.7"/>',
    conn: '<rect x="2.5" y="9" width="7.5" height="6" rx="1"/><rect x="14" y="9" width="7.5" height="6" rx="1"/><path d="M10 12h4"/>',
    track: '<path d="M3 4h18M8 4v4M16 4v4M6 8h4l-1 6H7zM14 8h4l-1 6h-2z"/>',
    chandelier: '<path d="M12 2v4M5 8.5h14M6.5 8.5c0 4 2.5 6 5.5 6s5.5-2 5.5-6M8 19h8M12 14.5V19"/>',
    buried: '<path d="M2 18h20"/><path d="M7.5 18v-3a4.5 4.5 0 0 1 9 0v3M12 4v3M5.5 7l1.8 1.8M18.5 7l-1.8 1.8"/>',
    waterproof: '<rect x="4" y="12" width="16" height="4" rx="1.5"/><path d="M12 2.5c1.8 2.5 3 4 3 5.5a3 3 0 0 1-6 0c0-1.5 1.2-3 3-5.5zM7 19v2M12 19v2M17 19v2"/>',
    emergency: '<rect x="4" y="10" width="16" height="9" rx="2"/><path d="M12 12.5v3M12 17.5v.01M12 3v3M5.5 5.5l2 2M18.5 5.5l-2 2"/>',
    ceiling: '<path d="M3 3.5h18M12 3.5v4"/><path d="M5 17a7 7 0 0 1 14 0zM9 20.5h6"/>',
    wall: '<path d="M3 3v18M3 12h5"/><path d="M8 8h7l3 7H8z"/>',
    moon: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>',
    reel: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3"/><path d="M12 3.5V9M12 15v5.5M3.5 12H9M15 12h5.5"/>',
    stripEarth: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M12 9.5v3M9 12.5h6M10.2 14.5h3.6"/>',
    plug3: '<path d="M8 3v4M12 3v4M16 3v4M6 7h12v5a6 6 0 0 1-12 0zM12 18v3"/>',
    tee: '<path d="M12 3v7M12 10l-6 5v5M12 10l6 5v5M12 10v10"/>',
    socketBulb: '<path d="M8 3.5h8v4H8zM8 7.5l-1 5.5h10l-1-5.5M9 13v4.5h6V13"/>',
    swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    tile: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h16M12 4v16"/>',
    cover: '<path d="M4 19V10a8 8 0 0 1 16 0v9zM8 19v-5h8v5"/>',
    fanBox: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="6"/><path d="M12 12c0-2.5.7-4 2-4s1.3 2-2 4zM12 12c2.5 0 4 .7 4 2s-2 1.3-4-2zM12 12c0 2.5-.7 4-2 4s-1.3-2 2-4zM12 12c-2.5 0-4-.7-4-2s2-1.3 4 2z"/>',
    rabbit: '<path d="M12 20v-6M8 20h8M12 14L7 4M12 14l5-10"/>',
    adapter: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M13 8.5l-3 3.5h4l-3 3.5"/>',
    appliance: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="14" r="3.5"/><path d="M8.5 7h.01M11.5 7h.01"/>',
    starter: '<rect x="8" y="3" width="8" height="14" rx="3.5"/><path d="M10 17v4M14 17v4"/>',
    remote: '<rect x="8" y="2.5" width="8" height="19" rx="3"/><circle cx="12" cy="7" r="1.2"/><path d="M10 12h4M10 15h4M10 18h4"/>',
    driver: '<rect x="4" y="7" width="16" height="10" rx="1.5"/><path d="M4 12H1.5M20 12h2.5M8 7V4.5M16 7V4.5"/>',
    sensor: '<circle cx="12" cy="12" r="2.5"/><path d="M6.5 6.5a8 8 0 0 0 0 11M17.5 6.5a8 8 0 0 1 0 11M9 9a4 4 0 0 0 0 6M15 9a4 4 0 0 1 0 6"/>',
    solder: '<path d="M4 20l7-7M10.5 13.5l6.5-6.5 3 3-6.5 6.5zM15.5 5.5l3 3"/>',
    phaseTester: '<path d="M4.5 21l8-8"/><rect x="11" y="3" width="6" height="11" rx="1.5" transform="rotate(35 14 8.5)"/>',
    battAA: '<rect x="8" y="5.5" width="8" height="15" rx="1.5"/><path d="M10.5 3h3v2.5h-3z"/>',
    battCoin: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8.5v7M8.5 12h7"/>',
    batt9v: '<rect x="7" y="6.5" width="10" height="14.5" rx="1.5"/><circle cx="10" cy="4.5" r="1.3"/><circle cx="14" cy="4.5" r="1.3"/>',
    tape: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.2"/><path d="M20 15l2 3"/>',
    coupling: '<path d="M2.5 8.5h5v7h-5zM16.5 8.5h5v7h-5zM7.5 10h9v4h-9z"/>',
    jbox: '<rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="12" r="3.2"/>',
    cableTie: '<circle cx="12" cy="8.5" r="5.5"/><path d="M12 14v7M10 21h4"/>',
    breaker3: '<rect x="2.5" y="4" width="19" height="16" rx="1.5"/><path d="M8 8v6M12 8v6M16 8v6M6 17.5h12"/>',
    voltProt: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M13 7.5l-3 4.5h4l-3 4.5"/>'
  };
  var BYSUB = {
    '10': { 'لامپ حبابی': 'globe', 'لامپ استوانه‌ای': 'cyl', 'لامپ سفینه‌ای': 'ufo', 'لامپ اشکی': 'tear', 'لامپ شمعی': 'candle',
      'لامپ مهتابی (تیوپ)': 'tubeLamp', 'لامپ مهتابی FPL': 'tubeLamp', 'لامپ مهتابی PLC-PLL': 'pll', 'لامپ هالوژن': 'halo',
      'لامپ فیلامن': 'filament', 'لامپ کم مصرف': 'spiral', 'لامپ سوله‌ای': 'highbay', 'لامپ متال هالید': 'highbay' },
    '12': { 'چراغ چشمی': 'eyeLamp', 'پنل توکار ۶۰×۶۰': 'panel6060', 'پنل توکار مربع': 'panelSquare', 'پنل توکار گرد': 'panelRound' },
    '13': { 'پنل روکار ۶۰×۶۰': 'panel6060', 'پنل روکار مربع': 'panelSquare', 'پنل روکار گرد': 'panelRound' },
    '14': { 'ریسه شلنگی': 'hose', 'ریسه چراغانی': 'fairy', 'ریسه لاین': 'dotsLine', 'ریسه نخودی': 'dotsLine', 'رابط ریسه': 'conn' },
    '16': { 'چراغ ریلی': 'track', 'چراغ دکوراتیو': 'chandelier', 'چراغ دفنی': 'buried', 'چراغ ضد آب': 'waterproof',
      'چراغ اضطراری': 'emergency', 'چراغ سقفی': 'ceiling', 'چراغ دیواری': 'wall', 'چراغ خواب': 'moon' },
    '21': { 'رابط قرقره': 'reel', 'رابط ارت‌دار': 'stripEarth', 'رابط جمع‌شو (رورو)': 'reel' },
    '22': { 'محافظ ارت‌دار': 'stripEarth', 'تبدیل محافظ': 'swap' },
    '23': { 'پریز': 'outlet', 'کلید': 'pushButton' },
    '24': { 'دوشاخه': 'plug', 'سه شاخه': 'plug3', 'مادگی': 'outlet', 'سه راهی': 'tee', 'سرپیچ': 'socketBulb', 'تبدیل': 'swap', 'تایل': 'tile', 'کاور': 'cover' },
    '25': { 'هواکش خانگی': 'fan', 'هواکش صنعتی': 'fanBox' },
    '26': { 'آنتن هوایی': 'antenna', 'آنتن رومیزی': 'rabbit', 'منبع تغذیه': 'adapter' },
    '27': { 'پنکه': 'fan', 'بخاری': 'heater', 'لوازم خانگی برقی': 'appliance' },
    '29': { 'استارت مهتابی': 'starter', 'ریموت': 'remote', 'درایور': 'driver', 'سنسور': 'sensor', 'هویه': 'solder', 'فازمتر': 'phaseTester',
      'پاورسوئیچینگ (منبع تغذیه)': 'adapter' },
    '31': { 'باطری قلمی': 'battAA', 'باطری نیم قلمی': 'battAA', 'باطری متوسط': 'battAA', 'باطری سکه‌ای': 'battCoin', 'باطری ۹ ولت': 'batt9v', 'چسب برق': 'tape' },
    '37': { 'زانو': 'elbow', 'بوشن': 'coupling', 'قوطی کلید': 'jbox' },
    '60': { 'کلید مینیاتوری تک فاز': 'breaker', 'کلید مینیاتوری سه فاز': 'breaker3' },
    '61': { 'محافظ ولتاژ': 'voltProt', 'محافظ جان تک فاز': 'shieldCheck', 'محافظ جان سه فاز': 'breaker3', 'محافظ جان ترکیبی': 'shieldCheck' },
    '69': { 'بست کمربندی': 'cableTie', 'ترمینال برق': 'terminal' },
    '99': { 'فازمتر': 'phaseTester', 'تستر لامپ': 'globe', 'ساعت دیواری': 'gauge' }
  };
  function wrap(p, size) {
    return '<svg class="hg-ic" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }
  window.HG_TYPE_ICONS = {
    byType: BY, paths: I, subPaths: SI, bySub: BYSUB,
    svg: function (code, size) {
      var k = BY[String(code)], p = k && I[k];
      if (!p) { return ''; }
      return wrap(p, size || 22);
    },
    /* ایکن یک زیردسته؛ اگر نداشت ایکن نوع کالای مادر */
    svgSub: function (code, label, size) {
      var m = BYSUB[String(code)], k = m && m[label], p = k && (SI[k] || I[k]);
      if (!p) { return this.svg(code, size); }
      return wrap(p, size || 22);
    }
  };
})();
