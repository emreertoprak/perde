# corporate-web

Perde markasının müşteriye açık kurumsal sitesi. Astro 7 + React islands + React Three Fiber + Motion + Tailwind v4 ile tamamen statik üretilir (TR + EN).

## Hızlı başlangıç

```bash
nvm use            # Node 22.23.2 (>=22.12, tek sayılı sürümler desteklenmez)
npm ci             # npm 11 gerekir (npm 10'da arborist hatası alınıyor)
npm run dev        # http://localhost:4321
```

## Komutlar

| Komut                               | Açıklama                                                           |
| ----------------------------------- | ------------------------------------------------------------------ |
| `npm run dev` / `build` / `preview` | Astro geliştirme, üretim derlemesi, derlenmiş siteyi sunma         |
| `npm run typecheck`                 | `astro check` (.astro + .ts + .tsx)                                |
| `npm run lint` / `lint:fix`         | ESLint (typescript-eslint strict + astro + jsx-a11y + react-hooks) |
| `npm run format` / `format:check`   | Prettier                                                           |
| `npm run test`                      | Vitest birim testleri                                              |
| `npm run test:e2e`                  | Playwright (masaüstü + mobil)                                      |
| `npm run lighthouse`                | Lighthouse CI bütçe kontrolü                                       |

### Veri ve varlık üretimi

| Komut                                                                 | Açıklama                                                                   |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `node scripts/build-turkey-map.mjs`                                   | Natural Earth (public domain) verisinden `src/data/geo/turkey.json` üretir |
| `node --experimental-strip-types scripts/generate-sample-dealers.mjs` | Örnek bayi verisi üretir (gerçek liste gelene kadar)                       |
| `node scripts/make-placeholders.mjs`                                  | Geçici görselleri üretir (AI görselleri gelene kadar)                      |
| `node scripts/screenshots.mjs <dizin>`                                | Çalışan sunucudan görsel QA ekran görüntüleri                              |

## Mimari

- **Statik çıktı.** Adapter yok; herhangi bir CDN veya nginx'e kurulur. `trailingSlash: 'never'` + `build.format: 'file'` (nginx'te `try_files $uri $uri.html`).
- **İki dil.** TR kök dizinde, EN `/en` altında. Metinler `src/i18n/ui.ts` içinde; EN sözlüğü TR anahtarlarının tamamını zorunlu kılar, eksik çeviri `typecheck`'i düşürür.
- **JavaScript bütçesi.** Hydration öncesi yalnızca ~8KB gz vanilla script (reveal, parallax, navbar, koleksiyon kaydırma, harita).
  - `DealerFinder` React island'ı `client:visible` ile bayi bölümüne yaklaşınca yüklenir.
  - Hero perdesi özel `client:webgl` direktifiyle **yalnızca yetenekli cihazda** ve `load` + idle sonrasında yüklenir (three + R3F ≈ 230KB gz).
- **Cihaz kademeleri** (`src/lib/device-tier.ts`): T0 statik (reduced-motion, veri tasarrufu, WebGL2 yok, düşük bellek — WebGL hiç inmez), T1 düşük (dokunmatik/≤4 çekirdek), T2 tam kalite. `?tier=0|1|2` ile test edilebilir.
- **CSP.** `security.csp` açık; satır içi `style` kullanılmaz (gecikmeler CSS'te tanımlı).

## Veri katmanı (API seam)

Bayi verisi Astro content loader üzerinden gelir (`src/lib/dealers/loader.ts`):

| `DEALERS_SOURCE`    | Kaynak                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `file` (varsayılan) | `src/data/dealers.json` — `scripts/import-dealers` ile firmanın listesinden üretilir                          |
| `api`               | `GET {API_URL}/api/v1/public/dealers?page=N&limit=100` — backend zarfı (`{ success, data, meta }`) doğrulanır |

Kaynak değişse de tüketen bileşenler değişmez. Sözleşme şemaları `src/lib/contracts/` altında ve backend'in `src/shared/presentation/response.ts` dosyasıyla birebirdir.

Build çıktısına iki statik uç yazılır: `/data/dealers/{plaka}.json` (il seçilince) ve `/data/dealers/locations.json` (yalnızca "Konumumu kullan").

## Yapılacaklar (firma girdisi bekleyenler)

- Marka adı, logo (SVG) ve domainler → `src/data/site.ts`, `.env`
- Gerçek bayi listesi (Excel/CSV) → `src/data/dealers.json`
- AI görselleri veya gerçek fotoğraflar → `src/assets/images/**` + `manifest.json`
- KVKK / gizlilik / çerez metinleri → `src/content/legal/**`
- EN metinlerin onayı → `src/i18n/ui.ts`
