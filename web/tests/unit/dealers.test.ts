import { describe, expect, it } from 'vitest';
import dealersData from '../../src/data/dealers.json' with { type: 'json' };
import { publicDealerSchema, TURKEY_BOUNDS } from '../../src/lib/contracts/dealer';
import { apiSuccessSchema } from '../../src/lib/contracts/api';
import { distanceKm, nearestDealers } from '../../src/lib/dealers/nearest';
import { applyStatsOverride, computeStats } from '../../src/lib/dealers/stats';
import { directionsUrl, formatPhone, whatsappUrl } from '../../src/lib/dealers/links';

const dealers = publicDealerSchema.array().parse(dealersData);

describe('publicDealerSchema', () => {
  it('ornek verinin tamami sozlesmeye uyar', () => {
    expect(dealers.length).toBeGreaterThan(50);
  });

  it('yer degistirmis lat/lng ciftini reddeder', () => {
    const base = dealers[0];
    expect(base).toBeDefined();
    const swapped = { ...base!, lat: base!.lng, lng: base!.lat };
    expect(publicDealerSchema.safeParse(swapped).success).toBe(false);
  });

  it('Turkiye sinirlari disindaki koordinati reddeder', () => {
    const outside = { ...dealers[0]!, lat: TURKEY_BOUNDS.maxLat + 5 };
    expect(publicDealerSchema.safeParse(outside).success).toBe(false);
  });

  it('gecersiz telefon formatini reddeder', () => {
    const badPhone = { ...dealers[0]!, phone: '0212 000 00 00' };
    expect(publicDealerSchema.safeParse(badPhone).success).toBe(false);
  });
});

describe('mesafe', () => {
  it('bilinen iki sehir arasi mesafeyi dogru hesaplar', () => {
    // Ankara - Istanbul yaklasik 350 km
    const value = distanceKm({ lat: 39.93, lng: 32.86 }, { lat: 41.01, lng: 28.98 });
    expect(value).toBeGreaterThan(330);
    expect(value).toBeLessThan(365);
  });

  it('en yakin bayileri mesafeye gore siralar', () => {
    const locations = dealers.map(({ id, plate, city, district, lat, lng }) => ({
      id,
      plate,
      city,
      district,
      lat,
      lng,
    }));
    const result = nearestDealers(locations, { lat: 41.01, lng: 28.98 }, 3);

    expect(result).toHaveLength(3);
    expect(result[0]!.distanceKm).toBeLessThanOrEqual(result[1]!.distanceKm);
    expect(result[0]!.dealer.city).toBe('İstanbul');
  });
});

describe('istatistikler', () => {
  it('il, ilce ve bayi sayisini veriden hesaplar', () => {
    const stats = computeStats(dealers);
    expect(stats.cities).toBe(new Set(dealers.map((dealer) => dealer.plate)).size);
    expect(stats.dealers).toBe(dealers.length);
    expect(stats.districts).toBeGreaterThan(stats.cities - 1);
  });

  it('pazarlama override degerini uygular', () => {
    const stats = computeStats(dealers);
    const overridden = applyStatsOverride(stats, {
      districts: 300,
      cities: undefined,
      dealers: undefined,
    });
    expect(overridden.districts).toBe(300);
    expect(overridden.cities).toBe(stats.cities);
  });
});

describe('baglantilar', () => {
  it('telefonu okunur bicime cevirir', () => {
    expect(formatPhone('+902161234567')).toBe('+90 216 123 45 67');
  });

  it('yol tarifi ve whatsapp baglantilari uretir', () => {
    expect(directionsUrl({ lat: 41.01, lng: 28.98, name: 'Test' })).toContain(
      'destination=41.01%2C28.98',
    );
    expect(whatsappUrl('+905321234567')).toBe('https://wa.me/905321234567');
  });
});

describe('api zarfi', () => {
  it('backend basarili yanitini cozer', () => {
    const schema = apiSuccessSchema(publicDealerSchema.array());
    const parsed = schema.parse({
      success: true,
      data: [dealers[0]],
      meta: { requestId: 'abc', page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    expect(parsed.data[0]!.id).toBe(dealers[0]!.id);
    expect(parsed.meta.totalPages).toBe(1);
  });

  it('hatali zarfi reddeder', () => {
    const schema = apiSuccessSchema(publicDealerSchema.array());
    expect(schema.safeParse({ success: false, data: [] }).success).toBe(false);
  });
});
