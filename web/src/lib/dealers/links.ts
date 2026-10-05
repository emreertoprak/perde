import type { PublicDealer } from '../contracts/dealer';

/** +902161234567 -> +90 216 123 45 67 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 12) return phone;
  return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
}

/** Harita SDK'si yuklemeden yol tarifi: evrensel Google Maps baglantisi. */
export function directionsUrl(dealer: Pick<PublicDealer, 'lat' | 'lng' | 'name'>): string {
  const destination = `${dealer.lat},${dealer.lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export function whatsappUrl(whatsapp: string): string {
  return `https://wa.me/${whatsapp.replace(/\D/g, '')}`;
}
