import PuppetIntegrity from './puppet/integrity';
import logger from './common/logger';
import puppeteer, { launchArgs } from './common/puppeteer';
import { getIntegrityToken } from './hero/integrity';

async function main() {
  // const browser = await puppeteer.launch(launchArgs);
  // const integrityPuppet = new PuppetIntegrity({ browser });
  // const token = await integrityPuppet.getIntegrityToken();
  const token = await getIntegrityToken();
  logger.info({ token }, 'token');
  if (token) {
    const tokenData = Buffer.from(token.replace('v4.public.', ''), 'base64').toString();
    logger.info(tokenData);
  }
  // await browser.close();
  process.exit();
}

main().catch((err) => logger.error(err));
