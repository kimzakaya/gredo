/*
  Custom background page: photo upload + draggable widget placement.
  Widget drag/resize/picker mechanics live in js/core/widgetBoard.js
  (shared with custom.js) — this file owns the board's storage shape
  (including the `image` field, which widgetBoard.js knows nothing about)
  and the photo upload/canvas logic.
*/

const WidgetBoard = window.Gredo.WidgetBoard;

const BG_STORAGE_KEY = "gredoBackgroundBoard";
const LEGACY_BG_STORAGE_KEY = "myClockBackgroundBoard";

(function migrateLegacyBackgroundStorage() {
  if (localStorage.getItem(BG_STORAGE_KEY) !== null) return;
  const legacy = localStorage.getItem(LEGACY_BG_STORAGE_KEY);
  if (legacy !== null) localStorage.setItem(BG_STORAGE_KEY, legacy);
})();
const MAX_ACTIVE_WIDGETS_DESKTOP = 3;
const MAX_ACTIVE_WIDGETS_MOBILE = 2;
const MAX_IMAGE_DIMENSION = 1920;
const IMAGE_QUALITY = 0.82;

const DEFAULT_WIDGET_POSITIONS = {
  clock: { x: 4, y: 14 },
  weather: { x: 36, y: 14 },
  timer: { x: 68, y: 14 },
  todo: { x: 4, y: 56 },
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
    },
  };
}

function loadBoard() {
  const board = defaultBoard();
  try {
    const saved = JSON.parse(localStorage.getItem(BG_STORAGE_KEY));
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
  } catch (error) {
    console.error("Failed to save background board:", error);
    showToast("저장 공간이 부족해요. 사진을 더 작은 파일로 시도해보세요.");
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
};

const pickerChips = Array.from(document.querySelectorAll(".picker-chip"));

/* ---- background photo ---- */

function renderBackground() {
  if (board.image) {
    bgCanvas.style.backgroundImage = `url("${board.image}")`;
    bgEmpty.classList.add("hidden");
  } else {
    bgCanvas.style.backgroundImage = "none";
    bgEmpty.classList.remove("hidden");
  }
}

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
        board.image = canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
        saveBoard();
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
  WidgetBoard.applyPositions(widgetEls, board.widgets);
  pickerChips.forEach((chip) => {
    chip.classList.toggle("active", board.widgets[chip.dataset.widget].active);
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
