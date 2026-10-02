/* My Board: optional photo background, selectable widgets, and saved layout. */

const WidgetBoard = window.Gredo.WidgetBoard;

const BG_STORAGE_KEY = "gredoBackgroundBoard";
const LEGACY_BG_STORAGE_KEY = "myClockBackgroundBoard";

(function migrateLegacyBackgroundStorage() {
  if (localStorage.getItem(BG_STORAGE_KEY) !== null) return;
  const legacy = localStorage.getItem(LEGACY_BG_STORAGE_KEY);
  if (legacy !== null) localStorage.setItem(BG_STORAGE_KEY, legacy);
})();
const MAX_ACTIVE_WIDGETS_DESKTOP = 5;
const MAX_ACTIVE_WIDGETS_MOBILE = 5;
const MAX_IMAGE_DIMENSION = 1920;
const IMAGE_QUALITY = 0.82;

const DEFAULT_WIDGET_POSITIONS = {
  clock: { x: 4, y: 14 },
  weather: { x: 36, y: 14 },
  timer: { x: 68, y: 14 },
  todo: { x: 4, y: 56 },
  calendar: { x: 40, y: 44 },
};

function defaultBoard() {
  return {
    version: 1,
    image: null,
    widgets: {
      clock: { active: false, scale: 1, ...DEFAULT_WIDGET_POSITIONS.clock },
      weather: { active: false, scale: 1, ...DEFAULT_WIDGET_POSITIONS.weather },
      timer: { active: false, scale: 1, ...DEFAULT_WIDGET_POSITIONS.timer },
      todo: { active: false, scale: 1, ...DEFAULT_WIDGET_POSITIONS.todo },
      calendar: { active: false, scale: 1, ...DEFAULT_WIDGET_POSITIONS.calendar },
    },
  };
}

function loadBoard() {
  const board = defaultBoard();
  try {
    let saved = JSON.parse(localStorage.getItem(BG_STORAGE_KEY));
    if (!saved) {
      const custom = JSON.parse(localStorage.getItem("gredoCustomBoard"));
      if (custom && typeof custom === "object") {
        saved = { widgets: {} };
        ["clock", "todo", "calendar", "timer"].forEach((key) => {
          saved.widgets[key] = { ...custom[key], active: true };
        });
      }
    }
    if (saved && typeof saved === "object") {
      board.image = saved.image || null;
      if (saved.widgets) {
        Object.keys(board.widgets).forEach((key) => {
          if (saved.widgets[key]) {
            board.widgets[key] = { ...board.widgets[key], ...saved.widgets[key] };
          }
        });
      }
    }
  } catch (error) {
    console.error("Failed to load background board:", error);
  }
  return board;
}

function saveBoard() {
  try {
    localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(board));
    return true;
  } catch (error) {
    console.error("Failed to save background board:", error);
    showToast("저장 공간이 부족해요. 사진을 더 작은 파일로 시도해보세요.");
    return false;
  }
}

const board = loadBoard();

const bgCanvas = document.getElementById("bgCanvas");
const bgEmpty = document.getElementById("bgEmpty");
const bgUploadInput = document.getElementById("bgUploadInput");

const widgetEls = {
  clock: document.getElementById("widgetClock"),
  weather: document.getElementById("widgetWeather"),
  timer: document.getElementById("widgetTimer"),
  todo: document.getElementById("widgetTodo"),
  calendar: document.getElementById("widgetCalendar"),
};

const pickerChips = Array.from(document.querySelectorAll(".picker-chip[data-widget]"));

/* ---- background photo ---- */

function renderBackground() {
  bgCanvas.style.backgroundImage = board.image ? `url("${board.image}")` : "none";
  bgEmpty.classList.toggle("hidden", !!board.image || Object.values(board.widgets).some((w) => w.active));
  document.getElementById("boardClearBgBtn").hidden = !board.image;
}

document.getElementById("boardUploadBtn").addEventListener("click", () => bgUploadInput.click());
document.getElementById("boardClearBgBtn").addEventListener("click", () => {
  const previous = board.image;
  board.image = null;
  if (!saveBoard()) board.image = previous;
  renderBackground();
});

const calendarDate = new Date();
let boardYear = calendarDate.getFullYear();
let boardMonth = calendarDate.getMonth();
function renderBoardCalendar() {
  window.Gredo.CalendarGrid.render(document.getElementById("calGrid"), document.getElementById("calMonthLabel"), boardYear, boardMonth);
  document.getElementById("calMonthLabel").textContent = `${boardYear}년 ${boardMonth + 1}월`;
}
function moveBoardMonth(delta) {
  const date = new Date(boardYear, boardMonth + delta, 1);
  boardYear = date.getFullYear();
  boardMonth = date.getMonth();
  renderBoardCalendar();
}
document.getElementById("calPrevBtn").addEventListener("click", () => moveBoardMonth(-1));
document.getElementById("calNextBtn").addEventListener("click", () => moveBoardMonth(1));
renderBoardCalendar();

function processImageFile(file) {
  if (!file.type.startsWith("image/")) {
    showToast("이미지 파일만 올릴 수 있어요.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        if (width >= height) {
          height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
          width = MAX_IMAGE_DIMENSION;
        } else {
          width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
          height = MAX_IMAGE_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);

      try {
        const previous = board.image;
        board.image = canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
        if (!saveBoard()) {
          board.image = previous;
          return;
        }
        renderBackground();
        showToast("배경 사진을 저장했어요.");
      } catch (error) {
        showToast("이미지가 너무 커서 저장하지 못했어요.");
      }
    };
    img.onerror = () => showToast("이미지를 불러오지 못했어요.");
    img.src = event.target.result;
  };
  reader.onerror = () => showToast("파일을 읽을 수 없어요.");
  reader.readAsDataURL(file);
}

bgUploadInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) processImageFile(file);
  e.target.value = "";
});

/* ---- widget picker + drag/resize (mechanics shared via WidgetBoard) ---- */

function renderWidgets() {
  renderBackground();
  WidgetBoard.applyPositions(widgetEls, board.widgets);
  pickerChips.forEach((chip) => {
    chip.classList.toggle("active", board.widgets[chip.dataset.widget].active);
    chip.setAttribute("aria-pressed", String(board.widgets[chip.dataset.widget].active));
  });
}

WidgetBoard.wireDrag(widgetEls, board.widgets, saveBoard);
WidgetBoard.wireResize(widgetEls, board.widgets, saveBoard);
WidgetBoard.wirePicker(
  pickerChips,
  board.widgets,
  { maxActiveDesktop: MAX_ACTIVE_WIDGETS_DESKTOP, maxActiveMobile: MAX_ACTIVE_WIDGETS_MOBILE },
  {
    onChange: () => {
      saveBoard();
      renderWidgets();
    },
    onToast: showToast,
  }
);

/* ---- init ---- */

renderBackground();
renderWidgets();


// Editing is temporary; saved widget positions and selections are unchanged.
const boardEditToggle = document.getElementById("boardEditToggle");
const boardControls = document.getElementById("boardControls");
function setBoardEditing(editing) {
  document.body.classList.toggle("board-editing", editing);
  boardControls.hidden = !editing;
  boardEditToggle.textContent = editing ? "편집 완료" : "보드 편집";
  boardEditToggle.setAttribute("aria-expanded", String(editing));
}
boardEditToggle.addEventListener("click", () => setBoardEditing(boardControls.hidden));
document.getElementById("boardGetStarted").addEventListener("click", () => {
  setBoardEditing(true);
  pickerChips[0].focus();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !boardControls.hidden) {
    setBoardEditing(false);
    boardEditToggle.focus();
  }
});

const boardIconPaths = {
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4m8-4v4M4 10h16"/>',
  weather: '<path d="M6 18a4 4 0 0 1 0-8 6 6 0 0 1 11-2 5 5 0 0 1 1 10Z"/>',
  timer: '<circle cx="12" cy="13" r="7"/><path d="M9 2h6m-3 0v4m0 3v4l2 2"/>',
  todo: '<path d="m4 7 2 2 4-4m-6 12 2 2 4-4m3-8h7m-7 10h7"/>',
};
pickerChips.forEach((chip) => {
  const svg = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${boardIconPaths[chip.dataset.widget]}</svg>`;
  chip.insertAdjacentHTML("afterbegin", svg);
});
