/**
 * Shared helpers for browser-driven verification scripts.
 * The intro gate blocks the experience until Enter is clicked.
 */
export async function dismissIntro(page) {
  await page.waitForSelector('body.is-ready', { timeout: 15000 });
  const enter = page.locator('.intro__enter');
  if (await enter.count()) {
    // Curtain split is 2s; wait until the CTA is actually clickable.
    await enter.waitFor({ state: 'visible', timeout: 10000 });
    await enter.click();
    await page.waitForSelector('body.is-entered', { timeout: 10000 });
    // Hero entrance settles at ~1.5s.
    await page.waitForTimeout(1800);
  } else {
    await page.waitForSelector('body.is-entered', { timeout: 5000 }).catch(() => undefined);
  }
}
