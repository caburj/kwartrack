export type Unpacked<T> = T extends (infer U)[] ? U : T;

export function groupBy<T>(
  items: T[],
  key: (item: T) => string
): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const k = key(item);
    if (k in result) {
      result[k].push(item);
    } else {
      result[k] = [item];
    }
  }
  return result;
}

const nf = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export function formatValue(value: number) {
  return nf.format(Math.abs(value));
}
