// Regression tests for the header watermark and the hero text-card redesign.
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

async function open(path, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(server.BASE_URL + path, { waitUntil: "load" });
  return { context, page };
}

describe("Header watermark", () => {
  test("shows exactly once with branch name and a static (non-ticking) timestamp", async () => {
    const { context, page } = await open("about.html");
    assert.equal(await page.locator(".branch-watermark").count(), 1);
    const first = await page.locator(".branch-watermark").innerText();
    await page.waitForTimeout(1200); // long enough that a live clock would visibly change
    const second = await page.locator(".branch-watermark").innerText();
    assert.equal(first, second, "watermark text must not change over time -- it is a fixed push timestamp, not a live clock");
    assert.match(first, /stephen-fit/i);
    await context.close();
  });

  test("header background is opaque at scroll position 0 (always navy, not transparent-until-scrolled)", async () => {
    const { context, page } = await open("about.html");
    const bg = await page.locator("[data-header]").evaluate((el) => getComputedStyle(el).backgroundColor);
    assert.notEqual(bg, "rgba(0, 0, 0, 0)");
    assert.notEqual(bg, "transparent");
    await context.close();
  });

  test("watermark never overlaps the logo or the mobile hamburger, 320px-1280px", async () => {
    function overlaps(a, b) {
      return !(a.x + a.width < b.x || b.x + b.width < a.x || a.y + a.height < b.y || b.y + b.height < a.y);
    }
    for (const width of [320, 360, 375, 768, 1024, 1080, 1280]) {
      const { context, page } = await open("index.html", { width, height: 900 });
      const badge = await page.locator(".branch-watermark").boundingBox();
      const logo = await page.locator("[data-header] .brand-logo").boundingBox();
      assert.equal(overlaps(badge, logo), false, `width ${width}: badge overlaps logo`);
      if (await page.locator(".menu-toggle").isVisible()) {
        const toggle = await page.locator(".menu-toggle").boundingBox();
        assert.equal(overlaps(badge, toggle), false, `width ${width}: badge overlaps hamburger`);
      }
      await context.close();
    }
  });
});

describe("Hero text card", () => {
  const cases = [
    ["about.html", ".fit-hero", ".hero-copy"],
    ["index.html", ".hero-ai", ".hero-copy"],
    ["ai-training.html", ".hero-ai", ".hero-copy"],
    ["tech-apprenticeships.html", ".ta-hero", ".ta-hero__copy"],
    ["fit-northern-ireland.html", ".ni-hero", ".ni-hero__copy"],
    ["cuimsiu-programme.html", ".hero", ".hero-copy"],
  ];

  for (const [path, heroSel, copySel] of cases) {
    test(`${path}: hero has only a narrow left-edge fade (not a full-width wash), card has the dark background + yellow border`, async () => {
      const { context, page } = await open(path);
      const heroBg = await page.locator(heroSel).first().evaluate((el) => getComputedStyle(el).backgroundImage);
      assert.match(heroBg, /gradient/, "expected a narrow left-edge fade gradient layer behind the text card");
      // The fade exists only to tuck the exposed margin strip (to the left of the
      // centered container) under the card -- it must fully resolve to transparent
      // well before mid-image, not wash the whole photo like the old design did.
      const stopPercents = (heroBg.match(/(\d+)%/g) || []).map((s) => parseInt(s, 10));
      const lastStop = stopPercents.length ? Math.max(...stopPercents) : 100;
      assert.ok(lastStop <= 40, `left-edge fade should resolve by ~34% width; found a stop at ${lastStop}% (full value: ${heroBg})`);
      const copy = page.locator(copySel).first();
      const copyBg = await copy.evaluate((el) => getComputedStyle(el).backgroundColor);
      assert.equal(copyBg, "rgba(0, 20, 45, 0.82)");
      const borderLeft = await copy.evaluate((el) => getComputedStyle(el).borderLeftWidth);
      assert.equal(borderLeft, "6px");
      await context.close();
    });
  }

  test("publications-hero is deliberately left as its own solid-navy split-column design", async () => {
    const { context, page } = await open("publications.html");
    const heroBg = await page.locator(".publications-hero").evaluate((el) => getComputedStyle(el).backgroundImage);
    assert.match(heroBg, /gradient/, "publications-hero intentionally keeps its own navy-gradient backdrop");
    await context.close();
  });

  test("breadcrumb stays outside the hero-copy card", async () => {
    const { context, page } = await open("about.html");
    const inSameCard = await page.evaluate(() => {
      const inner = document.querySelector(".fit-hero__inner");
      const crumb = inner.querySelector(".breadcrumb");
      const copy = inner.querySelector(".hero-copy");
      return copy.contains(crumb);
    });
    assert.equal(inSameCard, false);
    await context.close();
  });

  test("hero-copy card never overflows its container, 320px-1600px", async () => {
    for (const width of [320, 375, 768, 1080, 1600]) {
      const { context, page } = await open("about.html", { width, height: 900 });
      const overflow = await page.evaluate(() => {
        const copy = document.querySelector(".hero-copy");
        const container = copy.closest(".container, .fit-container");
        const cr = copy.getBoundingClientRect();
        const ir = container.getBoundingClientRect();
        return cr.right > ir.right + 1 || cr.left < ir.left - 1;
      });
      assert.equal(overflow, false, `card overflows its container at ${width}px`);
      await context.close();
    }
  });
});
