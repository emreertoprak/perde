import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

/** "Konumumu kullan" icin minimal veri; yalnizca kullanici isteyince indirilir. */
export const GET: APIRoute = async () => {
  const locations = (await getCollection('dealers')).map(({ data }) => ({
    id: data.id,
    plate: data.plate,
    city: data.city,
    district: data.district,
    lat: data.lat,
    lng: data.lng,
  }));

  return new Response(JSON.stringify(locations), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
