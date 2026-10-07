// Renders brand/checkout-cover.html into the two checkout cover PNGs at 4x:
//   brand/assets/checkout-header-slim.png   content height only (the one to upload first)
//   brand/assets/checkout-header-boxed.png  the same art centred in Circle's 540x303 ratio (fallback)
// Needs Playwright's Chromium and network access for the Inter font. Run from the repo root:
//   node brand/render-checkout-cover.mjs            (set PLAYWRIGHT to a module path if it is not installed locally)
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const { chromium } = await import(process.env.PLAYWRIGHT ?? "playwright");
const here = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
for (const [boxed, out] of [[false, "checkout-header-slim.png"], [true, "checkout-header-boxed.png"]]) {
  const page = await (await browser.newContext({ viewport: { width: 1080, height: 606 }, deviceScaleFactor: 4 })).newPage();
  await page.goto("file://" + join(here, "checkout-cover.html"), { waitUntil: "networkidle" });
  if (boxed) await page.evaluate(() => document.body.classList.add("boxed"));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const h = boxed ? 606 : await page.evaluate(() => Math.ceil(document.querySelector(".wrap").getBoundingClientRect().height));
  await page.screenshot({ path: join(here, "assets", out), clip: { x: 0, y: 0, width: 1080, height: h } });
  console.log(out, `${1080 * 4}x${h * 4}`);
  await page.close();
}
await browser.close();
