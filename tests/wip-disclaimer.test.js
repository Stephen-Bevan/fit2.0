// Unit tests for the homepage "work in progress" disclaimer popup
// (docs/wip-disclaimer.js + docs/wip-disclaimer.css + the marked block in
// docs/index.html). Each test opens a fresh browser context so localStorage
// never leaks between tests.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const server = require("./helpers/server");

let browser;

before(async () => {
  await server.start();
  browser = await chromium.launch();
});

after(async () => {
  await browser.close();
  await server.stop();
});

async function freshPage(path = "index.html") {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(server.BASE_URL + path, { waitUntil: "load" });
  return { context, page };
}

describe("WIP disclaimer — first visit", () => {
  test("shows automatically with no prior dismissal", async () => {
    const { context, page } = await freshPage();
    const hidden = await page.getAttribute("#wip-overlay", "hidden");
    assert.equal(hidden, null, "overlay should not have the hidden attribute on a fresh visit");
    await context.close();
  });

  test("modal has correct dialog semantics", async () => {
    const { context, page } = await freshPage();
    const modal = page.locator("#wip-modal");
    assert.equal(await modal.getAttribute("role"), "dialog");
    assert.equal(await modal.getAttribute("aria-modal"), "true");
    const labelledby = await modal.getAttribute("aria-labelledby");
    assert.equal(labelledby, "wip-title");
    assert.equal(await page.locator("#" + labelledby).count(), 1, "aria-labelledby must point at a real element");
    await context.close();
  });

  test("heading and body copy render the required wording", async () => {
    const { context, page } = await freshPage();
    const heading = await page.locator("#wip-title").innerText();
    assert.equal(heading, "This site is a work in progress");
    const bodyText = await page.locator(".wip-modal__body").innerText();
    assert.match(bodyText, /all images and elements are not finalised/i);
    assert.match(bodyText, /Wording has not been proof-read/);
    assert.match(bodyText, /Navigation has been finalised/);
    assert.match(bodyText, /Interactive elements may not be fully functional/);
    await context.close();
  });

  test("moves focus into the modal and locks background scroll", async () => {
    const { context, page } = await freshPage();
    const isModalFocused = await page.evaluate(() => document.activeElement === document.getElementById("wip-modal"));
    assert.equal(isModalFocused, true);
    const isLocked = await page.evaluate(() => document.documentElement.classList.contains("wip-lock"));
    assert.equal(isLocked, true);
    await context.close();
  });

  test("does not appear on any other page", async () => {
    for (const path of ["about.html", "contact.html", "faq.html"]) {
      const { context, page } = await freshPage(path);
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      assert.equal(await page.locator("#wip-overlay").count(), 0, path + " must not include the WIP overlay");
      await page.waitForTimeout(100);
      assert.deepEqual(errors, [], path + " must load with zero console errors");
      await context.close();
    }
  });
});

describe("WIP disclaimer — dismissal", () => {
  test("Escape key dismisses it and locks background scroll off", async () => {
    const { context, page } = await freshPage();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(250);
    assert.equal(await page.getAttribute("#wip-overlay", "hidden"), "");
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("wip-lock")), false);
    await context.close();
  });

  test("close (X) button dismisses it", async () => {
    const { context, page } = await freshPage();
    await page.click("#wip-close");
    await page.waitForTimeout(250);
    assert.equal(await page.getAttribute("#wip-overlay", "hidden"), "");
    await context.close();
  });

  test("continue button dismisses it", async () => {
    const { context, page } = await freshPage();
    await page.click("#wip-continue");
    await page.waitForTimeout(250);
    assert.equal(await page.getAttribute("#wip-overlay", "hidden"), "");
    await context.close();
  });

  test("clicking the dimmed backdrop dismisses it, clicking inside the modal does not", async () => {
    const { context, page } = await freshPage();
    // click inside the modal body first — must NOT close
    await page.click("#wip-title");
    await page.waitForTimeout(150);
    assert.equal(await page.getAttribute("#wip-overlay", "hidden"), null, "clicking modal content must not dismiss");
    // click the backdrop itself (top-left corner, outside the modal box)
    await page.mouse.click(5, 5);
    await page.waitForTimeout(250);
    assert.equal(await page.getAttribute("#wip-overlay", "hidden"), "");
    await context.close();
  });

  test("dismissing writes a localStorage timestamp", async () => {
    const { context, page } = await freshPage();
    const before = Date.now();
    await page.click("#wip-continue");
    await page.waitForTimeout(150);
    const stored = await page.evaluate(() => localStorage.getItem("fitWipDismissedAt"));
    assert.ok(stored, "expected a stored dismissal timestamp");
    const storedNum = Number(stored);
    assert.ok(storedNum >= before && storedNum <= Date.now() + 1000, "timestamp should be roughly now");
    await context.close();
  });

  test("focus returns to the page after dismissal", async () => {
    const { context, page } = await freshPage();
    await page.click("#wip-continue");
    await page.waitForTimeout(150);
    const activeIsBody = await page.evaluate(() => document.activeElement === document.body || document.activeElement === document.documentElement);
    assert.equal(activeIsBody, true, "with nothing focused before the modal opened, focus should fall back to the page");
  });
});

describe("WIP disclaimer — 7-day dismissal memory", () => {
  test("does not reappear on reload immediately after dismissal", async () => {
    const { context, page } = await freshPage();
    await page.click("#wip-continue");
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(150);
    assert.equal(await page.getAttribute("#wip-overlay", "hidden"), "");
    await context.close();
  });

  test("stays hidden 6 days after dismissal (within the 7-day window)", async () => {
    const { context, page } = await freshPage();
    const sixDaysAgo = Date.now() - 6 * 24 * 60 * 60 * 1000;
    await page.evaluate((ts) => localStorage.setItem("fitWipDismissedAt", String(ts)), sixDaysAgo);
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(150);
    assert.equal(await page.getAttribute("#wip-overlay", "hidden"), "", "should still be dismissed 6 days in");
    await context.close();
  });

  test("reappears once the 7-day window has fully elapsed", async () => {
    const { context, page } = await freshPage();
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    await page.evaluate((ts) => localStorage.setItem("fitWipDismissedAt", String(ts)), eightDaysAgo);
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(150);
    assert.equal(await page.getAttribute("#wip-overlay", "hidden"), null, "an 8-day-old dismissal must have expired");
    await context.close();
  });

  test("a corrupted/non-numeric stored value is treated as no dismissal (fails safe by showing)", async () => {
    const { context, page } = await freshPage();
    await page.evaluate(() => localStorage.setItem("fitWipDismissedAt", "not-a-number"));
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(150);
    assert.equal(await page.getAttribute("#wip-overlay", "hidden"), null);
    await context.close();
  });
});

describe("WIP disclaimer — forced open for testing", () => {
  test("?showWip=1 forces it open even with a fresh dismissal", async () => {
    const { context, page } = await freshPage();
    await page.click("#wip-continue");
    await page.goto(server.BASE_URL + "index.html?showWip=1", { waitUntil: "load" });
    await page.waitForTimeout(150);
    assert.equal(await page.getAttribute("#wip-overlay", "hidden"), null);
    await context.close();
  });
});

describe("WIP disclaimer — keyboard focus trap", () => {
  test("Tab from the last focusable element wraps to the first", async () => {
    const { context, page } = await freshPage();
    await page.focus("#wip-continue");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.id), "wip-close");
    await context.close();
  });

  test("Shift+Tab from the first focusable element wraps to the last", async () => {
    const { context, page } = await freshPage();
    await page.focus("#wip-close");
    await page.keyboard.press("Shift+Tab");
    assert.equal(await page.evaluate(() => document.activeElement.id), "wip-continue");
    await context.close();
  });
});

describe("WIP disclaimer — responsive layout", () => {
  test("action button goes full-width on narrow screens without overflowing the viewport", async () => {
    const { context, page } = await freshPage();
    await page.setViewportSize({ width: 360, height: 800 });
    const btnBox = await page.locator("#wip-continue").boundingBox();
    assert.ok(btnBox.x + btnBox.width <= 360 + 1, "continue button must not overflow the viewport width");
    await context.close();
  });

  test("modal body scrolls internally instead of overflowing a short viewport", async () => {
    const { context, page } = await freshPage();
    await page.setViewportSize({ width: 375, height: 420 });
    const modalBox = await page.locator("#wip-modal").boundingBox();
    assert.ok(modalBox.y >= 0 && modalBox.y + modalBox.height <= 420 + 1, "modal must fit within a short viewport");
    const bodyScrollable = await page.evaluate(() => {
      const body = document.querySelector(".wip-modal__body");
      return body.scrollHeight > body.clientHeight;
    });
    assert.equal(bodyScrollable, true, "body content should overflow into its own scroll area, not the viewport");
    const actionsBox = await page.locator(".wip-modal__actions").boundingBox();
    assert.ok(actionsBox.y + actionsBox.height <= 420 + 1, "the continue button must stay visible, not pushed off-screen");
    await context.close();
  });
});

describe("WIP disclaimer — reduced motion", () => {
  test("skips the scale/opacity transition under prefers-reduced-motion", async () => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(server.BASE_URL + "index.html", { waitUntil: "load" });
    const transform = await page.locator("#wip-modal").evaluate((el) => getComputedStyle(el).transform);
    assert.equal(transform, "matrix(1, 0, 0, 1, 0, 0)", "transform should be reset to identity, not the scale(0.96) open state");
    await context.close();
  });
});
