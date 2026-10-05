/** Koleksiyon galerisi: desktop'ta dikey scroll yatay harekete donusur, mobilde native kaydirma. */
import { scroll } from 'motion';

const viewport = document.querySelector<HTMLElement>('[data-collections-viewport]');
const track = document.querySelector<HTMLElement>('[data-collections-track]');

const canPin =
  window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (viewport && track && canPin) {
  let distance = 0;

  const measure = (): void => {
    distance = Math.max(0, track.scrollWidth - window.innerWidth + 48);
    viewport.style.setProperty('--viewport-height', `calc(100svh + ${distance}px)`);
  };

  viewport.setAttribute('data-pinned', '');
  measure();

  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(track);
  window.addEventListener('resize', measure, { passive: true });

  scroll(
    (progress: number) => {
      track.style.transform = `translate3d(${(-progress * distance).toFixed(1)}px, 0, 0)`;
    },
    { target: viewport, offset: ['start start', 'end end'] },
  );
}

/** Hover'da imlece gore cok hafif kayma. */
if (!window.matchMedia('(pointer: coarse)').matches) {
  document.querySelectorAll<HTMLElement>('[data-collection-card]').forEach((card) => {
    const image = card.querySelector<HTMLElement>('.card__image');
    if (!image) return;

    let frame = 0;

    const onMove = (event: PointerEvent): void => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        image.style.transform = `scale(1.045) translate3d(${(x * 10).toFixed(1)}px, ${(y * 10).toFixed(1)}px, 0)`;
      });
    };

    const onLeave = (): void => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      image.style.transform = '';
    };

    card.addEventListener('pointermove', onMove, { passive: true });
    card.addEventListener('pointerleave', onLeave, { passive: true });
  });
}
