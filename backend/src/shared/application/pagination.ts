export interface Page<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
}

export function offsetFor(page: number, limit: number): number {
  return (page - 1) * limit;
}
