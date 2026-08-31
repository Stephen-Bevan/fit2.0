/* ==========================================================================
   FIT DESIGN SYSTEM  —  script.js
   Progressive-enhancement behaviour shared across every page.
   Everything works with keyboard + screen readers; nothing relies on hover.
   ========================================================================== */
(function () {
  "use strict";

  var mqDesktop = window.matchMedia("(min-width: 981px)");
  var isDesktop = function () { return mqDesktop.matches; };

  /* ---- 0. Branch + last-push timestamp watermark (top-right of header) --
     Fixed at the moment this branch was last pushed — NOT a live clock.
     Update BRANCH_PUSHED_DAY / BRANCH_PUSHED_TIME by hand on each push. --- */
  (function () {
    var BRANCH_NAME = "stephen-fit";
    var BRANCH_PUSHED_DAY = "Mon 31 Aug 2026 ·";
    var BRANCH_PUSHED_TIME = "19:31";
    var host = document.querySelector("[data-header]");
    if (!host) return;

    var badge = document.createElement("div");
    badge.className = "branch-watermark";
    badge.setAttribute("aria-hidden", "true");

    var branchEl = document.createElement("span");
    branchEl.className = "branch-watermark__branch";
    branchEl.textContent = BRANCH_NAME;

    var dtWrap = document.createElement("span");
    dtWrap.className = "branch-watermark__datetime";

    var dayEl = document.createElement("span");
    dayEl.className = "branch-watermark__day";
    dayEl.textContent = BRANCH_PUSHED_DAY;

    var timeEl = document.createElement("span");
    timeEl.className = "branch-watermark__time";
    timeEl.textContent = BRANCH_PUSHED_TIME;

    dtWrap.appendChild(dayEl);
    dtWrap.appendChild(timeEl);
    badge.appendChild(branchEl);
    badge.appendChild(dtWrap);
    host.insertBefore(badge, host.firstChild);
  })();

  /* ---- 0b. "Not final image" placeholder label on stock photography ----
     Flags photographic <img>s and photo background-images inside <main> as
     placeholders, without touching their DOM (no wrapping, no layout risk)
     — each label is a position:fixed span kept aligned on scroll/resize.
     Real branding (logos, favicon, partner/council marks) is excluded by
     keyword + a minimum-size heuristic so small icons never get tagged. --- */
  (function () {
    var LABEL_TEXT = "Not final image";
    var MIN_SIZE = 90;
    var EXCLUDE_RE = /logo|favicon|brand|arena|council|sponsor|\/ka\//i;
    var main = document.querySelector("main");
    if (!main) return;

    var items = [];

    function isExcluded(target, extra) {
      var src = target.currentSrc || target.src || "";
      var cls = (target.className || "") + " " + (extra || "");
      var alt = (target.getAttribute && target.getAttribute("alt")) || "";
      return EXCLUDE_RE.test(src) || EXCLUDE_RE.test(cls) || EXCLUDE_RE.test(alt);
    }

    function addLabel(target) {
      var el = document.createElement("span");
      el.className = "not-final-label";
      el.textContent = LABEL_TEXT;
      el.setAttribute("aria-hidden", "true");
      document.body.appendChild(el);
      items.push({ el: el, target: target });
    }

    function collect() {
      Array.prototype.slice.call(main.querySelectorAll("img")).forEach(function (img) {
        var rect = img.getBoundingClientRect();
        if (rect.width < MIN_SIZE || rect.height < MIN_SIZE) return;
        if (isExcluded(img, "")) return;
        addLabel(img);
      });
      Array.prototype.slice.call(main.querySelectorAll("*")).forEach(function (el) {
        if (el.tagName === "IMG") return;
        var bg = getComputedStyle(el).backgroundImage;
        if (!bg || bg.indexOf("url(") === -1) return;
        var rect = el.getBoundingClientRect();
        if (rect.width < 160 || rect.height < MIN_SIZE) return;
        if (isExcluded(el, bg)) return;
        addLabel(el);
      });
    }

    function reposition() {
      var vh = window.innerHeight;
      var cards = Array.prototype.slice.call(document.querySelectorAll(".hero-copy, .ta-hero__copy, .ni-hero__copy, .publications-hero__copy"));
      items.forEach(function (item) {
        var rect = item.target.getBoundingClientRect();
        var visible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < vh;
        item.el.style.display = visible ? "" : "none";
        if (!visible) return;
        var top = Math.max(0, Math.min(rect.bottom - 24, vh - 24));
        var left = Math.max(0, rect.left + 8);
        // A hero's text card can grow tall enough to reach the bottom of the
        // photo — if the label would land on the card, move it above instead.
        var labelBox = { top: top, left: left, bottom: top + 22, right: left + 130 };
        cards.forEach(function (card) {
          var cr = card.getBoundingClientRect();
          var overlaps = labelBox.left < cr.right && cr.left < labelBox.right && labelBox.top < cr.bottom && cr.top < labelBox.bottom;
          if (overlaps) top = Math.max(0, cr.top - 26);
        });
        item.el.style.top = top + "px";
        item.el.style.left = left + "px";
      });
    }

    window.addEventListener("load", function () {
      collect();
      reposition();
    });

    var ticking = false;
    function onViewportChange() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { reposition(); ticking = false; });
    }
    window.addEventListener("scroll", onViewportChange, { passive: true });
    window.addEventListener("resize", onViewportChange);
  })();

  /* ---- 0c. Hero text card — wraps hero copy so the dark card sits behind
     the text only, leaving the rest of the hero photo clear. Breadcrumbs
     stay outside the card. Runs once per hero container found; a no-op on
     the homepage, which already ships this wrapper in its markup. -------- */
  (function () {
    Array.prototype.slice.call(document.querySelectorAll(".fit-hero__inner, .hero-ai__inner")).forEach(function (inner) {
      var toWrap = Array.prototype.filter.call(inner.children, function (el) {
        return !el.classList.contains("breadcrumb") && !el.classList.contains("hero-copy");
      });
      if (!toWrap.length) return;
      var wrap = document.createElement("div");
      wrap.className = "hero-copy";
      inner.insertBefore(wrap, toWrap[0]);
      toWrap.forEach(function (el) { wrap.appendChild(el); });
    });
  })();

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

  // Keep the page behind the full-screen menu out of reach of keyboard + AT
  var backdropEls = function () {
    return [document.querySelector("main"), document.querySelector(".site-footer"), document.querySelector(".back-to-top")];
  };
  function setBackdropInert(on) {
    backdropEls().forEach(function (el) {
      if (!el) return;
      if (on) el.setAttribute("inert", "");
      else el.removeAttribute("inert");
    });
  }

  function closeMobileMenu() {
    if (!toggle) return;
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    setBackdropInert(false);
    closeAllGroups();
  }
  function openMobileMenu() {
    if (!toggle) return;
    document.body.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
    setBackdropInert(true);
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
    var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-feature-dot]"));
    var currentEl = carousel.querySelector("[data-feature-current]");
    var totalEl = carousel.querySelector("[data-feature-total]");
    var current = 0;
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    if (totalEl) totalEl.textContent = pad(slides.length);

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
      dots.forEach(function (d, idx) { d.classList.toggle("is-active", idx === current); });
      if (currentEl) currentEl.textContent = pad(current + 1);
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

  /* ---- 6b. Logo marquee pause control (WCAG 2.2.2) --------------------- */
  Array.prototype.slice.call(document.querySelectorAll("[data-marquee-toggle]")).forEach(function (btn) {
    var marquee = document.querySelector(btn.getAttribute("data-marquee-toggle"));
    if (!marquee) return;
    btn.addEventListener("click", function () {
      var paused = marquee.classList.toggle("is-paused");
      btn.setAttribute("aria-pressed", paused ? "true" : "false");
      btn.textContent = paused ? "Play logo scroll" : "Pause logo scroll";
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
