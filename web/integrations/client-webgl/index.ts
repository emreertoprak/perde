import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

export default function clientWebgl(): AstroIntegration {
  return {
    name: 'client-webgl-directive',
    hooks: {
      'astro:config:setup': ({ addClientDirective }) => {
        addClientDirective({
          name: 'webgl',
          entrypoint: fileURLToPath(new URL('./directive.ts', import.meta.url)),
        });
      },
    },
  };
}
