/*
  Clock + calendar page.
*/

const Clock = window.Gredo.Clock;
const CalendarGrid = window.Gredo.CalendarGrid;

const CAL_ACCENT_KEY = "gredoCalendarAccent";
const CAL_CLOCK_COLOR_KEY = "gredoCalendarClockColor";

const calAmPmEl = document.getElementById("calAmPm");
const calWeekdayEl = document.getElementById("calWeekday");

const calMonthLabelEl = document.getElementById("calMonthLabel");
const calGridEl = document.getElementById("calGrid");
const calPrevBtn = document.getElementById("calPrevBtn");
const calNextBtn = document.getElementById("calNextBtn");

const calColorToggle = document.getElementById("calColorToggle");
const calColorPopover = document.getElementById("calColorPopover");
const calColorSwatches = document.getElementById("calColorSwatches");
const calCustomColor = document.getElementById("calCustomColor");
const calBgSwatches = document.getElementById("calBgSwatches");
const calBgCustomColor = document.getElementById("calBgCustomColor");
const calClockSwatches = document.getElementById("calClockSwatches");
const calClockCustomColor = document.getElementById("calClockCustomColor");

const fullscreenToggle = document.getElementById("fullscreenToggle");
const toastEl = document.getElementById("toast");

/* ---- clock (flip animation) ---- */

const FLIP_DURATION_MS = 400;

function resetFlap(unit) {
  if (!unit.flipping) return;
  unit.flapCard.style.transition = "none";
  unit.flapCard.classList.remove("is-flipping");
  unit.flapEl.textContent = unit.topEl.textContent;
  void unit.flapCard.offsetHeight;
  unit.flapCard.style.transition = "";
  unit.flipping = false;
}

function createFlipUnit(unitName) {
  const card = document.querySelector(`.flip-card[data-unit="${unitName}"]`);
  const flapCard = card.querySelector(".flip-flap");
  const unit = {
    topEl: card.querySelector('[data-frame="top"]'),
    bottomEl: card.querySelector('[data-frame="bottom"]'),
    flapEl: card.querySelector('[data-frame="flap"]'),
    flapCard,
    flipping: false,
  };
  // transitionend doesn't reliably fire on a page that isn't actively
  // being composited (e.g. a backgrounded tab), so a timer fallback
  // guarantees the flap always resets; whichever fires first wins,
  // resetFlap() is a no-op once already reset.
  flapCard.addEventListener("transitionend", (e) => {
    if (e.propertyName !== "transform") return;
    resetFlap(unit);
  });
  return unit;
}

function setUnitInstant(unit, value) {
  unit.topEl.textContent = value;
  unit.bottomEl.textContent = value;
  unit.flapEl.textContent = value;
}

function flipUnitTo(unit, value) {
  if (unit.topEl.textContent === value) return;
  if (unit.flipping) {
    setUnitInstant(unit, value);
    return;
  }
  unit.flapEl.textContent = unit.topEl.textContent;
  unit.topEl.textContent = value;
  unit.bottomEl.textContent = value;
  unit.flipping = true;
  void unit.flapCard.offsetHeight;
  unit.flapCard.classList.add("is-flipping");
  setTimeout(() => resetFlap(unit), FLIP_DURATION_MS + 60);
}

const hourUnit = createFlipUnit("hour");
const minuteUnit = createFlipUnit("minute");
let clockInitialized = false;

function renderClock() {
  const parts = Clock.getParts();

  if (!clockInitialized) {
    setUnitInstant(hourUnit, parts.hours12Padded);
    setUnitInstant(minuteUnit, parts.minutesPadded);
    clockInitialized = true;
  } else {
    flipUnitTo(hourUnit, parts.hours12Padded);
    flipUnitTo(minuteUnit, parts.minutesPadded);
  }

  calAmPmEl.textContent = parts.ampm;
  calWeekdayEl.textContent = parts.weekdayEnFull;
}

/* ---- calendar ---- */

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

/* ---- color storage + contrast helpers ---- */

const CAL_BG_KEY = "gredoCalendarBg";

function loadColor(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function saveColor(key, color) {
  try {
    localStorage.setItem(key, color);
  } catch {
    /* storage unavailable; color just won't persist */
  }
}

function brightnessOf(hex) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return 0;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function isLight(hex) {
  return brightnessOf(hex) > 150;
}

/* ---- accent (point) color ---- */

let accentColor = loadColor(CAL_ACCENT_KEY, "#eef1f6");

function applyAccentColor() {
  document.documentElement.style.setProperty("--cal-accent", accentColor);
  document.documentElement.style.setProperty("--cal-today-text", isLight(accentColor) ? "#0c0c0c" : "#ffffff");
  calColorSwatches.querySelectorAll(".swatch[data-color]").forEach((swatch) => {
    swatch.classList.toggle("active", swatch.dataset.color.toLowerCase() === accentColor.toLowerCase());
  });
  calCustomColor.value = accentColor;
}

calColorSwatches.addEventListener("click", (e) => {
  const swatch = e.target.closest(".swatch[data-color]");
  if (!swatch) return;
  accentColor = swatch.dataset.color;
  applyAccentColor();
  saveColor(CAL_ACCENT_KEY, accentColor);
});

calCustomColor.addEventListener("input", (e) => {
  accentColor = e.target.value;
  applyAccentColor();
  saveColor(CAL_ACCENT_KEY, accentColor);
});

/* ---- background color ---- */

let bgColor = loadColor(CAL_BG_KEY, "#000000");

function applyBackgroundColor() {
  const light = isLight(bgColor);
  const root = document.documentElement.style;
  root.setProperty("--bg", bgColor);
  root.setProperty("--text", light ? "#14161c" : "#eef1f6");
  root.setProperty("--text-dim", light ? "rgba(20, 22, 28, 0.55)" : "rgba(255, 255, 255, 0.55)");
  root.setProperty("--card-bg", light ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.1)");
  root.setProperty("--card-border", light ? "rgba(0, 0, 0, 0.18)" : "rgba(255, 255, 255, 0.2)");
  root.setProperty("--cal-crease-strong", light ? "rgba(0, 0, 0, 0.03)" : "rgba(0, 0, 0, 0.4)");
  root.setProperty("--cal-crease-soft", light ? "rgba(0, 0, 0, 0.015)" : "rgba(0, 0, 0, 0.28)");
  root.setProperty("--nav-btn-bg", light ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)");
  root.setProperty("--nav-btn-bg-active", light ? "rgba(0, 0, 0, 0.16)" : "rgba(255, 255, 255, 0.16)");
  root.setProperty("--nav-btn-color", light ? "#14161c" : "#cfd3da");

  calBgSwatches.querySelectorAll(".swatch[data-color]").forEach((swatch) => {
    swatch.classList.toggle("active", swatch.dataset.color.toLowerCase() === bgColor.toLowerCase());
  });
  calBgCustomColor.value = bgColor;
}

calBgSwatches.addEventListener("click", (e) => {
  const swatch = e.target.closest(".swatch[data-color]");
  if (!swatch) return;
  bgColor = swatch.dataset.color;
  applyBackgroundColor();
  saveColor(CAL_BG_KEY, bgColor);
});

calBgCustomColor.addEventListener("input", (e) => {
  bgColor = e.target.value;
  applyBackgroundColor();
  saveColor(CAL_BG_KEY, bgColor);
});

/* ---- clock color ---- */

let clockColor = loadColor(CAL_CLOCK_COLOR_KEY, "#eef1f6");

function applyClockColor() {
  document.documentElement.style.setProperty("--cal-clock-color", clockColor);
  calClockSwatches.querySelectorAll(".swatch[data-color]").forEach((swatch) => {
    swatch.classList.toggle("active", swatch.dataset.color.toLowerCase() === clockColor.toLowerCase());
  });
  calClockCustomColor.value = clockColor;
}

calClockSwatches.addEventListener("click", (e) => {
  const swatch = e.target.closest(".swatch[data-color]");
  if (!swatch) return;
  clockColor = swatch.dataset.color;
  applyClockColor();
  saveColor(CAL_CLOCK_COLOR_KEY, clockColor);
});

calClockCustomColor.addEventListener("input", (e) => {
  clockColor = e.target.value;
  applyClockColor();
  saveColor(CAL_CLOCK_COLOR_KEY, clockColor);
});

/* ---- color popover open/close ---- */

calColorToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  calColorPopover.classList.toggle("open");
});

document.addEventListener("click", (e) => {
  if (!calColorPopover.classList.contains("open")) return;
  if (calColorPopover.contains(e.target) || calColorToggle.contains(e.target)) return;
  calColorPopover.classList.remove("open");
});

/* ---- toast ---- */

let toastTimer = null;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3200);
}

/* ---- fullscreen toggle ---- */

function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
}

function requestFullscreen() {
  const el = document.documentElement;
  const request = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  if (!request) {
    showToast("이 브라우저에서는 전체화면을 지원하지 않아요.");
    return;
  }
  const result = request.call(el);
  if (result && result.catch) {
    result.catch(() => showToast("전체화면 전환에 실패했어요."));
  }
}

function exitFullscreen() {
  const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
  if (exit) exit.call(document);
}

function updateFullscreenButton() {
  fullscreenToggle.classList.toggle("is-fullscreen", isFullscreen());
}

fullscreenToggle.addEventListener("click", () => {
  if (isFullscreen()) exitFullscreen();
  else requestFullscreen();
});

["fullscreenchange", "webkitfullscreenchange", "MSFullscreenChange"].forEach((evt) => {
  document.addEventListener(evt, updateFullscreenButton);
});

/* ---- init + main loop ---- */

applyBackgroundColor();
applyAccentColor();
applyClockColor();
renderCalendar();
renderClock();

function tick() {
  renderClock();
  const now = new Date();
  setTimeout(tick, 1000 - now.getMilliseconds());
}
tick();
