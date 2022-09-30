import puppeteer from 'puppeteer-extra';
import { Page } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

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
