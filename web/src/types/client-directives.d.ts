import 'astro';

declare module 'astro' {
  interface AstroClientDirectives {
    'client:webgl'?: boolean;
  }
}
