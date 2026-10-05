/** [data-reveal] ogeleri goruse girince acilir. JS yoksa CSS zaten gorunur birakir. */
import { inView } from 'motion';

const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  elements.forEach((element) => {
    element.setAttribute('data-revealed', '');
  });
} else {
  elements.forEach((element) => {
    inView(
      element,
      () => {
        element.setAttribute('data-revealed', '');
      },
      { margin: '0px 0px -10% 0px' },
    );
  });
}
