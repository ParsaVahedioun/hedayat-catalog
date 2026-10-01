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
  window.HG_TYPE_ICONS = {
    byType: BY, paths: I,
    svg: function (code, size) {
      var k = BY[String(code)], p = k && I[k];
      if (!p) { return ''; }
      size = size || 22;
      return '<svg class="hg-ic" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
    }
  };
})();
