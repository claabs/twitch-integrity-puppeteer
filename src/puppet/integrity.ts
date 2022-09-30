import PuppetBase from './base';

export default class PuppetIntegrity extends PuppetBase {
  async getIntegrityToken(): Promise<string | undefined> {
    let integrityToken: string | undefined;
    const page = await this.setupPage();
    try {
      const [integrityResp] = await Promise.all([
        page.waitForResponse('https://gql.twitch.tv/integrity'),
        page.goto('https://www.twitch.tv/turbo'), // simplest page that runs integrity
      ]);
      this.L.debug({ integrityStatus: integrityResp.status() });
      const { token }: { token: string } = await integrityResp.json();
      this.L.debug({ token }, 'integrity token');
      integrityToken = token;
    } catch (err) {
      await this.handlePageError(err, page);
    }
    await this.teardownPage(page);
    return integrityToken;
  }
}
