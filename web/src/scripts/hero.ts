/** Hero: scroll ilerlemesi perdeyi acar, metni yukselterek soldurur, gorseli sabitler. */
import { scroll } from 'motion';

const hero = document.querySelector<HTMLElement>('[data-hero]');
const content = document.querySelector<HTMLElement>('[data-hero-content]');
const media = document.querySelector<HTMLElement>('[data-hero-media]');
const cue = document.querySelector<HTMLElement>('[data-hero-cue]');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

if (hero && !prefersReducedMotion.matches) {
  scroll(
    (progress: number) => {
      const open = clamp01((progress - 0.08) / 0.55);
      hero.style.setProperty('--curtain-open', open.toFixed(4));

      if (media) {
        const scale = 1.08 - 0.08 * clamp01(progress / 0.75);
        media.style.transform = `scale(${scale.toFixed(4)})`;
      }

      if (content) {
        const fade = clamp01((progress - 0.35) / 0.35);
        content.style.opacity = (1 - fade).toFixed(3);
        content.style.transform = `translate3d(0, ${(-progress * 64).toFixed(1)}px, 0)`;
      }

      if (cue) {
        cue.style.opacity = (1 - clamp01(progress / 0.2)).toFixed(3);
      }
    },
    { target: hero, offset: ['start start', 'end end'] },
  );
}
