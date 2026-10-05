import { getCollection } from 'astro:content';
import type { APIRoute, GetStaticPaths } from 'astro';

export const getStaticPaths: GetStaticPaths = async () => {
  const dealers = await getCollection('dealers');
  const plates = [...new Set(dealers.map((dealer) => dealer.data.plate))];
  return plates.map((plate) => ({ params: { plate: String(plate) } }));
};

export const GET: APIRoute = async ({ params }) => {
  const plate = Number(params.plate);
  const dealers = (await getCollection('dealers'))
    .filter((dealer) => dealer.data.plate === plate)
    .map((dealer) => dealer.data)
    .sort(
      (a, b) => a.district.localeCompare(b.district, 'tr') || a.name.localeCompare(b.name, 'tr'),
    );

  return new Response(JSON.stringify(dealers), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
