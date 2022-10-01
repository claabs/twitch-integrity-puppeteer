import Hero from '@ulixee/hero-playground';

export async function getIntegrityToken(): Promise<string | undefined> {
  const hero = new Hero();
  const [integrityResp] = await Promise.all([
    hero.waitForResource({
      filterFn: (resource) =>
        resource.url === 'https://gql.twitch.tv/integrity' && resource.request.method === 'POST',
    }),
    hero.goto('https://www.twitch.tv/turbo'),
  ]);
  const { token }: { token: string } = await integrityResp.json;
  await hero.close();
  return token;
}
