/** data-parallax="0.12" -> oge goruste ilerledikce hafif dikey kayma (sadece transform). */
import { scroll } from 'motion';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCompact = window.matchMedia('(max-width: 767px)').matches;

if (!prefersReducedMotion && !isCompact) {
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((element) => {
    const strength = Number.parseFloat(element.dataset.parallax ?? '0.12');
    scroll(
      (progress: number) => {
        const offset = (progress - 0.5) * strength * 160;
        element.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
      },
      { target: element, offset: ['start end', 'end start'] },
    );
  });
}
