/*
  Drag-to-move / drag-to-resize / picker logic shared by widget-board style
  pages: background.js (widgets on top of a custom photo) and custom.js
  (widgets on a plain background, no photo). Both keep their own state
  object shaped `{ [widgetKey]: { x, y, scale, active? } }` plus their own
  localStorage load/save (background.js's also carries an `image` field
  this module doesn't know about) — this module only touches the DOM
  wiring and math that was identical between the two.

  Classic script (not an ES module), attaches to window.Gredo.WidgetBoard —
  same convention as js/core/notifications.js, js/core/pomodoroEngine.js,
  js/core/clock.js, and js/core/calendarGrid.js — so it can be shared as a
  plain <script> include without a bundler.
*/
(function (global) {
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function applyPositions(els, state) {
    Object.keys(els).forEach((key) => {
      const el = els[key];
      const s = state[key];
      if (!el || !s) return;
      if (s.active !== undefined) el.classList.toggle("hidden", !s.active);
      el.style.left = `${s.x}%`;
      el.style.top = `${s.y}%`;
      el.style.transform = `scale(${s.scale})`;
    });
  }

  function wireDrag(els, state, onSettle) {
    Object.keys(els).forEach((key) => {
      const wrapper = els[key];
      const handle = wrapper && wrapper.querySelector(".bg-widget-handle");
      if (!handle) return;

      let startClientX = 0;
      let startClientY = 0;
      let startX = 0;
      let startY = 0;

      function onMove(e) {
        const dxPct = ((e.clientX - startClientX) / window.innerWidth) * 100;
        const dyPct = ((e.clientY - startClientY) / window.innerHeight) * 100;
        const nextX = clamp(startX + dxPct, 0, 88);
        const nextY = clamp(startY + dyPct, 0, 88);
        state[key].x = nextX;
        state[key].y = nextY;
        wrapper.style.left = `${nextX}%`;
        wrapper.style.top = `${nextY}%`;
      }

      function onUp(e) {
        handle.releasePointerCapture(e.pointerId);
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", onUp);
        handle.removeEventListener("pointercancel", onUp);
        if (onSettle) onSettle(key);
      }

      handle.addEventListener("pointerdown", (e) => {
        handle.setPointerCapture(e.pointerId);
        startClientX = e.clientX;
        startClientY = e.clientY;
        startX = state[key].x;
        startY = state[key].y;
        handle.addEventListener("pointermove", onMove);
        handle.addEventListener("pointerup", onUp);
        handle.addEventListener("pointercancel", onUp);
      });
    });
  }

  function wireResize(els, state, onSettle, options) {
    const scaleMin = (options && options.scaleMin) || 0.7;
    const scaleMax = (options && options.scaleMax) || 1.6;

    Object.keys(els).forEach((key) => {
      const wrapper = els[key];
      const resizeHandle = wrapper && wrapper.querySelector(".bg-widget-resize");
      if (!resizeHandle) return;

      let resizeStartClientX = 0;
      let resizeStartClientY = 0;
      let startScale = 1;

      function onResizeMove(e) {
        const dx = e.clientX - resizeStartClientX;
        const dy = e.clientY - resizeStartClientY;
        const nextScale = clamp(startScale + (dx + dy) / 2 / 150, scaleMin, scaleMax);
        state[key].scale = nextScale;
        wrapper.style.transform = `scale(${nextScale})`;
      }

      function onResizeUp(e) {
        resizeHandle.releasePointerCapture(e.pointerId);
        resizeHandle.removeEventListener("pointermove", onResizeMove);
        resizeHandle.removeEventListener("pointerup", onResizeUp);
        resizeHandle.removeEventListener("pointercancel", onResizeUp);
        if (onSettle) onSettle(key);
      }

      resizeHandle.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        resizeHandle.setPointerCapture(e.pointerId);
        resizeStartClientX = e.clientX;
        resizeStartClientY = e.clientY;
        startScale = state[key].scale;
        resizeHandle.addEventListener("pointermove", onResizeMove);
        resizeHandle.addEventListener("pointerup", onResizeUp);
        resizeHandle.addEventListener("pointercancel", onResizeUp);
      });

      resizeHandle.addEventListener("dblclick", () => {
        state[key].scale = 1;
        wrapper.style.transform = "scale(1)";
        if (onSettle) onSettle(key);
      });
    });
  }

  /*
    Only meaningful for pages that let the user choose a subset of widgets
    (background.html). Handles chip clicks with a max-active cap, and
    auto-trims down to the mobile cap when the viewport narrows.
  */
  function wirePicker(pickerChips, state, options, callbacks) {
    const maxDesktop = options.maxActiveDesktop;
    const maxMobile = options.maxActiveMobile;
    const mobileQuery = options.mobileQuery || window.matchMedia("(max-width: 500px)");
    const onChange = (callbacks && callbacks.onChange) || function () {};
    const onToast = (callbacks && callbacks.onToast) || function () {};

    function isMobile() {
      return mobileQuery.matches;
    }

    function maxActive() {
      return isMobile() ? maxMobile : maxDesktop;
    }

    function activeCount() {
      return Object.values(state).filter((w) => w.active).length;
    }

    pickerChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const key = chip.dataset.widget;
        const s = state[key];
        if (!s.active && activeCount() >= maxActive()) {
          onToast(`위젯은 최대 ${maxActive()}개까지 선택할 수 있어요.`);
          return;
        }
        s.active = !s.active;
        onChange();
      });
    });

    function enforceMobileLimit() {
      if (!isMobile()) return;
      let keptCount = 0;
      let trimmed = false;
      Object.keys(state).forEach((key) => {
        const s = state[key];
        if (!s.active) return;
        keptCount += 1;
        if (keptCount > maxMobile) {
          s.active = false;
          trimmed = true;
        }
      });
      if (trimmed) {
        onChange();
        onToast(`모바일에서는 위젯을 최대 ${maxMobile}개까지만 겹치지 않게 쓸 수 있어요.`);
      }
    }

    mobileQuery.addEventListener("change", enforceMobileLimit);
    window.addEventListener("resize", enforceMobileLimit);
    enforceMobileLimit();
  }

  global.Gredo = global.Gredo || {};
  global.Gredo.WidgetBoard = { clamp, applyPositions, wireDrag, wireResize, wirePicker };
})(window);
