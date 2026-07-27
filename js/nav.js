/*
  Shared top-right icon navigation. Renders the <nav class="top-nav"> row
  (page links + fullscreen toggle) so dashboard.html, toDoList.html,
  background.html, and calendar.html don't each hand-maintain a copy.

  Classic script (not an ES module), same convention as js/core/*.js,
  so it can be shared as a plain <script> include without a bundler.

  Contract: the page provides an empty `<nav class="top-nav" data-current="ID">`
  where ID is one of PAGES[].id. This script fills it in with every other
  page's link, in canonical order, then the fullscreen button. If the page
  also has a `<template id="navExtra">`, that markup is inserted between the
  page links and the fullscreen button (used by calendar.html's color-settings
  button).

  Must be included with a plain (non-deferred) <script> tag placed after the
  <nav> element but before any page script that reads #fullscreenToggle at
  load time (e.g. calendar.js, dashboard.js) — render() runs synchronously
  on load so the button exists by the time later scripts run.
*/
(function (global) {
  var PAGES = [
    {
      id: "clock",
      href: "index.html",
      label: "시계 화면으로 돌아가기",
      tooltip: "🕒 Clock · 디지털 시계",
      svg: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 15 14"></polyline></svg>'
    },
    {
      id: "dashboard",
      href: "dashboard.html",
      label: "대시보드",
      tooltip: "🌤️ Dashboard · 날씨+포모도로",
      svg: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"></rect><rect x="14" y="3" width="7" height="5" rx="1.5"></rect><rect x="14" y="12" width="7" height="9" rx="1.5"></rect><rect x="3" y="16" width="7" height="5" rx="1.5"></rect></svg>'
    },
    {
      id: "todo",
      href: "toDoList.html",
      label: "할 일 목록",
      tooltip: "✅ Today's Plan · 오늘 할 일",
      svg: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>'
    },
    {
      id: "background",
      href: "background.html",
      label: "나만의 배경",
      tooltip: "🖼️ My Background · 나만의 배경 만들기",
      svg: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>'
    },
    {
      id: "calendar",
      href: "calendar.html",
      label: "시계+달력",
      tooltip: "📅 Calendar · 시계+달력",
      svg: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>'
    },
    {
      id: "custom",
      href: "custom.html",
      label: "커스텀 위젯",
      tooltip: "🧩 Custom · 위젯 배치",
      svg: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="2"></rect><rect x="14" y="6" width="7" height="7" rx="2"></rect><rect x="6" y="14" width="7" height="7" rx="2"></rect><rect x="16" y="16" width="5" height="5" rx="1.5"></rect></svg>'
    }
  ];

  var FULLSCREEN_BTN =
    '<button class="nav-btn" id="fullscreenToggle" aria-label="전체화면">' +
    '<svg class="icon-enter" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M16 3h3a2 2 0 0 1 2 2v3"></path><path d="M8 21H5a2 2 0 0 1-2-2v-3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path></svg>' +
    '<svg class="icon-exit" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3v3a2 2 0 0 1-2 2H4"></path><path d="M15 3v3a2 2 0 0 0 2 2h3"></path><path d="M9 21v-3a2 2 0 0 0-2-2H4"></path><path d="M15 21v-3a2 2 0 0 1 2-2h3"></path></svg>' +
    "</button>";

  function render() {
    var nav = document.querySelector("nav.top-nav[data-current]");
    if (!nav) return;

    var current = nav.getAttribute("data-current");
    var html = "";

    PAGES.forEach(function (page) {
      if (page.id === current) return;
      html +=
        '<a class="nav-btn" href="' + page.href + '" aria-label="' + page.label + '" data-tooltip="' + page.tooltip + '">' +
        page.svg +
        "</a>";
    });

    var extraTemplate = document.getElementById("navExtra");
    if (extraTemplate) {
      html += extraTemplate.innerHTML;
    }

    html += FULLSCREEN_BTN;
    nav.innerHTML = html;
  }

  render();

  global.GredoNav = { render: render, PAGES: PAGES };
})(window);
