/*
  Shared clock formatting used by script.js (digital screen), dashboard.js
  (compact clock card, also used on toDoList.html/background.html), and
  calendar.js (flip-card clock). Each page renders time differently, but
  they were all hand-computing the same weekday-name lookups and
  hour/minute/second padding independently — this is that math in one
  place.

  Classic script (not an ES module), attaches to window.Gredo.Clock —
  same convention as js/core/notifications.js and js/core/pomodoroEngine.js —
  so it can be shared as a plain <script> include across every page
  without a bundler.

  Pure data layer only: no DOM access, no tick/interval scheduling — each
  page keeps its own render loop and calls getParts() from it.
*/
(function (global) {
  var WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];
  var WEEKDAYS_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  var WEEKDAYS_EN_FULL = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function getParts(date) {
    date = date || new Date();

    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hours24 = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    var weekdayIndex = date.getDay();

    var isPM = hours24 >= 12;
    var hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;

    return {
      date: date,
      year: year,
      month: month,
      day: day,
      monthPadded: pad2(month),
      dayPadded: pad2(day),
      hours24: hours24,
      hours24Padded: pad2(hours24),
      hours12: hours12,
      hours12Padded: pad2(hours12),
      minutes: minutes,
      minutesPadded: pad2(minutes),
      seconds: seconds,
      secondsPadded: pad2(seconds),
      isPM: isPM,
      ampm: isPM ? "PM" : "AM",
      weekdayIndex: weekdayIndex,
      weekdayKoShort: WEEKDAYS_KO[weekdayIndex],
      weekdayEnShort: WEEKDAYS_EN[weekdayIndex],
      weekdayEnFull: WEEKDAYS_EN_FULL[weekdayIndex]
    };
  }

  global.Gredo = global.Gredo || {};
  global.Gredo.Clock = { getParts: getParts };
})(window);
