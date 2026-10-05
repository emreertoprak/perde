/** Harita etkilesimi: bolge vurgusu + il secimi. Durum nanostores ile island'a akar. */
import { $selectedPlate } from '../stores/dealers';

const svg = document.querySelector<SVGSVGElement>('[data-turkey-map]');

if (svg) {
  const shapes = [...svg.querySelectorAll<SVGElement>('[data-region]')];

  const setActiveRegion = (region: string | null): void => {
    for (const shape of shapes) {
      shape.toggleAttribute('data-active', region !== null && shape.dataset.region === region);
    }
  };

  svg.addEventListener('pointerover', (event) => {
    const target = (event.target as Element | null)?.closest<SVGElement>('[data-region]');
    setActiveRegion(target?.dataset.region ?? null);
  });

  svg.addEventListener('pointerleave', () => {
    setActiveRegion(null);
  });

  svg.addEventListener('click', (event) => {
    const target = (event.target as Element | null)?.closest<SVGElement>(
      '[data-plate][data-has-dealers]',
    );
    const plate = Number(target?.dataset.plate);
    if (Number.isInteger(plate)) $selectedPlate.set(plate);
  });

  $selectedPlate.subscribe((plate) => {
    for (const shape of shapes) {
      shape.toggleAttribute(
        'data-selected',
        plate !== null && Number(shape.dataset.plate) === plate,
      );
    }
  });
}
