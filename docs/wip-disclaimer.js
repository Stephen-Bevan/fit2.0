/* ==========================================================================
   WORK-IN-PROGRESS DISCLAIMER — behaviour only. All copy lives in the HTML
   block in index.html; edit that block, not this file, to change wording.

   Testing: open the homepage with ?showWip=1 in the URL to force it to show
   regardless of the 7-day dismissal, or clear it manually in the console:
     localStorage.removeItem("fitWipDismissedAt")

   Removal (when the site goes live): delete this file, wip-disclaimer.css,
   and the marked <div id="wip-overlay">...</div> block plus its two
   <link>/<script> includes in index.html. Nothing else references them.
   ========================================================================== */
(function () {
  "use strict";

  var STORAGE_KEY = "fitWipDismissedAt";
  var SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  var overlay = document.getElementById("wip-overlay");
  if (!overlay) return;

  var modal = document.getElementById("wip-modal");
  var lastFocused = null;

  function recentlyDismissed() {
    var raw;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return false; }
    if (!raw) return false;
    var dismissedAt = parseInt(raw, 10);
    return !isNaN(dismissedAt) && Date.now() - dismissedAt < SNOOZE_MS;
  }

  function forcedOpen() {
    return /(?:^|[?&])showWip=1(?:&|$)/.test(window.location.search);
  }

  function focusableEls() {
    return Array.prototype.slice.call(
      modal.querySelectorAll("button, a[href], [tabindex]:not([tabindex='-1'])")
    ).filter(function (el) { return el.offsetParent !== null; });
  }

  function trapTab(e) {
    if (e.key !== "Tab") return;
    var items = focusableEls();
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function onKeydown(e) {
    if (e.key === "Escape") { dismiss(); return; }
    trapTab(e);
  }

  function open() {
    lastFocused = document.activeElement;
    overlay.hidden = false;
    document.documentElement.classList.add("wip-lock");
    // rAF so the opening transition (skipped under reduced-motion via CSS) has a frame to animate from
    window.requestAnimationFrame(function () { overlay.classList.add("is-open"); });
    modal.focus();
    document.addEventListener("keydown", onKeydown);
  }

  function dismiss() {
    overlay.classList.remove("is-open");
    overlay.hidden = true;
    document.documentElement.classList.remove("wip-lock");
    document.removeEventListener("keydown", onKeydown);
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch (e) { /* private mode etc. — non-fatal */ }
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  overlay.querySelector("#wip-close").addEventListener("click", dismiss);
  overlay.querySelector("#wip-continue").addEventListener("click", dismiss);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) dismiss();
  });

  if (forcedOpen() || !recentlyDismissed()) open();
})();
