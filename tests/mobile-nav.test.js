// Regression tests for the mobile/tablet hamburger nav. This guards
// specifically against the backdrop-filter containing-block bug: adding
// backdrop-filter (or transform/filter/will-change) to .site-header silently
// breaks .primary-nav's position:fixed sizing without throwing any error, so
// a plain console-error check would never catch it -- these assert the
// actual rendered geometry instead.
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

const WIDTHS = [375, 768, 1024, 1080];
const PAGES = ["index.html", "courses.html", "contact.html"];

describe("Mobile/tablet nav fills the viewport", () => {
  for (const width of WIDTHS) {
    for (const path of PAGES) {
      test(`${path} at ${width}px: nav panel height == viewport height - header height`, async () => {
        const context = await browser.newContext({ viewport: { width, height: 800 } });
        const page = await context.newPage();
        await page.goto(server.BASE_URL + path, { waitUntil: "load" });
        if (path === "index.html") {
          const overlayHidden = await page.getAttribute("#wip-overlay", "hidden");
          if (overlayHidden === null) await page.keyboard.press("Escape");
        }
        await page.click(".menu-toggle");
        await page.waitForTimeout(200);
        const headerHeight = await page.locator("[data-header]").evaluate((el) => el.getBoundingClientRect().height);
        const navHeight = await page.locator("#primary-navigation").evaluate((el) => el.getBoundingClientRect().height);
        const expected = 800 - headerHeight;
        assert.ok(Math.abs(navHeight - expected) < 2, `nav height ${navHeight} should equal viewport(800) - header(${headerHeight}) = ${expected}`);
        await context.close();
      });
    }
  }

  test("dropdown accordion opens inside the mobile nav", async () => {
    const context = await browser.newContext({ viewport: { width: 375, height: 800 } });
    const page = await context.newPage();
    await page.goto(server.BASE_URL + "courses.html", { waitUntil: "load" });
    await page.click(".menu-toggle");
    await page.waitForTimeout(200);
    await page.locator(".nav-trigger").first().click();
    await page.waitForTimeout(200);
    const groupOpen = await page.evaluate(() => !!document.querySelector(".nav-group.is-open"));
    assert.equal(groupOpen, true);
    await context.close();
  });

  test("hamburger closes the menu again", async () => {
    const context = await browser.newContext({ viewport: { width: 375, height: 800 } });
    const page = await context.newPage();
    await page.goto(server.BASE_URL + "courses.html", { waitUntil: "load" });
    await page.click(".menu-toggle");
    await page.waitForTimeout(200);
    await page.click(".menu-toggle");
    await page.waitForTimeout(200);
    const navOpen = await page.evaluate(() => document.body.classList.contains("nav-open"));
    assert.equal(navOpen, false);
    await context.close();
  });

  test("header has no backdrop-filter/transform/will-change (would break nav's fixed positioning)", async () => {
    const context = await browser.newContext({ viewport: { width: 375, height: 800 } });
    const page = await context.newPage();
    await page.goto(server.BASE_URL + "index.html", { waitUntil: "load" });
    const style = await page.locator("[data-header]").evaluate((el) => {
      const cs = getComputedStyle(el);
      return { backdropFilter: cs.backdropFilter, filter: cs.filter, transform: cs.transform, willChange: cs.willChange };
    });
    assert.equal(style.backdropFilter, "none");
    assert.equal(style.filter, "none");
    assert.equal(style.transform, "none");
    assert.equal(style.willChange, "auto");
    await context.close();
  });
});

describe("Nav stays out of the way above the mobile breakpoint", () => {
  test("hamburger is hidden and the horizontal nav shows at desktop widths", async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto(server.BASE_URL + "courses.html", { waitUntil: "load" });
    assert.equal(await page.locator(".menu-toggle").isVisible(), false);
    assert.equal(await page.locator("#primary-navigation").isVisible(), true);
    await context.close();
  });
});
