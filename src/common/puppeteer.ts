import puppeteer from 'puppeteer-extra';
import { Page, Browser } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Logger } from 'pino';
import { cancelable } from 'cancelable-promise';
import pidtree from 'pidtree';
import findProcess from 'find-process';

const browserLaunchTimeout = 10000;
const browserLaunchRetryAttempts = 5;
const browserNavigationTimeout = 30000;

const stealth = StealthPlugin();
puppeteer.use(stealth);

export default puppeteer;

export function getDevtoolsUrl(page: Page): string {
  // eslint-disable-next-line no-underscore-dangle,@typescript-eslint/no-explicit-any
  const targetId: string = (page.target() as any)._targetId;
  const wsEndpoint = new URL(page.browser().wsEndpoint());
  // devtools://devtools/bundled/inspector.html?ws=127.0.0.1:35871/devtools/page/2B4E5714B42640A1C61AB9EE7E432730
  return `devtools://devtools/bundled/inspector.html?ws=${wsEndpoint.host}/devtools/page/${targetId}`;
}

export const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.41 Safari/537.36';

export const launchArgs: Parameters<typeof puppeteer.launch>[0] = {
  // Ghaph's configs
  headless: false,
  args: [
    `--user-agent=${UA}`,
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--auto-open-devtools-for-tabs',
  ],
  // Vanilla configs
  // headless: true,
  // args: [
  //   '--disable-web-security', // For accessing iframes
  //   '--disable-features=IsolateOrigins,site-per-process', // For accessing iframes
  //   '--no-sandbox', // For Docker root user
  //   '--disable-dev-shm-usage', // https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#tips
  //   '--no-zygote', // https://github.com/puppeteer/puppeteer/issues/1825#issuecomment-636478077
  //   '--single-process',
  //   // For debugging in Docker
  //   '--remote-debugging-port=3001',
  //   '--remote-debugging-address=0.0.0.0', // Change devtools url to localhost
  // ],
};

/**
 * This is a hacky solution to retry a function if it doesn't return within a timeout.
 */
const retryFunction = async <T>(
  f: () => Promise<T>,
  L: Logger,
  outputName: string,
  attempts = 0
): Promise<T> => {
  const TIMEOUT = browserLaunchTimeout * 1000;
  const MAX_ATTEMPTS = browserLaunchRetryAttempts;
  const beforeProcesses = await pidtree(process.pid);
  const newPageCancelable = cancelable(f());
  let timeoutInstance: NodeJS.Timeout | undefined;
  const res = await Promise.race([
    newPageCancelable,
    new Promise((resolve) => {
      timeoutInstance = setTimeout(resolve, TIMEOUT);
    }).then(() => 'timeout'),
  ]);
  if (typeof res !== 'string') {
    if (timeoutInstance) clearTimeout(timeoutInstance);
    return res;
  }
  newPageCancelable.cancel();
  const afterProcesses = await pidtree(process.pid);
  const newProcesses = await Promise.all(
    afterProcesses
      .filter((p) => !beforeProcesses.includes(p))
      .map(async (p) => (await findProcess('pid', p))[0])
  );
  const chromiumProcesses = newProcesses.filter(
    (p) =>
      p !== undefined && ['chromium', 'chrome', 'headless_shell'].some((n) => p.name.includes(n))
  );
  L.debug({ chromiumProcesses }, 'Killing new browser processes spawned');
  chromiumProcesses.forEach((p) => process.kill(p.pid));
  if (attempts >= MAX_ATTEMPTS) {
    throw new Error(`Could not do ${outputName} after ${MAX_ATTEMPTS + 1} failed attempts.`);
  }
  L.warn(
    { attempts, MAX_ATTEMPTS },
    `${outputName} did not work after ${TIMEOUT}ms. Trying again.`
  );
  return retryFunction(f, L, outputName, attempts + 1);
};

/**
 * Create a new page within a wrapper that will retry if it hangs for 30 seconds
 */
export const safeNewPage = async (browser: Browser, L: Logger): Promise<Page> => {
  L.debug('Launching a new page');
  const page = await retryFunction(() => browser.newPage(), L, 'new page');
  page.setDefaultTimeout(browserNavigationTimeout);
  return page;
};

/**
 * Launcha new browser within a wrapper that will retry if it hangs for 30 seconds
 */
export const safeLaunchBrowser = (L: Logger): Promise<Browser> => {
  L.debug('Launching a new browser');
  return retryFunction(() => puppeteer.launch(launchArgs), L, 'browser launch');
};
