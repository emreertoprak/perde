import { lazy, Suspense, useSyncExternalStore } from 'react';
import type { CurtainTier } from './CurtainScene';

/** three + R3F ayri chunk: yalnizca bu bilesen tarayicida mount olunca indirilir. */
const CurtainScene = lazy(() => import('./CurtainScene'));

const noopSubscribe = () => () => undefined;

function readTier(): CurtainTier | null {
  const value = document.documentElement.dataset.heroTier;
  if (value === '1') return 1;
  if (value === '2') return 2;
  return null;
}

export default function HeroCurtain() {
  // Sunucuda false, tarayicida true — effect icinde setState gerektirmez.
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const tier = isClient ? readTier() : null;

  return (
    <div className="hero-webgl" aria-hidden="true">
      {tier !== null && (
        <Suspense fallback={null}>
          <CurtainScene tier={tier} />
        </Suspense>
      )}
    </div>
  );
}
