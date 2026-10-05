/**
 * Hero perde icin cihaz kademesi:
 *  0 = statik -> WebGL hic yuklenmez (CSS perde gosterilir)
 *      reduced-motion, veri tasarrufu, dusuk bellek, WebGL2 yok,
 *      dokunmatik cihazlar ve <6 cekirdek (mobilde surekli render ana is parcacigini mesgul ediyor)
 *  1 = dusuk  (6-7 cekirdek) -> az segment, dusuk DPR, noise yok
 *  2 = yuksek (>=8 cekirdek) -> tam kalite
 * Test icin URL'de ?tier=0|1|2 ile zorlanabilir.
 */
export type HeroTier = 0 | 1 | 2;

interface NavigatorHints {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

function supportsWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2');
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function detectTier(): HeroTier {
  const forced = new URLSearchParams(window.location.search).get('tier');
  if (forced === '0' || forced === '1' || forced === '2') return Number(forced) as HeroTier;

  const hints = navigator as Navigator & NavigatorHints;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0;
  if (hints.connection?.saveData === true) return 0;
  if (typeof hints.deviceMemory === 'number' && hints.deviceMemory < 4) return 0;
  if (!supportsWebGL2()) return 0;

  // Dokunmatik cihazlarda surekli WebGL render'i LCP/TBT'yi bozuyor: CSS perde daha iyi bir denge.
  if (!window.matchMedia('(pointer: fine)').matches) return 0;

  const cores = navigator.hardwareConcurrency || 4;
  if (cores < 6) return 0;
  if (cores < 8) return 1;

  return 2;
}
