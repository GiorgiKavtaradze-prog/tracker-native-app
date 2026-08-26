export const clampToRange = (
  value: number,
  bounds: readonly [number, number],
): number => Math.min(Math.max(value, bounds[0]), bounds[1]);

export const roundToDecimals = (value: number, decimals: number): number => {
  const magnitude = 10 ** decimals;
  return Math.round(value * magnitude) / magnitude;
};

export const sumOf = (values: readonly number[]): number =>
  values.reduce((accumulator, value) => accumulator + value, 0);

export const meanOf = (values: readonly number[]): number | null =>
  values.length === 0
    ? null
    : roundToDecimals(sumOf(values) / values.length, 2);
