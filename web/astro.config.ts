import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField, fontProviders } from 'astro/config';
import clientWebgl from './integrations/client-webgl';

const site = process.env.PUBLIC_SITE_URL ?? 'https://www.perde.example';

// https://astro.build/config
export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },

  i18n: {
    defaultLocale: 'tr',
    locales: ['tr', 'en'],
    routing: { prefixDefaultLocale: false },
  },

  image: {
    layout: 'constrained',
    responsiveStyles: true,
  },

  env: {
    schema: {
      PUBLIC_SITE_URL: envField.string({
        context: 'client',
        access: 'public',
        default: 'http://localhost:4321',
      }),
      PUBLIC_PORTAL_URL: envField.string({
        context: 'client',
        access: 'public',
        default: 'https://portal.perde.example',
      }),
      DEALERS_SOURCE: envField.enum({
        context: 'server',
        access: 'public',
        values: ['file', 'api'],
        default: 'file',
      }),
      API_URL: envField.string({ context: 'server', access: 'public', optional: true }),
    },
  },

  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Cormorant Garamond',
      cssVariable: '--font-editorial',
      weights: [300, 400],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['Georgia', 'Times New Roman', 'serif'],
      optimizedFallbacks: true,
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Hanken Grotesk',
      cssVariable: '--font-grotesk',
      weights: [300, 400, 500],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['Helvetica Neue', 'Arial', 'sans-serif'],
      optimizedFallbacks: true,
    },
  ],

  integrations: [
    clientWebgl(),
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'tr',
        locales: { tr: 'tr-TR', en: 'en-US' },
      },
    }),
  ],

  security: {
    csp: {
      directives: ["default-src 'self'", "img-src 'self' data:", "connect-src 'self'"],
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
