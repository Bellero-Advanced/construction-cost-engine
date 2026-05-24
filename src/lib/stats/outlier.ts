/** Z-score outlier detection (Lee & Yun 2024 — thesis chapter 2). */

export interface OutlierResult {
  value: number;
  zScore: number;
  isOutlier: boolean;
}

export function detectOutliers(
  values: number[],
  threshold = 2.0,
): OutlierResult[] {
  if (values.length < 3)
    return values.map((v) => ({ value: v, zScore: 0, isOutlier: false }));
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const std = Math.sqrt(
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length,
  );
  if (std === 0)
    return values.map((v) => ({ value: v, zScore: 0, isOutlier: false }));
  return values.map((v) => {
    const z = Math.abs((v - mean) / std);
    return { value: v, zScore: +z.toFixed(2), isOutlier: z > threshold };
  });
}

export function filterOutliers(values: number[], threshold = 2.0): number[] {
  return detectOutliers(values, threshold)
    .filter((r) => !r.isOutlier)
    .map((r) => r.value);
}
