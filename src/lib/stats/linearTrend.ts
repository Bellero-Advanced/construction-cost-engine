/** Linear trend Y = a + bX (Ashworth & Perera 2015 — thesis chapter 2). */

export interface TrendResult {
  a: number; // intercept
  b: number; // slope (price change per period)
  r2: number; // R²
  forecast: (x: number) => number;
}

export function linearTrend(values: number[]): TrendResult | null {
  const n = values.length;
  if (n < 2) return null;
  const xs = values.map((_, i) => i);
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((s, v) => s + v, 0) / n;
  let ssXY = 0,
    ssXX = 0,
    ssYY = 0;
  for (let i = 0; i < n; i++) {
    ssXY += (xs[i] - meanX) * (values[i] - meanY);
    ssXX += (xs[i] - meanX) ** 2;
    ssYY += (values[i] - meanY) ** 2;
  }
  const b = ssXX === 0 ? 0 : ssXY / ssXX;
  const a = meanY - b * meanX;
  const r2 =
    ssYY === 0 ? 1 : Math.min(1, Math.max(0, ssXY ** 2 / (ssXX * ssYY)));
  return {
    a: +a.toFixed(2),
    b: +b.toFixed(2),
    r2: +r2.toFixed(4),
    forecast: (x) => a + b * x,
  };
}

export function percentageChange(values: number[]): (number | null)[] {
  return values.map((v, i) =>
    i === 0 ? null : +(((v - values[i - 1]) / values[i - 1]) * 100).toFixed(2),
  );
}
