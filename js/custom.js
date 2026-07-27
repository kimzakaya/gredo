/*
  Custom widget-board page: clock/todo/calendar/timer widgets, always all
  visible, drag to move + drag to resize. Widget mechanics come from
  js/core/widgetBoard.js (shared with background.js); clock rendering
  comes from js/dashboard.js (already included on this page); calendar
  month-grid rendering comes from js/core/calendarGrid.js (shared with
  calendar.js).
*/

const CalendarGrid = window.Gredo.CalendarGrid;
const WidgetBoard = window.Gredo.WidgetBoard;

/* ---- calendar widget ---- */

const calMonthLabelEl = document.getElementById("calMonthLabel");
const calGridEl = document.getElementById("calGrid");
const calPrevBtn = document.getElementById("calPrevBtn");
const calNextBtn = document.getElementById("calNextBtn");

const today = new Date();
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();

function renderCalendar() {
  CalendarGrid.render(calGridEl, calMonthLabelEl, viewYear, viewMonth);
}

calPrevBtn.addEventListener("click", () => {
  viewMonth -= 1;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear -= 1;
  }
  renderCalendar();
});

calNextBtn.addEventListener("click", () => {
  viewMonth += 1;
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear += 1;
  }
  renderCalendar();
});

renderCalendar();

/* ---- widget board (position/size only — all 4 widgets always active) ---- */

const CUSTOM_STORAGE_KEY = "gredoCustomBoard";
const WIDGET_KEYS = ["clock", "todo", "calendar", "timer"];
const DEFAULT_WIDGET_POSITIONS = {
  clock: { x: 4, y: 14 },
  todo: { x: 40, y: 14 },
  calendar: { x: 4, y: 56 },
  timer: { x: 40, y: 56 },
};

function defaultWidgetState() {
  const state = {};
  WIDGET_KEYS.forEach((key) => {
    state[key] = { scale: 1, ...DEFAULT_WIDGET_POSITIONS[key] };
  });
  return state;
}

function loadWidgetState() {
  const state = defaultWidgetState();
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOM_STORAGE_KEY));
    if (saved && typeof saved === "object") {
      WIDGET_KEYS.forEach((key) => {
        if (saved[key]) state[key] = { ...state[key], ...saved[key] };
      });
    }
  } catch (error) {
    console.error("Failed to load custom board:", error);
  }
  return state;
}

function saveWidgetState() {
  try {
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(widgetState));
  } catch (error) {
    console.error("Failed to save custom board:", error);
  }
}

const widgetState = loadWidgetState();

const widgetEls = {
  clock: document.getElementById("widgetClock"),
  todo: document.getElementById("widgetTodo"),
  calendar: document.getElementById("widgetCalendar"),
  timer: document.getElementById("widgetTimer"),
};

WidgetBoard.applyPositions(widgetEls, widgetState);
WidgetBoard.wireDrag(widgetEls, widgetState, saveWidgetState);
WidgetBoard.wireResize(widgetEls, widgetState, saveWidgetState);
