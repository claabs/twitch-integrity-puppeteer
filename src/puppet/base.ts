import { Logger } from 'pino';
import { Page, Browser } from 'puppeteer';
import path from 'path';
import logger from '../common/logger';
import { getDevtoolsUrl, safeLaunchBrowser, safeNewPage } from '../common/puppeteer';

export interface PuppetBaseProps {
  browser: Browser;
}

export default class PuppetBase {
  protected L: Logger;

  protected browser: Browser;

  constructor(props: PuppetBaseProps) {
    this.browser = props.browser;
    this.L = logger;
  }

  protected async setupPage(): Promise<Page> {
    this.L.debug('Logging in with puppeteer');
    const browser = await safeLaunchBrowser(this.L);
    const page = await safeNewPage(browser, this.L);
    try {
      this.L.trace(getDevtoolsUrl(page));
      return page;
    } catch (err) {
      await this.handlePageError(err, page);
      throw err;
    }
  }

  protected async teardownPage(page: Page): Promise<void> {
    try {
      this.L.trace('closing browser');
      await page.close();
    } catch (err) {
      await this.handlePageError(err, page);
    }
  }

  protected async handlePageError(err: unknown, page?: Page) {
    if (page) {
      const errorFile = `error-${new Date().toISOString()}.png`;
      await page.screenshot({
        path: path.join('./config', errorFile),
      });
      this.L.error(
        { errorFile },
        'Encountered an error during browser automation. Saved a screenshot for debugging purposes.'
      );
      await page.close();
    }
    throw err;
  }
}
