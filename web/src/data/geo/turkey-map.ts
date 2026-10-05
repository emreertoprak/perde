import raw from './turkey.json';

export interface ProvinceShape {
  plate: number;
  d: string;
  centroid: [number, number];
  lngLat: [number, number];
}

export interface TurkeyMapData {
  width: number;
  height: number;
  provinces: ProvinceShape[];
}

/** Tek noktada tip donusumu: JSON literal tipi asagiya sizmaz. */
export const turkeyMap = raw as unknown as TurkeyMapData;
