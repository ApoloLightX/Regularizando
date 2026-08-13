import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const url = process.argv[2] ?? "http://localhost:3000/";
const output = process.argv[3] ?? "/home/ubuntu/webdev-static-assets/regularizando-gis-territorio-375.png";

fs.mkdirSync(path.dirname(output), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.waitForSelector("#territorio");
  await page.evaluate(() => document.getElementById("territorio")?.scrollIntoView({ block: "start" }));
  await page.waitForFunction(() => {
    const section = document.getElementById("territorio");
    if (!section) return false;
    const rect = section.getBoundingClientRect();
    return rect.top >= -4 && rect.top < 24;
  });
  const validation = await page.$eval("#territorio", (section) => {
    const guide = section.querySelector(".territory-guide");
    const copy = section.querySelector(".territory-copy");
    const bounds = section.getBoundingClientRect();
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      sectionFitsViewport: bounds.width <= window.innerWidth,
      guidePresent: Boolean(guide),
      copyPresent: Boolean(copy),
      mapClaimsAbsent: !section.textContent?.includes("Raio analisado") && !section.textContent?.includes("sobreposições relevantes"),
      guardPresent: section.textContent?.includes("Sem localização e fonte vinculadas") ?? false,
    };
  });
  if (validation.viewport.width !== 375 || !validation.sectionFitsViewport || !validation.guidePresent || !validation.copyPresent || !validation.mapClaimsAbsent || !validation.guardPresent) {
    throw new Error(`Validação móvel GIS falhou: ${JSON.stringify(validation)}`);
  }
  await page.screenshot({ path: output, captureBeyondViewport: false });
  console.log(JSON.stringify({ status: "ok", output, ...validation }));
} finally {
  await browser.close();
}
