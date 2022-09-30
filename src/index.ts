import PuppetIntegrity from './puppet/integrity';
import logger from './common/logger';
import { safeLaunchBrowser } from './common/puppeteer';

async function main() {
  const browser = await safeLaunchBrowser(logger);
  const integrityPuppet = new PuppetIntegrity({ browser });
  const token = await integrityPuppet.getIntegrityToken();
  logger.info({ token }, 'token');
  await browser.close();
}

main().catch((err) => logger.error(err));
