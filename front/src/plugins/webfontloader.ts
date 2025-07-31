/**
 * plugins/webfontloader.ts
 *
 * webfontloader documentation: https://github.com/typekit/webfontloader
 */

interface WebFontLoader {
  load(config: {
    google?: {
      families: string[];
    };
  }): void;
}

export async function loadFonts(): Promise<void> {
  const webFontLoader: WebFontLoader = await import(/* webpackChunkName: "webfontloader" */'webfontloader')

  webFontLoader.load({
    google: {
      families: ['Roboto:100,300,400,500,700,900&display=swap'],
    },
  })
} 