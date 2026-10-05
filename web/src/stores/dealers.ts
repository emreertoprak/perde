import { atom } from 'nanostores';

/** Harita (vanilla) ile bayi bulucu (React island) arasinda paylasilan durum. */
export const $selectedPlate = atom<number | null>(null);
export const $selectedDistrictSlug = atom<string | null>(null);
