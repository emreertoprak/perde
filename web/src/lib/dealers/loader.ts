/**
 * Bayi verisi icin kaynak degistirilebilir loader (seam).
 *  - DEALERS_SOURCE=file : src/data/dealers.json (bugun)
 *  - DEALERS_SOURCE=api  : backend public ucu (ileride) — tuketen bilesenler degismez.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Loader } from 'astro/loaders';
import { apiSuccessSchema } from '../contracts/api';
import { publicDealerSchema, type PublicDealer } from '../contracts/dealer';

const DEALERS_FILE = fileURLToPath(new URL('../../data/dealers.json', import.meta.url));

async function loadFromFile(): Promise<unknown[]> {
  const raw = await readFile(DEALERS_FILE, 'utf8');
  return JSON.parse(raw) as unknown[];
}

async function loadFromApi(apiUrl: string): Promise<PublicDealer[]> {
  const schema = apiSuccessSchema(publicDealerSchema.array());
  const dealers: PublicDealer[] = [];

  for (let page = 1; ; page += 1) {
    const url = `${apiUrl.replace(/\/$/, '')}/api/v1/public/dealers?page=${page}&limit=100`;
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Bayi API hatasi (${response.status}): ${url}`);

    const body = schema.parse(await response.json());
    dealers.push(...body.data);

    if (page >= (body.meta.totalPages ?? 1)) break;
  }

  return dealers;
}

export function dealersLoader(): Loader {
  return {
    name: 'dealers-loader',
    load: async (context) => {
      const { store, logger, watcher } = context;
      const source = process.env.DEALERS_SOURCE === 'api' ? 'api' : 'file';
      const apiUrl = process.env.API_URL ?? '';

      if (source === 'api' && !apiUrl) {
        throw new Error('DEALERS_SOURCE=api icin API_URL gerekli.');
      }

      const records = source === 'api' ? await loadFromApi(apiUrl) : await loadFromFile();

      store.clear();
      for (const record of records) {
        const candidate = record as { id?: unknown };
        const id = typeof candidate.id === 'string' ? candidate.id : '';
        if (!id) throw new Error('Bayi kaydinda id yok.');
        const data = await context.parseData({ id, data: record as Record<string, unknown> });
        store.set({ id, data });
      }

      logger.info(`${records.length} bayi yuklendi (kaynak: ${source}).`);

      if (source === 'file' && watcher) {
        watcher.add(DEALERS_FILE);
        watcher.on('change', (changed) => {
          if (changed === DEALERS_FILE) logger.info('dealers.json degisti, yeniden yukleniyor…');
        });
      }
    },
  };
}
