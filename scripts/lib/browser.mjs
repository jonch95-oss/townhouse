import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

/**
 * Launch Chromium, preferring whatever Playwright installed for itself.
 *
 * On a normal machine `npx playwright install chromium` puts a matching build
 * where Playwright expects it and the first branch works. Some CI images and
 * sandboxes ship a pre-installed Chromium at a revision Playwright does not
 * expect, so we fall back to whatever is actually on disk under
 * PLAYWRIGHT_BROWSERS_PATH, and finally to an explicit CHROME override.
 */
export async function launchChromium(options = {}) {
  if (process.env.CHROME) {
    return chromium.launch({ ...options, executablePath: process.env.CHROME });
  }

  try {
    return await chromium.launch(options);
  } catch (error) {
    const found = findLocalChromium();
    if (!found) {
      throw new Error(
        `${error.message}\n\nNo Chromium found. Run "npx playwright install chromium", ` +
          'or set CHROME to a Chromium binary.',
      );
    }
    return chromium.launch({ ...options, executablePath: found });
  }
}

function findLocalChromium() {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !existsSync(root)) return null;
  for (const dir of readdirSync(root).filter((d) => d.startsWith('chromium'))) {
    for (const candidate of [
      join(root, dir, 'chrome-linux', 'chrome'),
      join(root, dir, 'chrome-linux', 'headless_shell'),
      join(root, dir, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
    ]) {
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}
