/**
 * Analitik arayuzu. Su an no-op: cerez gerektirmeyen bir arac (Plausible/Umami)
 * eklenince tek nokta burasi olur. KVKK: kisisel veri gondermez.
 */
export type AnalyticsEvent =
  'dealer_city_select' | 'dealer_locate' | 'dealer_call' | 'dealer_directions' | 'cta_click';

type EventProps = Record<string, string | number | boolean>;

export function track(event: AnalyticsEvent, props: EventProps = {}): void {
  if (typeof window === 'undefined') return;
  const target = window as Window & { dataLayer?: unknown[] };
  target.dataLayer?.push({ event, ...props });
}
