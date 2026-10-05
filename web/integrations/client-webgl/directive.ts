import type { ClientDirective } from 'astro';
import { detectTier } from '../../src/lib/device-tier';

/**
 * client:webgl — yalnizca yetenekli cihazda, sayfa yuklenip tarayici bosa ciktiginda hydrate eder.
 * T0 cihazda island'in JS'i (React + three) hic indirilmez.
 */
const clientWebgl: ClientDirective = (load) => {
  const tier = detectTier();
  document.documentElement.dataset.heroTier = String(tier);
  if (tier === 0) return;

  const hydrate = async (): Promise<void> => {
    const run = await load();
    await run();
  };

  const whenIdle = (): void => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => void hydrate(), { timeout: 2500 });
    } else {
      setTimeout(() => void hydrate(), 1200);
    }
  };

  if (document.readyState === 'complete') whenIdle();
  else window.addEventListener('load', whenIdle, { once: true });
};

export default clientWebgl;
