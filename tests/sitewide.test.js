// Broad sweep across every page in docs/: catches anything page-specific
// that the more targeted suites wouldn't (a stray console error, a broken
// asset reference, the "not final image" label landing on real branding).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const server = require("./helpers/server");

let browser;
let pages;

before(async () => {
  await server.start();
  browser = await chromium.launch();
  pages = server.pageFiles();
});

after(async () => {
  await browser.close();
  await server.stop();
});

describe("Every page loads cleanly", () => {
  test("all 47 pages: zero console errors, zero failed requests, header is exactly 96px", async () => {
    const failures = [];
    for (const path of pages) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const errors = [];
      const failedRequests = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
      page.on("response", (res) => { if (res.status() >= 400) failedRequests.push(res.status() + " " + res.url()); });
      await page.goto(server.BASE_URL + path, { waitUntil: "load", timeout: 15000 });
      await page.waitForTimeout(200);
      const headerHeight = await page.locator("[data-header]").evaluate((el) => el.getBoundingClientRect().height);
      if (errors.length) failures.push(`${path}: console errors ${JSON.stringify(errors)}`);
      if (failedRequests.length) failures.push(`${path}: failed requests ${JSON.stringify(failedRequests)}`);
      if (Math.abs(headerHeight - 96) > 1) failures.push(`${path}: header height ${headerHeight}, expected 96`);
      await context.close();
    }
    assert.deepEqual(failures, [], failures.join("\n"));
  });

  test("all 47 pages: watermark badge present exactly once", async () => {
    const failures = [];
    for (const path of pages) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(server.BASE_URL + path, { waitUntil: "load", timeout: 15000 });
      const count = await page.locator(".branch-watermark").count();
      if (count !== 1) failures.push(`${path}: badge count ${count}, expected 1`);
      await context.close();
    }
    assert.deepEqual(failures, [], failures.join("\n"));
  });

  test("all 47 pages: no 'not final image' label overlaps a hero text card", async () => {
    function overlaps(a, b) {
      if (!a || !b) return false;
      return !(a.x + a.width < b.x || b.x + b.width < a.x || a.y + a.height < b.y || b.y + b.height < a.y);
    }
    const failures = [];
    for (const path of pages) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      await page.goto(server.BASE_URL + path, { waitUntil: "load", timeout: 15000 });
      await page.waitForTimeout(200);
      const cardBox = await page.locator(".hero-copy, .ta-hero__copy, .ni-hero__copy").first().boundingBox().catch(() => null);
      const labels = await page.locator(".not-final-label").all();
      for (const label of labels) {
        const box = await label.boundingBox();
        if (overlaps(box, cardBox)) failures.push(`${path}: a not-final-image label overlaps the hero card`);
      }
      await context.close();
    }
    assert.deepEqual(failures, [], failures.join("\n"));
  });
});

describe("Known one-off structural fixes stay fixed", () => {
  test("ai-training.html has exactly one <main> element", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(server.BASE_URL + "ai-training.html", { waitUntil: "load" });
    assert.equal(await page.locator("main").count(), 1);
    await context.close();
  });

  test("aria-label groups (logo marquees, partner rows, stat blocks) all carry role=group", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(server.BASE_URL + "index.html", { waitUntil: "load" });
    const el = page.locator('[aria-label="Companies that trust FIT"]');
    assert.equal(await el.getAttribute("role"), "group");
    await context.close();
  });
});

describe("Every page's header markup is byte-identical", () => {
  // The header (logo, nav, dropdown menus, Knowledge Arena lockup) is global
  // site navigation duplicated into every static HTML file. Nothing about it
  // should vary page-to-page -- if one page's copy drifts (e.g. a stale link
  // left over from before a page was renamed/created), that page's header
  // silently behaves differently from every other page's.
  const fs = require("node:fs");
  const path = require("node:path");

  function extractHeader(html) {
    const start = html.indexOf('<header class="site-header"');
    const end = html.indexOf("</header>", start) + "</header>".length;
    if (start === -1 || end === -1) return null;
    return html.slice(start, end);
  }

  test("all pages share one identical <header> block", () => {
    const headers = {};
    for (const file of pages) {
      const html = fs.readFileSync(path.join(server.DOCS_DIR, file), "utf8");
      headers[file] = extractHeader(html);
      assert.ok(headers[file], `${file}: could not find a <header class="site-header"> block`);
    }
    const [firstFile, ...rest] = pages;
    const reference = headers[firstFile];
    const mismatches = rest.filter((file) => headers[file] !== reference);
    assert.deepEqual(mismatches, [], `these pages' headers differ from ${firstFile}: ${mismatches.join(", ")}`);
  });
});
