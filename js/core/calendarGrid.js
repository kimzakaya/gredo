/*
  Month-grid rendering shared by calendar.js (calendar.html's flip-clock +
  calendar page) and custom.js (custom.html's calendar widget). Each caller
  keeps its own viewYear/viewMonth state and prev/next button wiring — only
  the "build the grid of day cells for a given year+month" part is shared.

  Classic script (not an ES module), attaches to window.Gredo.CalendarGrid —
  same convention as js/core/notifications.js, js/core/pomodoroEngine.js,
  and js/core/clock.js — so it can be shared as a plain <script> include
  without a bundler.
*/
(function (global) {
  const MONTH_NAMES_EN = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  function render(gridEl, monthLabelEl, year, month) {
    const today = new Date();

    monthLabelEl.textContent = MONTH_NAMES_EN[month];
    gridEl.innerHTML = "";

    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - firstWeekday + 1;
      const cell = document.createElement("span");
      cell.className = "cal-day";

      if (dayNum < 1) {
        cell.textContent = daysInPrevMonth + dayNum;
        cell.classList.add("outside");
      } else if (dayNum > daysInMonth) {
        cell.textContent = dayNum - daysInMonth;
        cell.classList.add("outside");
      } else {
        cell.textContent = dayNum;
        const isToday = dayNum === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        if (isToday) cell.classList.add("today");
      }
      gridEl.appendChild(cell);
    }
  }

  global.Gredo = global.Gredo || {};
  global.Gredo.CalendarGrid = { render: render };
})(window);
