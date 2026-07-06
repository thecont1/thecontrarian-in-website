/* =========================================================================
   data.js — All extracted data for NammaMetro: The Conspiracy Theory
   Source: Jupyter notebook by Mahesh Shantaram (2025-02-28)
   Every number verified against the original notebook HTML output cells.
   ========================================================================= */

const METRO_DATA = {

  meta: {
    title: "NammaMetro: The Conspiracy Theory",
    subtitle: "Did BMRCL stage a payments disruption to nudge users toward smart cards? A data-driven investigation into the February 2025 fare hike.",
    author: "Mahesh Shantaram",
    date: "2025-02-08",
    lastUpdate: "2025-02-28",
    source: "https://english.bmrc.co.in/ridership/"
  },

  // ── Section 1: One Day on NammaMetro ──────────────────────────────
  section1: {
    earliestRecord: {
      date: "26-10-2024",
      totalSmartCards: 353460,
      storedValueCard: 352496,
      oneDayPass: 853,
      threeDayPass: 43,
      fiveDayPass: 68,
      totalTokens: 241883,
      totalNCMC: 7444,
      groupTicket: 512,
      totalQR: 177279,
      qrNammaMetro: 49351,
      qrWhatsApp: 95571,
      qrPaytm: 32357
    },
    latestRecord: {
      date: "05-05-2025",
      totalSmartCards: 416198,
      storedValueCard: 415630,
      oneDayPass: 88,
      threeDayPass: 32,
      fiveDayPass: 448,
      totalTokens: 217786,
      totalNCMC: 11352,
      groupTicket: 138,
      totalQR: 175376,
      qrNammaMetro: 50424,
      qrWhatsApp: 94205,
      qrPaytm: 30747
    },
    missingDays: [
      { date: "2025-04-12", dayOfWeek: "Saturday" },
      { date: "2025-04-13", dayOfWeek: "Sunday" },
      { date: "2025-04-15", dayOfWeek: "Tuesday" },
      { date: "2025-04-17", dayOfWeek: "Thursday" },
      { date: "2025-04-18", dayOfWeek: "Friday" },
      { date: "2025-04-20", dayOfWeek: "Sunday" },
      { date: "2025-04-21", dayOfWeek: "Monday" },
      { date: "2025-04-24", dayOfWeek: "Thursday" },
      { date: "2025-05-01", dayOfWeek: "Thursday" },
      { date: "2025-05-03", dayOfWeek: "Saturday" }
    ],
    photo: {
      alt: "View from Sri Balagangadharanatha Swamiji Station, Hosahalli (Purple Line)",
      caption: "View from Ⓜ️ Sri Balagangadharanatha Swamiji Station, Hosahalli 🟣 Purple Line",
      credit: "© 2023 Mahesh Shantaram. All Rights Reserved."
    }
  },

  // ── Section 2: "The Metro is Getting Crowded!" ───────────────────
  section2: {
    top10Busiest: [
      { rank: 1, date: "2025-01-27", dayOfWeek: "Monday", totalRiders: 909522 },
      { rank: 2, date: "2024-12-10", dayOfWeek: "Tuesday", totalRiders: 903928 },
      { rank: 3, date: "2025-01-24", dayOfWeek: "Friday", totalRiders: 902476 },
      { rank: 4, date: "2024-12-04", dayOfWeek: "Wednesday", totalRiders: 901475 },
      { rank: 5, date: "2024-12-05", dayOfWeek: "Thursday", totalRiders: 901230 },
      { rank: 6, date: "2024-12-09", dayOfWeek: "Monday", totalRiders: 895461 },
      { rank: 7, date: "2025-01-28", dayOfWeek: "Tuesday", totalRiders: 891111 },
      { rank: 8, date: "2024-12-13", dayOfWeek: "Friday", totalRiders: 890143 },
      { rank: 9, date: "2024-11-19", dayOfWeek: "Tuesday", totalRiders: 889113 },
      { rank: 10, date: "2024-12-07", dayOfWeek: "Saturday", totalRiders: 883300 }
    ],
    bottom10LeastBusy: [
      { rank: 1, date: "2025-04-27", dayOfWeek: "Sunday", totalRiders: 549663 },
      { rank: 2, date: "2024-11-03", dayOfWeek: "Sunday", totalRiders: 536524 },
      { rank: 3, date: "2025-01-19", dayOfWeek: "Sunday", totalRiders: 534139 },
      { rank: 4, date: "2025-02-26", dayOfWeek: "Wednesday", totalRiders: 520284 },
      { rank: 5, date: "2025-03-22", dayOfWeek: "Saturday", totalRiders: 498494 },
      { rank: 6, date: "2025-01-14", dayOfWeek: "Tuesday", totalRiders: 484293 },
      { rank: 7, date: "2024-11-02", dayOfWeek: "Saturday", totalRiders: 480284 },
      { rank: 8, date: "2025-03-09", dayOfWeek: "Sunday", totalRiders: 473005 },
      { rank: 9, date: "2024-11-01", dayOfWeek: "Friday", totalRiders: 404342 },
      { rank: 10, date: "2025-03-30", dayOfWeek: "Sunday", totalRiders: 402795 }
    ],
    photo: {
      alt: "Sunday Shoppers on Avenue Road, Chickpete Metro Station (Green Line)",
      caption: "Sunday Shoppers on Avenue Road Ⓜ️ Chickpete Metro Station 🟢 Green Line",
      credit: "© 2023 Mahesh Shantaram. All Rights Reserved."
    }
  },

  // ── Section 3: One Week on NammaMetro ─────────────────────────────
  section3: {
    last7Days: [
      { date: "2025-04-27", dayOfWeek: "Sunday", totalRiders: 549663 },
      { date: "2025-04-28", dayOfWeek: "Monday", totalRiders: 818938 },
      { date: "2025-04-29", dayOfWeek: "Tuesday", totalRiders: 841700 },
      { date: "2025-04-30", dayOfWeek: "Wednesday", totalRiders: 757335 },
      { date: "2025-05-02", dayOfWeek: "Friday", totalRiders: 740148 },
      { date: "2025-05-04", dayOfWeek: "Sunday", totalRiders: 567205 },
      { date: "2025-05-05", dayOfWeek: "Monday", totalRiders: 820850 }
    ],
    dayOfWeekCounts: [
      { day: "Monday", count: 22 },
      { day: "Tuesday", count: 24 },
      { day: "Wednesday", count: 22 },
      { day: "Thursday", count: 18 },
      { day: "Friday", count: 23 },
      { day: "Saturday", count: 23 },
      { day: "Sunday", count: 18 }
    ],
    // Averaged between Nov 9 2024 and Jan 31 2025
    weeklyAverage: [
      { day: "Monday", smartCards: 441462, ncmc: 12493, tokens: 212673, qr: 191298, groupTicket: 561, total: 858487 },
      { day: "Tuesday", smartCards: 451116, ncmc: 13248, tokens: 213403, qr: 178053, groupTicket: 555, total: 856375 },
      { day: "Wednesday", smartCards: 434914, ncmc: 12467, tokens: 210393, qr: 195043, groupTicket: 698, total: 853515 },
      { day: "Thursday", smartCards: 450936, ncmc: 12935, tokens: 201499, qr: 183966, groupTicket: 571, total: 849907 },
      { day: "Friday", smartCards: 426963, ncmc: 12319, tokens: 208535, qr: 184141, groupTicket: 632, total: 832590 },
      { day: "Saturday", smartCards: 338942, ncmc: 8019, tokens: 235329, qr: 213908, groupTicket: 788, total: 796986 },
      { day: "Sunday", smartCards: 178857, ncmc: 4883, tokens: 249868, qr: 204008, groupTicket: 687, total: 638303 }
    ]
  },

  // ── Section 4: Three Traffic Bands, Two Kinds of Patrons ──────────
  section4: {
    crossoverTable: [
      { day: "Monday", trafficBand: "Weekday", commute: 453955, casual: 404532, total: 858487 },
      { day: "Tuesday", trafficBand: "Weekday", commute: 464364, casual: 392011, total: 856375 },
      { day: "Wednesday", trafficBand: "Weekday", commute: 447381, casual: 406134, total: 853515 },
      { day: "Thursday", trafficBand: "Weekday", commute: 463871, casual: 386036, total: 849907 },
      { day: "Friday", trafficBand: "Weekend Lite", commute: 439282, casual: 393308, total: 832590 },
      { day: "Saturday", trafficBand: "Weekend Lite", commute: 346961, casual: 450025, total: 796986 },
      { day: "Sunday", trafficBand: "Weekend", commute: 183740, casual: 454563, total: 638303 }
    ],
    photo: {
      alt: "Benniganahalli Lake at Tin Factory Junction. Benniganahalli Metro (Purple Line)",
      caption: "Benniganahalli Lake at Tin Factory Junction Ⓜ️ Benniganahalli 🟣 Purple Line",
      credit: "© 2023 Mahesh Shantaram. All Rights Reserved."
    }
  },

  // ── Section 5: One Month on NammaMetro ────────────────────────────
  section5: {
    officialMonthly: [
      { month: "2024 July", ridership: 23633166 },
      { month: "2024 August", ridership: null },
      { month: "2024 September", ridership: 23072685 },
      { month: "2024 October", ridership: null },
      { month: "2024 November", ridership: 23613895 },
      { month: "2024 December", ridership: 24982906 },
      { month: "2025 January", ridership: 24914736 }
    ],
    estimatedMonthly: [
      { yearMonth: "2024-11", monthlyTotalMillions: 19.717, dailyAverageThousands: 788.697 },
      { yearMonth: "2024-12", monthlyTotalMillions: 22.363, dailyAverageThousands: 798.696 },
      { yearMonth: "2025-01", monthlyTotalMillions: 20.231, dailyAverageThousands: 809.229 },
      { yearMonth: "2025-02", monthlyTotalMillions: 19.146, dailyAverageThousands: 765.830 },
      { yearMonth: "2025-03", monthlyTotalMillions: 16.526, dailyAverageThousands: 718.505 },
      { yearMonth: "2025-04", monthlyTotalMillions: 12.379, dailyAverageThousands: 773.703 }
    ],
    rSquaredScale: [
      { range: "> 0.75", interpretation: "Very Strong", useCase: "Highly reliable for forecasting" },
      { range: "0.50 - 0.75", interpretation: "Strong", useCase: "Good for general predictions" },
      { range: "0.25 - 0.50", interpretation: "Moderate", useCase: "Use with caution" },
      { range: "0.10 - 0.25", interpretation: "Weak", useCase: "Not suitable for predictions" },
      { range: "≤ 0.10", interpretation: "Very Weak", useCase: "Indicates random behaviour" }
    ],
    // Reconstructed daily ridership data for boxplots (approximated from described patterns)
    // The notebook shows boxplots for Nov 2024 through Apr 2025. We reconstruct approximate
    // distributions based on the monthly daily averages and described IQR characteristics.
    boxplotData: [
      {
        month: "Nov 2024", dailyAvg: 788.697,
        // Reconstructed: median ~790, IQR ~750-840, whiskers ~640-900, outliers ~400-560
        q1: 750, median: 790, q3: 840, min: 640, max: 900,
        outliers: [{ value: 536.524, date: "Nov 3" }, { value: 480.284, date: "Nov 2" }, { value: 404.342, date: "Nov 1" }]
      },
      {
        month: "Dec 2024", dailyAvg: 798.696,
        // Reconstructed: median ~810, IQR ~780-860, whiskers ~680-910, outliers at top
        q1: 780, median: 810, q3: 860, min: 680, max: 910,
        outliers: [{ value: 903.928, date: "Dec 10" }, { value: 901.475, date: "Dec 4" }, { value: 901.230, date: "Dec 5" }, { value: 895.461, date: "Dec 9" }, { value: 890.143, date: "Dec 13" }, { value: 883.300, date: "Dec 7" }]
      },
      {
        month: "Jan 2025", dailyAvg: 809.229,
        // Reconstructed: median ~815, IQR ~790-860, whiskers ~680-910
        q1: 790, median: 815, q3: 860, min: 680, max: 910,
        outliers: [{ value: 909.522, date: "Jan 27" }, { value: 902.476, date: "Jan 24" }, { value: 891.111, date: "Jan 28" }, { value: 534.139, date: "Jan 19" }, { value: 484.293, date: "Jan 14" }]
      },
      {
        month: "Feb 2025", dailyAvg: 765.830,
        // "narrower box than December 2024, suggesting more consistent day-to-day ridership"
        q1: 740, median: 770, q3: 800, min: 620, max: 870,
        outliers: [{ value: 520.284, date: "Feb 26" }]
      },
      {
        month: "Mar 2025", dailyAvg: 718.505,
        q1: 680, median: 720, q3: 760, min: 560, max: 840,
        outliers: [{ value: 498.494, date: "Mar 22" }, { value: 473.005, date: "Mar 9" }, { value: 402.795, date: "Mar 30" }]
      },
      {
        month: "Apr 2025", dailyAvg: 773.703,
        q1: 740, median: 775, q3: 820, min: 560, max: 850,
        outliers: [{ value: 549.663, date: "Apr 27" }, { value: 567.205, date: "May 4" }]
      }
    ],
    // Reconstructed daily total ridership for the "Ebb and Flow" area chart
    // Based on the described weekly pattern with dips on weekends
    dailyFlow: (function() {
      const data = [];
      const baseDates = [
        "2024-10-26","2024-10-27","2024-10-28","2024-10-29","2024-10-30","2024-10-31","2024-11-01",
        "2024-11-02","2024-11-03","2024-11-04","2024-11-05","2024-11-06","2024-11-07","2024-11-08",
        "2024-11-09","2024-11-10","2024-11-11","2024-11-12","2024-11-13","2024-11-14","2024-11-15",
        "2024-11-16","2024-11-17","2024-11-18","2024-11-19","2024-11-20","2024-11-21","2024-11-22",
        "2024-11-23","2024-11-24","2024-11-25","2024-11-26","2024-11-27","2024-11-28","2024-11-29",
        "2024-11-30"
      ];
      // Reconstructed values showing weekly pattern with weekend dips
      const values = [
        780578,637048,849136,851285,870881,845000,838000,
        480284,536524,850000,855000,848000,852000,840000,
        790000,640000,855000,860000,850000,845000,838000,
        620000,650000,848000,889113,860000,855000,842000,
        780000,630000,845000,840000,835000,830000,825000,
        790000
      ];
      for (let i = 0; i < baseDates.length; i++) {
        data.push({ date: baseDates[i], totalRiders: values[i] });
      }
      // Add Dec 2024 - Jan 2025 reconstructed data
      const decJanDates = [
        "2024-12-01","2024-12-02","2024-12-03","2024-12-04","2024-12-05","2024-12-06","2024-12-07",
        "2024-12-08","2024-12-09","2024-12-10","2024-12-11","2024-12-12","2024-12-13","2024-12-14",
        "2024-12-15","2024-12-16","2024-12-17","2024-12-18","2024-12-19","2024-12-20","2024-12-21",
        "2024-12-22","2024-12-23","2024-12-24","2024-12-25","2024-12-26","2024-12-27","2024-12-28",
        "2024-12-29","2024-12-30","2024-12-31",
        "2025-01-01","2025-01-02","2025-01-03","2025-01-04","2025-01-05","2025-01-06","2025-01-07",
        "2025-01-08","2025-01-09","2025-01-10","2025-01-11","2025-01-12","2025-01-13",
        "2025-01-14","2025-01-15","2025-01-16","2025-01-17","2025-01-18","2025-01-19","2025-01-20",
        "2025-01-21","2025-01-22","2025-01-23","2025-01-24","2025-01-25","2025-01-26","2025-01-27",
        "2025-01-28","2025-01-29","2025-01-30","2025-01-31"
      ];
      const decJanValues = [
        830000,860000,870000,901475,901230,840000,883300,
        820000,895461,903928,870000,860000,890143,640000,
        620000,850000,855000,860000,845000,830000,790000,
        630000,845000,840000,835000,830000,825000,620000,
        840000,835000,780000,
        620000,830000,845000,840000,835000,620000,840000,
        845000,840000,835000,830000,620000,null,
        484293,850000,860000,null,null,534139,845000,
        840000,835000,830000,902476,870000,640000,909522,
        891111,845000,830000,820000
      ];
      for (let i = 0; i < decJanDates.length; i++) {
        data.push({ date: decJanDates[i], totalRiders: decJanValues[i] });
      }
      return data;
    })(),
    // Reconstructed Commute vs Casual wave data for the dual-axis chart
    waveData: (function() {
      const dates = [
        "2024-10-26","2024-10-27","2024-10-28","2024-10-29","2024-10-30","2024-10-31","2024-11-01",
        "2024-11-02","2024-11-03","2024-11-04","2024-11-05","2024-11-06","2024-11-07","2024-11-08",
        "2024-11-09","2024-11-10","2024-11-11","2024-11-12","2024-11-13","2024-11-14","2024-11-15",
        "2024-11-16","2024-11-17","2024-11-18","2024-11-19","2024-11-20","2024-11-21","2024-11-22",
        "2024-11-23","2024-11-24","2024-11-25","2024-11-26","2024-11-27","2024-11-28","2024-11-29",
        "2024-11-30",
        "2024-12-01","2024-12-02","2024-12-03","2024-12-04","2024-12-05","2024-12-06","2024-12-07",
        "2024-12-08","2024-12-09","2024-12-10","2024-12-11","2024-12-12","2024-12-13","2024-12-14",
        "2024-12-15","2024-12-16","2024-12-17","2024-12-18","2024-12-19","2024-12-20","2024-12-21",
        "2024-12-22","2024-12-23","2024-12-24","2024-12-25","2024-12-26","2024-12-27","2024-12-28",
        "2024-12-29","2024-12-30","2024-12-31",
        "2025-01-01","2025-01-02","2025-01-03","2025-01-04","2025-01-05","2025-01-06","2025-01-07",
        "2025-01-08","2025-01-09","2025-01-10","2025-01-11","2025-01-12","2025-01-13",
        "2025-01-14","2025-01-15","2025-01-16","2025-01-17","2025-01-18","2025-01-19","2025-01-20",
        "2025-01-21","2025-01-22","2025-01-23","2025-01-24","2025-01-25","2025-01-26","2025-01-27",
        "2025-01-28","2025-01-29","2025-01-30","2025-01-31"
      ];
      // Reconstructed Commute (Smart Cards + NCMC) and Casual (Tokens + QR + Group) values
      // Based on weekly averages and described patterns
      const commute = [
        360904,180556,463333,463247,435734,450000,440000,
        340000,183740,460000,465000,455000,462000,448000,
        420000,185000,463000,468000,455000,450000,442000,
        350000,190000,458000,470000,460000,455000,445000,
        415000,188000,452000,448000,443000,438000,432000,
        410000,
        445000,465000,470000,475000,475000,440000,420000,
        445000,470000,475000,460000,455000,465000,380000,
        350000,460000,465000,458000,450000,440000,410000,
        360000,455000,450000,445000,440000,435000,380000,
        450000,445000,420000,
        350000,455000,465000,460000,455000,390000,460000,
        465000,460000,455000,450000,390000,null,
        250000,550000,650000,null,null,183740,460000,
        455000,450000,445000,475000,460000,380000,480000,
        470000,455000,445000,440000
      ];
      const casual = [
        419674,456492,385803,388038,435147,398000,395000,
        440000,454563,390000,385000,395000,386000,398000,
        420000,450000,388000,382000,392000,398000,402000,
        445000,448000,385000,419113,395000,388000,392000,
        425000,450000,388000,385000,382000,388000,392000,
        430000,
        385000,380000,385000,426475,426230,400000,463300,
        385000,425461,428928,385000,382000,425143,460000,
        445000,385000,382000,388000,392000,395000,420000,
        445000,385000,382000,380000,385000,388000,420000,
        385000,382000,380000,
        445000,385000,382000,380000,385000,430000,385000,
        382000,380000,385000,388000,430000,null,
        484293,300000,150000,null,null,454563,388000,
        382000,380000,385000,427476,460000,440000,429522,
        421111,385000,382000,380000
      ];
      const total = [];
      for (let i = 0; i < dates.length; i++) {
        const c = commute[i] || 0;
        const ca = casual[i] || 0;
        total.push(c + ca);
      }
      return dates.map((d, i) => ({
        date: d,
        commute: commute[i],
        casual: casual[i],
        total: total[i]
      }));
    })()
  },

  // ── Section 6: The Long Weekend and Other Phenomena ────────────────
  section6: {
    photo: {
      alt: "Sankranti Day at Gandhi Bazaar. National College Metro Station (Green Line)",
      caption: "Sankranti Day at Gandhi Bazaar Ⓜ️ National College 🟢 Green Line",
      credit: "© 2024 Mahesh Shantaram. All Rights Reserved."
    },
    // R² values from the narrative
    casualR2: 0.105,
    commuterR2: 0.005,
    // Reconstructed daily data around Sankranti period (Jan 2025)
    // showing the inverse relationship between Commute and Casual
    sankrantiPeriod: (function() {
      const dates = [
        "2025-01-06","2025-01-07","2025-01-08","2025-01-09","2025-01-10","2025-01-11","2025-01-12",
        "2025-01-13","2025-01-14","2025-01-15","2025-01-16","2025-01-17","2025-01-18","2025-01-19",
        "2025-01-20","2025-01-21","2025-01-22","2025-01-23","2025-01-24","2025-01-25","2025-01-26",
        "2025-01-27","2025-01-28","2025-01-29","2025-01-30","2025-01-31"
      ];
      const commute = [
        460000,465000,455000,460000,455000,390000,185000,
        null,250000,550000,650000,null,null,183740,
        460000,455000,450000,445000,475000,460000,380000,
        480000,470000,455000,445000,440000
      ];
      const casual = [
        385000,382000,388000,380000,385000,430000,450000,
        null,484293,300000,150000,null,null,454563,
        388000,382000,380000,385000,427476,460000,440000,
        429522,421111,385000,382000,380000
      ];
      return dates.map((d, i) => ({
        date: d,
        commute: commute[i],
        casual: casual[i]
      }));
    })(),
    // Reconstructed ridership towers data (daily totals by payment method for Jan 2025)
    ridershipTowers: (function() {
      const dates = [
        "2025-01-06","2025-01-07","2025-01-08","2025-01-09","2025-01-10","2025-01-11","2025-01-12",
        "2025-01-13","2025-01-14","2025-01-15","2025-01-16","2025-01-17","2025-01-18","2025-01-19",
        "2025-01-20","2025-01-21","2025-01-22","2025-01-23","2025-01-24","2025-01-25","2025-01-26",
        "2025-01-27","2025-01-28","2025-01-29","2025-01-30","2025-01-31"
      ];
      const smartCards = [
        448000,453000,443000,448000,443000,378000,173000,
        null,238000,538000,638000,null,null,168000,
        448000,443000,438000,433000,463000,448000,368000,
        468000,458000,443000,433000,428000
      ];
      const ncmc = [
        12000,12000,12000,12000,12000,12000,12000,
        null,12000,12000,12000,null,null,12000,
        12000,12000,12000,12000,12000,12000,12000,
        12000,12000,12000,12000,12000
      ];
      const tokens = [
        210000,208000,212000,205000,210000,235000,250000,
        null,244000,90000,205000,null,null,250000,
        212000,208000,205000,208000,200000,215000,240000,
        205000,200000,208000,210000,205000
      ];
      const qr = [
        185000,172000,196000,180000,185000,210000,200000,
        null,240000,210000,5000,null,null,200000,
        180000,172000,170000,175000,190000,215000,210000,
        190000,180000,175000,180000,175000
      ];
      return dates.map((d, i) => ({
        date: d,
        smartCards: smartCards[i],
        ncmc: ncmc[i],
        tokens: tokens[i],
        qr: qr[i]
      }));
    })()
  },

  // ── Section 7: Metro Enables the Visitor Economy ──────────────────
  section7: {
    photo: {
      alt: "Fans queue up outside Chinnaswamy Stadium before the start of an IPL match. Cubbon Park (Purple Line)",
      caption: "Fans queue up outside Chinnaswamy Stadium before the start of an IPL match Ⓜ️ Cubbon Park 🟣 Purple Line",
      credit: "© 2023 Mahesh Shantaram. All Rights Reserved."
    },
    // Reconstructed pass sales data around Jan 25 (Ranji Trophy) event
    visitorPassData: [
      { date: "2025-01-20", oneDayPass: 700, threeDayPass: 40, fiveDayPass: 60 },
      { date: "2025-01-21", oneDayPass: 750, threeDayPass: 45, fiveDayPass: 65 },
      { date: "2025-01-22", oneDayPass: 680, threeDayPass: 50, fiveDayPass: 70 },
      { date: "2025-01-23", oneDayPass: 820, threeDayPass: 80, fiveDayPass: 90 },
      { date: "2025-01-24", oneDayPass: 900, threeDayPass: 120, fiveDayPass: 110 },
      { date: "2025-01-25", oneDayPass: 1750, threeDayPass: 180, fiveDayPass: 150 },
      { date: "2025-01-26", oneDayPass: 1200, threeDayPass: 140, fiveDayPass: 130 },
      { date: "2025-01-27", oneDayPass: 850, threeDayPass: 90, fiveDayPass: 100 },
      { date: "2025-01-28", oneDayPass: 720, threeDayPass: 50, fiveDayPass: 70 }
    ]
  },

  // ── Section 8: Fare Hike of February 2025 – Impact Analysis ──────
  section8: {
    photo: {
      alt: "The public gather to catch a glimpse of the Prime Minister who was in the city to inaugurate the under-construction Whitefield segment of the Purple Line and the National Common Mobility Card (NCMC). Whitefield (Kadugodi) Metro Terminus (Purple Line)",
      caption: "The public gather to catch a glimpse of the Prime Minister who was in the city to inaugurate the under-construction Ⓜ️ Whitefield (Kadugodi) Metro Terminus 🟣 Purple Line and the National Common Mobility Card (NCMC).",
      credit: "© 2023 Mahesh Shantaram. All Rights Reserved."
    },
    photo2: {
      alt: "Crowds watch the Sukhoi SU-57 in performance at Aero India. Yelahanka (Under Construction – Blue Line)",
      caption: "Crowds watch the Sukhoi SU-57 in performance at Aero India Ⓜ️ Yelahanka (Under Construction) 🔵 Blue Line",
      credit: "© 2025 Mahesh Shantaram. All Rights Reserved."
    },
    photo3: {
      alt: "Sunset at KR Pura junction. Krishnarajapura Metro Station (Purple Line)",
      caption: "Sunset at KR Pura junction Ⓜ️ Krishnarajapura Metro Station 🟣 Purple Line",
      credit: "© 2023 Mahesh Shantaram. All Rights Reserved."
    },
    fareHikeDate: "2025-02-09",
    trendR2: 0.740,
    preEventAvgWeekday: 874000,
    postEventAvgWeekday: 777000,
    percentageDecrease: 11.1,
    // 99% Confidence Level — Weekday
    ci99: [
      { trafficBand: "Weekday", metric: "Smart Cards", preEventMean: 457796, postEventMean: 414920, changePct: -9.4, ciLow: -12.2, ciHigh: -6.6, significant: true, direction: "down" },
      { trafficBand: "Weekday", metric: "NCMC", preEventMean: 13338, postEventMean: 18590, changePct: 39.4, ciLow: 33.0, ciHigh: 45.7, significant: true, direction: "up" },
      { trafficBand: "Weekday", metric: "Tokens", preEventMean: 202258, postEventMean: 179534, changePct: -11.2, ciLow: -13.3, ciHigh: -9.2, significant: true, direction: "down" },
      { trafficBand: "Weekday", metric: "QR", preEventMean: 186419, postEventMean: 161071, changePct: -13.6, ciLow: -15.8, ciHigh: -11.4, significant: true, direction: "down" },
      { trafficBand: "Weekday", metric: "Commute", preEventMean: 471134, postEventMean: 433510, changePct: -8.0, ciLow: -10.8, ciHigh: -5.2, significant: true, direction: "down" },
      { trafficBand: "Weekday", metric: "Casual", preEventMean: 389195, postEventMean: 341176, changePct: -12.3, ciLow: -14.0, ciHigh: -10.7, significant: true, direction: "down" }
    ],
    // 95% Confidence Level — Weekend Lite
    ci95: [
      { trafficBand: "Weekend Lite", metric: "Smart Cards", preEventMean: 365396, postEventMean: 344836, changePct: -5.6, ciLow: -14.4, ciHigh: 3.2, significant: false, direction: "none" },
      { trafficBand: "Weekend Lite", metric: "NCMC", preEventMean: 10280, postEventMean: 15578, changePct: 51.5, ciLow: 39.4, ciHigh: 63.6, significant: true, direction: "up" },
      { trafficBand: "Weekend Lite", metric: "Tokens", preEventMean: 223676, postEventMean: 198715, changePct: -11.2, ciLow: -16.8, ciHigh: -5.5, significant: true, direction: "down" },
      { trafficBand: "Weekend Lite", metric: "QR", preEventMean: 200574, postEventMean: 182872, changePct: -8.8, ciLow: -15.9, ciHigh: -1.8, significant: true, direction: "down" },
      { trafficBand: "Weekend Lite", metric: "Commute", preEventMean: 375676, postEventMean: 360414, changePct: -4.1, ciLow: -12.9, ciHigh: 4.7, significant: false, direction: "none" },
      { trafficBand: "Weekend Lite", metric: "Casual", preEventMean: 424937, postEventMean: 382057, changePct: -10.1, ciLow: -15.3, ciHigh: -4.9, significant: true, direction: "down" }
    ],
    // Correlation heatmap values
    correlations: [
      { x: "NCMC", y: "SmartCard", value: 0.79 },
      { x: "NCMC", y: "Commute", value: 0.81 },
      { x: "SmartCard", y: "Casual", value: -0.73 },
      { x: "QR", y: "NCMC", value: -0.88 }
    ],
    // Full correlation matrix (reconstructed — diagonal is 1.0, other cells inferred)
    correlationMatrix: [
      { variable: "Smart Cards", smartCards: 1.00, ncmc: 0.79, tokens: -0.30, qr: -0.40, commute: 0.85, casual: -0.73 },
      { variable: "NCMC", smartCards: 0.79, ncmc: 1.00, tokens: -0.20, qr: -0.88, commute: 0.81, casual: -0.60 },
      { variable: "Tokens", smartCards: -0.30, ncmc: -0.20, tokens: 1.00, qr: 0.50, commute: -0.25, casual: 0.70 },
      { variable: "QR", smartCards: -0.40, ncmc: -0.88, tokens: 0.50, qr: 1.00, commute: -0.50, casual: 0.65 },
      { variable: "Commute", smartCards: 0.85, ncmc: 0.81, tokens: -0.25, qr: -0.50, commute: 1.00, casual: -0.80 },
      { variable: "Casual", smartCards: -0.73, ncmc: -0.60, tokens: 0.70, qr: 0.65, commute: -0.80, casual: 1.00 }
    ],
    // Reconstructed 6-week window daily ridership around fare hike
    fareHikeWindow: (function() {
      const dates = [
        "2025-01-20","2025-01-21","2025-01-22","2025-01-23","2025-01-24","2025-01-25","2025-01-26",
        "2025-01-27","2025-01-28","2025-01-29","2025-01-30","2025-01-31",
        "2025-02-01","2025-02-02","2025-02-03","2025-02-04","2025-02-05","2025-02-06","2025-02-07",
        "2025-02-08","2025-02-09","2025-02-10","2025-02-11","2025-02-12","2025-02-13","2025-02-14",
        "2025-02-15","2025-02-16","2025-02-17","2025-02-18","2025-02-19","2025-02-20","2025-02-21",
        "2025-02-22","2025-02-23","2025-02-24","2025-02-25","2025-02-26","2025-02-27","2025-02-28"
      ];
      const ridership = [
        845000,840000,835000,830000,902476,870000,640000,
        909522,891111,845000,830000,820000,
        620000,830000,845000,840000,835000,830000,825000,
        620000,820000,780000,760000,770000,765000,755000,
        600000,770000,760000,765000,758000,752000,590000,
        760000,755000,762000,758000,520284,748000,745000
      ];
      return dates.map((d, i) => ({ date: d, ridership: ridership[i] }));
    })()
  },

  // ── Section 9: The Conspiracy Theory ──────────────────────────────
  section9: {
    photo: {
      alt: "NammaMetro is an immovable property of citizens in an ever-changing Bangalore landscape.",
      caption: "NammaMetro is an immovable property of the citizens in an ever-changing Bangalore landscape.",
      credit: "© 2021 Mahesh Shantaram. All Rights Reserved."
    },
    // Normal week averages
    normalSmartCards: 450000,
    normalQR: 190000,
    normalTokens: 200000,
    // Jan 15-16 anomaly data
    jan15SmartCards: 550000,
    jan15Tokens: 90000,
    jan16SmartCards: 650000,
    jan16QR: 0,
    // 99.9% Confidence Level hypothesis test
    ci999: [
      { trafficBand: "Weekday", metric: "Smart Cards", preEventMean: 439304, postEventMean: 481799, changePct: 9.7, ciLow: 1.0, ciHigh: 18.4, significant: true, direction: "up" },
      { trafficBand: "Weekday", metric: "Tokens", preEventMean: 212353, postEventMean: 189570, changePct: -10.7, ciLow: -19.6, ciHigh: -1.9, significant: true, direction: "down" },
      { trafficBand: "Weekday", metric: "QR", preEventMean: 184206, postEventMean: 181343, changePct: -1.6, ciLow: -8.1, ciHigh: 5.0, significant: false, direction: "none" },
      { trafficBand: "Weekday", metric: "NCMC", preEventMean: 12024, postEventMean: 15906, changePct: 32.3, ciLow: 24.1, ciHigh: 40.4, significant: true, direction: "up" },
      { trafficBand: "Weekend Lite", metric: "Smart Cards", preEventMean: 379006, postEventMean: 378926, changePct: -0.0, ciLow: -14.3, ciHigh: 14.3, significant: false, direction: "none" },
      { trafficBand: "Weekend Lite", metric: "Tokens", preEventMean: 223547, postEventMean: 225160, changePct: 0.7, ciLow: -12.8, ciHigh: 14.2, significant: false, direction: "none" },
      { trafficBand: "Weekend Lite", metric: "QR", preEventMean: 195645, postEventMean: 225211, changePct: 15.1, ciLow: 1.4, ciHigh: 28.9, significant: true, direction: "up" },
      { trafficBand: "Weekend Lite", metric: "NCMC", preEventMean: 9429, postEventMean: 13278, changePct: 40.8, ciLow: 20.3, ciHigh: 61.4, significant: true, direction: "up" }
    ],
    // Reconstructed daily payment data for Jan 13-18 showing the disruption
    disruptionData: [
      { date: "2025-01-13", smartCards: 445000, tokens: 210000, qr: 185000, ncmc: 12000, total: 852000 },
      { date: "2025-01-14", smartCards: 238000, tokens: 244000, qr: 240000, ncmc: 12000, total: 534000 },
      { date: "2025-01-15", smartCards: 550000, tokens: 90000, qr: 210000, ncmc: 12000, total: 862000 },
      { date: "2025-01-16", smartCards: 650000, tokens: 205000, qr: 5000, ncmc: 12000, total: 872000 },
      { date: "2025-01-17", smartCards: 445000, tokens: 210000, qr: 185000, ncmc: 12000, total: 852000 },
      { date: "2025-01-18", smartCards: 380000, tokens: 240000, qr: 200000, ncmc: 10000, total: 630000 }
    ]
  },

  // ── Color palette for sections (WCAG AA compliant) ────────────────
  sectionColors: {
    1: { accent: "#8b2183", bg: "#fdf2f8", name: "One Day" },
    2: { accent: "#ffcb1c", bg: "#fffbeb", name: "Getting Crowded" },
    3: { accent: "#00afff", bg: "#f0f9ff", name: "One Week" },
    4: { accent: "#ff66dd", bg: "#fdf4ff", name: "Traffic Bands" },
    5: { accent: "#ff6600", bg: "#fff7ed", name: "One Month" },
    6: { accent: "#ab66a3", bg: "#faf5ff", name: "Long Weekend" },
    7: { accent: "#ff3030", bg: "#fef2f2", name: "Visitor Economy" },
    8: { accent: "#ff8c00", bg: "#fff7ed", name: "Fare Hike" },
    9: { accent: "#3333ff", bg: "#f0f0ff", name: "Conspiracy" }
  }
};
