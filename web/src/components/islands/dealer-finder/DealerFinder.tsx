import { useStore } from '@nanostores/react';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { track } from '../../../lib/analytics';
import type { DealerLocation, PublicDealer } from '../../../lib/contracts/dealer';
import { directionsUrl, formatPhone, whatsappUrl } from '../../../lib/dealers/links';
import { nearestDealers } from '../../../lib/dealers/nearest';
import { $selectedDistrictSlug, $selectedPlate } from '../../../stores/dealers';

export interface DistrictOption {
  name: string;
  slug: string;
}

export interface CityOption {
  plate: number;
  name: string;
  slug: string;
  districts: DistrictOption[];
}

export interface FinderDict {
  cityLabel: string;
  cityPlaceholder: string;
  districtLabel: string;
  districtPlaceholder: string;
  locateButton: string;
  locating: string;
  locateError: string;
  locateUnsupported: string;
  nearestTitle: string;
  resultsEmpty: string;
  resultsCount: string;
  loading: string;
  call: string;
  whatsapp: string;
  directions: string;
  showroom: string;
  distance: string;
}

interface Props {
  cities: CityOption[];
  dict: FinderDict;
}

interface NearestEntry {
  dealer: PublicDealer;
  distanceKm: number;
}

const EMPTY_DEALERS: PublicDealer[] = [];

const noopSubscribe = () => () => undefined;

const format = (template: string, values: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );

export default function DealerFinder({ cities, dict }: Props) {
  /** Hydrate olmadan kontroller pasif kalir; kullanici olu bir form ile ugrasmaz. */
  const isReady = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const plate = useStore($selectedPlate);
  const districtSlug = useStore($selectedDistrictSlug);

  const [dealersByPlate, setDealersByPlate] = useState<Record<number, PublicDealer[]>>({});
  const [nearest, setNearest] = useState<NearestEntry[] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cityByPlate = useMemo(() => new Map(cities.map((city) => [city.plate, city])), [cities]);

  const loadCity = useCallback(async (target: number): Promise<PublicDealer[]> => {
    const response = await fetch(`/data/dealers/${target}.json`, {
      headers: { accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Bayi listesi alinamadi: ${response.status}`);
    return (await response.json()) as PublicDealer[];
  }, []);

  /** URL durumundan baslangic secimi (paylasilabilir baglanti). */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const citySlug = params.get('city');
    const district = params.get('district');
    if (!citySlug) return;

    const city = cities.find((item) => item.slug === citySlug);
    if (!city) return;

    $selectedPlate.set(city.plate);
    if (district && city.districts.some((item) => item.slug === district)) {
      $selectedDistrictSlug.set(district);
    }
  }, [cities]);

  /** Secili ilin bayileri bir kez yuklenir ve onbellekte kalir. */
  useEffect(() => {
    if (plate === null || dealersByPlate[plate] !== undefined) return;

    let cancelled = false;

    loadCity(plate)
      .then((data) => {
        if (cancelled) return;
        setDealersByPlate((previous) => ({ ...previous, [plate]: data }));
      })
      .catch(() => {
        if (!cancelled) setError(dict.resultsEmpty);
      });

    return () => {
      cancelled = true;
    };
  }, [plate, dealersByPlate, loadCity, dict.resultsEmpty]);

  /** Secim URL'e yazilir; sayfa yenilense de korunur. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const city = plate === null ? null : cityByPlate.get(plate);

    if (city) params.set('city', city.slug);
    else params.delete('city');

    if (city && districtSlug) params.set('district', districtSlug);
    else params.delete('district');

    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', url);
  }, [plate, districtSlug, cityByPlate]);

  const onCityChange = (value: string): void => {
    const next = value === '' ? null : Number(value);
    $selectedDistrictSlug.set(null);
    $selectedPlate.set(next);
    setNearest(null);
    setError(null);
    if (next !== null) track('dealer_city_select', { plate: next });
  };

  const locate = (): void => {
    if (!('geolocation' in navigator)) {
      setError(dict.locateUnsupported);
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void (async () => {
          try {
            const response = await fetch('/data/dealers/locations.json', {
              headers: { accept: 'application/json' },
            });
            const locations = (await response.json()) as DealerLocation[];
            const closest = nearestDealers(
              locations,
              { lat: position.coords.latitude, lng: position.coords.longitude },
              3,
            );

            const plates = [...new Set(closest.map((item) => item.dealer.plate))];
            const lists = await Promise.all(plates.map(loadCity));
            const byId = new Map(lists.flat().map((dealer) => [dealer.id, dealer]));

            setDealersByPlate((previous) => {
              const next = { ...previous };
              plates.forEach((item, index) => {
                next[item] = lists[index] ?? [];
              });
              return next;
            });

            const entries = closest
              .map((item) => {
                const dealer = byId.get(item.dealer.id);
                return dealer ? { dealer, distanceKm: item.distanceKm } : null;
              })
              .filter((item): item is NearestEntry => item !== null);

            setNearest(entries);
            $selectedPlate.set(entries[0]?.dealer.plate ?? null);
            $selectedDistrictSlug.set(null);
            track('dealer_locate', { results: entries.length });
          } catch {
            setError(dict.locateError);
          } finally {
            setIsLocating(false);
          }
        })();
      },
      () => {
        setError(dict.locateError);
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const city = plate === null ? null : cityByPlate.get(plate);
  const dealers = plate === null ? EMPTY_DEALERS : (dealersByPlate[plate] ?? EMPTY_DEALERS);
  const isLoading = plate !== null && dealersByPlate[plate] === undefined && error === null;

  const visible = useMemo<NearestEntry[]>(() => {
    if (nearest) return nearest;
    return dealers
      .filter((dealer) => (districtSlug ? dealer.districtSlug === districtSlug : true))
      .map((dealer) => ({ dealer, distanceKm: Number.NaN }));
  }, [dealers, districtSlug, nearest]);

  return (
    <div className="finder" aria-busy={!isReady}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field">
          <span className="field__label">{dict.cityLabel}</span>
          <select
            className="field__control"
            value={plate === null ? '' : String(plate)}
            disabled={!isReady}
            onChange={(event) => {
              onCityChange(event.target.value);
            }}
          >
            <option value="">{dict.cityPlaceholder}</option>
            {cities.map((option) => (
              <option key={option.plate} value={option.plate}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">{dict.districtLabel}</span>
          <select
            className="field__control"
            value={districtSlug ?? ''}
            disabled={!isReady || !city}
            onChange={(event) => {
              $selectedDistrictSlug.set(event.target.value === '' ? null : event.target.value);
              setNearest(null);
            }}
          >
            <option value="">{dict.districtPlaceholder}</option>
            {city?.districts.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button className="locate" type="button" onClick={locate} disabled={!isReady || isLocating}>
        {isLocating ? dict.locating : dict.locateButton}
      </button>

      <p className="status" aria-live="polite">
        {error ??
          (isLoading
            ? dict.loading
            : visible.length > 0
              ? format(dict.resultsCount, { count: visible.length })
              : plate !== null
                ? dict.resultsEmpty
                : '')}
      </p>

      {nearest && nearest.length > 0 && <h3 className="nearest-title">{dict.nearestTitle}</h3>}

      <ul className="results">
        {visible.map(({ dealer, distanceKm }) => (
          <li className="dealer" key={dealer.id}>
            <div className="dealer__head">
              <h4 className="dealer__name">{dealer.name}</h4>
              {dealer.isShowroom && <span className="dealer__badge">{dict.showroom}</span>}
              {Number.isFinite(distanceKm) && (
                <span className="dealer__distance">
                  {format(dict.distance, { km: distanceKm.toFixed(1) })}
                </span>
              )}
            </div>
            <p className="dealer__address">{dealer.address}</p>
            <div className="dealer__actions">
              <a
                className="dealer__action"
                href={`tel:${dealer.phone}`}
                onClick={() => {
                  track('dealer_call', { plate: dealer.plate });
                }}
              >
                {dict.call} · {formatPhone(dealer.phone)}
              </a>
              {dealer.whatsapp && (
                <a
                  className="dealer__action"
                  href={whatsappUrl(dealer.whatsapp)}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {dict.whatsapp}
                </a>
              )}
              <a
                className="dealer__action"
                href={directionsUrl(dealer)}
                rel="noopener noreferrer"
                target="_blank"
                onClick={() => {
                  track('dealer_directions', { plate: dealer.plate });
                }}
              >
                {dict.directions}
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
