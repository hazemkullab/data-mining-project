export interface ColumnStats {
  name: string;
  type: 'numeric' | 'categorical';
  missing: number;
  unique: number;
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
  q1?: number;
  q3?: number;
  topValues?: { value: string; count: number }[];
}

export function analyzeColumn(
  data: Record<string, unknown>[],
  columnName: string
): ColumnStats {
  const values = data.map(row => row[columnName]);
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');

  const missing = values.length - nonNullValues.length;
  const unique = new Set(nonNullValues.map(v => String(v))).size;

  const numericValues = nonNullValues
    .filter(v => typeof v === 'number' || !isNaN(Number(v)))
    .map(Number);

  const isNumeric = numericValues.length / nonNullValues.length > 0.8;

  if (isNumeric && numericValues.length > 0) {
    const sorted = [...numericValues].sort((a, b) => a - b);
    const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length;
    const std = Math.sqrt(variance);

    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];

    return {
      name: columnName,
      type: 'numeric',
      missing,
      unique,
      mean,
      median,
      std,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      q1,
      q3
    };
  } else {
    const valueCounts: Record<string, number> = {};
    nonNullValues.forEach(v => {
      const str = String(v);
      valueCounts[str] = (valueCounts[str] || 0) + 1;
    });

    const topValues = Object.entries(valueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([value, count]) => ({ value, count }));

    return {
      name: columnName,
      type: 'categorical',
      missing,
      unique,
      topValues
    };
  }
}

export function detectOutliers(
  data: Record<string, unknown>[],
  columnName: string
): { indices: number[]; method: string } {
  const values = data.map((row, idx) => ({ value: row[columnName], index: idx }));
  const numericValues = values
    .filter(v => v.value !== null && v.value !== undefined && !isNaN(Number(v.value)))
    .map(v => ({ value: Number(v.value), index: v.index }));

  if (numericValues.length === 0) {
    return { indices: [], method: 'IQR' };
  }

  const sorted = [...numericValues].sort((a, b) => a.value - b.value);
  const q1 = sorted[Math.floor(sorted.length * 0.25)].value;
  const q3 = sorted[Math.floor(sorted.length * 0.75)].value;
  const iqr = q3 - q1;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outlierIndices = numericValues
    .filter(v => v.value < lowerBound || v.value > upperBound)
    .map(v => v.index);

  return { indices: outlierIndices, method: 'IQR' };
}

export function handleMissingValues(
  data: Record<string, unknown>[],
  strategy: 'remove' | 'mean' | 'median' | 'mode' = 'remove'
): Record<string, unknown>[] {
  if (strategy === 'remove') {
    return data.filter(row =>
      Object.values(row).every(v => v !== null && v !== undefined && v !== '')
    );
  }

  const columns = Object.keys(data[0] || {});
  const result = [...data];

  columns.forEach(col => {
    const stats = analyzeColumn(data, col);

    if (stats.type === 'numeric' && stats.missing > 0) {
      const fillValue = strategy === 'mean' ? stats.mean : stats.median;

      result.forEach(row => {
        if (row[col] === null || row[col] === undefined || row[col] === '') {
          row[col] = fillValue;
        }
      });
    } else if (stats.type === 'categorical' && stats.missing > 0) {
      const mode = stats.topValues?.[0]?.value;

      result.forEach(row => {
        if (row[col] === null || row[col] === undefined || row[col] === '') {
          row[col] = mode;
        }
      });
    }
  });

  return result;
}

export function normalizeColumn(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) return values.map(() => 0);

  return values.map(v => (v - min) / (max - min));
}