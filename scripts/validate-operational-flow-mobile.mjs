import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const url = process.argv[2] ?? "http://localhost:3000/";
const output = process.argv[3] ?? "/home/ubuntu/webdev-static-assets/regularizando-operational-flow-375.png";

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
  await page.waitForSelector("#modulos");
  await page.evaluate(() => document.getElementById("modulos")?.scrollIntoView({ block: "start" }));
  await page.waitForFunction(() => {
    const section = document.getElementById("modulos");
    if (!section) return false;
    const rect = section.getBoundingClientRect();
    return rect.top >= -4 && rect.top < 24;
  });
  const validation = await page.$eval("#modulos", (section) => {
    const steps = [...section.querySelectorAll(".operational-flow__step")];
    const bounds = section.getBoundingClientRect();
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      sectionFitsViewport: bounds.width <= window.innerWidth,
      stepCount: steps.length,
      stepsStacked: steps.every((step) => step.getBoundingClientRect().width <= window.innerWidth),
      allStepTitlesPresent: ["Reúna o que já existe.", "Veja o que pede ação agora.", "Feche a rotina com evidência.", "Traga mais contexto quando ele ajudar."].every((text) => section.textContent?.includes(text)),
      legacyTabsAbsent: !section.querySelector(".module-tabs"),
    };
  });
  if (validation.viewport.width !== 375 || !validation.sectionFitsViewport || validation.stepCount !== 4 || !validation.stepsStacked || !validation.allStepTitlesPresent || !validation.legacyTabsAbsent) {
    throw new Error(`Validação móvel do fluxo operacional falhou: ${JSON.stringify(validation)}`);
  }
  await page.screenshot({ path: output, captureBeyondViewport: false });
  console.log(JSON.stringify({ status: "ok", output, ...validation }));
} finally {
  await browser.close();
}
