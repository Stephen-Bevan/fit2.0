/* ==========================================================================
   FIT DESIGN SYSTEM  —  script.js
   Progressive-enhancement behaviour shared across every page.
   Everything works with keyboard + screen readers; nothing relies on hover.
   ========================================================================== */
(function () {
  "use strict";

  var mqDesktop = window.matchMedia("(min-width: 981px)");
  var isDesktop = function () { return mqDesktop.matches; };

  /* ---- 1. Header: solid navy on scroll ---------------------------------- */
  var header = document.querySelector("[data-header]");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- 2. Mobile menu (hamburger) --------------------------------------- */
  var toggle = document.querySelector(".menu-toggle");
  var primaryNav = document.getElementById("primary-navigation");

  function closeMobileMenu() {
    if (!toggle) return;
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    closeAllGroups();
  }
  function openMobileMenu() {
    if (!toggle) return;
    document.body.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      if (document.body.classList.contains("nav-open")) closeMobileMenu();
      else openMobileMenu();
    });
  }

  /* ---- 3. Dropdown navigation (desktop panel + mobile accordion) -------- */
  var groups = Array.prototype.slice.call(document.querySelectorAll(".nav-group"));

  function closeGroup(group) {
    group.classList.remove("is-open");
    var trigger = group.querySelector(".nav-trigger");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  }
  function openGroup(group) {
    group.classList.add("is-open");
    var trigger = group.querySelector(".nav-trigger");
    if (trigger) trigger.setAttribute("aria-expanded", "true");
  }
  function closeAllGroups(except) {
    groups.forEach(function (g) { if (g !== except) closeGroup(g); });
  }

  groups.forEach(function (group) {
    var trigger = group.querySelector(".nav-trigger");
    if (!trigger) return;

    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      var open = group.classList.contains("is-open");
      if (open) { closeGroup(group); }
      else { closeAllGroups(group); openGroup(group); }
    });

    // Desktop hover convenience (click + keyboard still fully work)
    group.addEventListener("mouseenter", function () {
      if (isDesktop()) { closeAllGroups(group); openGroup(group); }
    });
    group.addEventListener("mouseleave", function () {
      if (isDesktop()) closeGroup(group);
    });

    // Close when focus leaves the whole group (keyboard tab-out)
    group.addEventListener("focusout", function (e) {
      if (isDesktop() && !group.contains(e.relatedTarget)) closeGroup(group);
    });
  });

  // Escape closes any open dropdown (and the mobile menu) + restores focus
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var openGroupEl = document.querySelector(".nav-group.is-open");
    if (openGroupEl) {
      var trigger = openGroupEl.querySelector(".nav-trigger");
      closeGroup(openGroupEl);
      if (trigger) trigger.focus();
    } else if (document.body.classList.contains("nav-open")) {
      closeMobileMenu();
      if (toggle) toggle.focus();
    }
  });

  // Click outside closes desktop dropdowns
  document.addEventListener("click", function (e) {
    if (!isDesktop()) return;
    if (!e.target.closest(".nav-group")) closeAllGroups();
  });

  // Reset state when crossing the desktop/mobile boundary
  mqDesktop.addEventListener("change", function () {
    closeAllGroups();
    closeMobileMenu();
  });

  /* ---- 4. Active nav state by current filename -------------------------- */
  (function markActive() {
    var path = window.location.pathname.split("/").pop() || "index.html";
    var links = document.querySelectorAll(".primary-nav a[data-match]");
    links.forEach(function (a) {
      var matches = a.getAttribute("data-match").split(" ");
      if (matches.indexOf(path) !== -1) {
        a.setAttribute("aria-current", "page");
        var group = a.closest(".nav-group");
        if (group) {
          var trigger = group.querySelector(".nav-trigger");
          if (trigger) trigger.classList.add("is-active-section");
        }
      }
    });
  })();

  /* ---- 5. Featured carousel (homepage) — manual only, no autoplay ------- */
  var carousel = document.querySelector("[data-feature-carousel]");
  if (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll("[data-feature-slide]"));
    var tabs = Array.prototype.slice.call(carousel.querySelectorAll("[data-feature-target]"));
    var prevBtn = carousel.querySelector("[data-feature-prev]");
    var nextBtn = carousel.querySelector("[data-feature-next]");
    var current = 0;

    function showSlide(i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, idx) {
        var active = idx === current;
        s.hidden = !active;
        s.classList.toggle("is-active", active);
      });
      tabs.forEach(function (t, idx) {
        var active = idx === current;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
        t.tabIndex = active ? 0 : -1;
      });
    }
    tabs.forEach(function (t, idx) {
      t.addEventListener("click", function () { showSlide(idx); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { e.preventDefault(); var n = (idx + 1) % tabs.length; tabs[n].focus(); showSlide(n); }
        if (e.key === "ArrowLeft") { e.preventDefault(); var p = (idx - 1 + tabs.length) % tabs.length; tabs[p].focus(); showSlide(p); }
      });
    });
    if (prevBtn) prevBtn.addEventListener("click", function () { showSlide(current - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { showSlide(current + 1); });
    showSlide(0);
  }

  /* ---- 6. FAQ / disclosure accordions ----------------------------------- */
  Array.prototype.slice.call(document.querySelectorAll(".fit-faq__q")).forEach(function (btn) {
    var item = btn.closest(".fit-faq__item");
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", expanded ? "false" : "true");
      if (item) item.classList.toggle("is-open", !expanded);
      if (panel) panel.hidden = expanded;
    });
  });

  /* ---- 7. Back to top --------------------------------------------------- */
  var backToTop = document.querySelector(".back-to-top");
  if (backToTop) {
    var toggleBackToTop = function () {
      backToTop.classList.toggle("is-visible", window.scrollY > 600);
    };
    toggleBackToTop();
    window.addEventListener("scroll", toggleBackToTop, { passive: true });
  }

  /* ---- 8. Contact form (no backend — inline confirmation) --------------- */
  Array.prototype.slice.call(document.querySelectorAll("[data-demo-form]")).forEach(function (form) {
    var status = form.querySelector(".form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (status) {
        status.textContent = "Thanks — your message has been noted. In the live site this connects to the FIT team; we usually reply within two working days.";
        status.classList.add("is-visible");
        status.setAttribute("role", "status");
      }
      form.reset();
    });
  });

  /* ---- 9. Graceful image fallback --------------------------------------- */
  Array.prototype.slice.call(document.querySelectorAll("img")).forEach(function (img) {
    img.addEventListener("error", function () {
      img.style.display = "none"; // container keeps its branded placeholder background
    });
  });
})();
