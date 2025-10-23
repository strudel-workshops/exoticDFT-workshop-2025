import { quantile, ascending, deviation, mean } from 'd3-array';

type DataPoint = {
  [key: string]: any;
};

export const iqrOutlierRemover = (
  data: DataPoint[],
  key: string
): DataPoint[] => {
  if (!data || data.length === 0) return [];
  const values = data.map((d) => d[key]).filter((v) => typeof v === 'number');
  values.sort(ascending);
  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);

  if (q1 === undefined || q3 === undefined) {
    return data;
  }

  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  return data.filter((d) => {
    const value = d[key];
    if (typeof value !== 'number') return true;
    return value >= lowerBound && value <= upperBound;
  });
};

export const movingAverageOutlierRemover = (
  data: DataPoint[],
  key: string,
  windowSize: number = 10,
  threshold: number = 2
): DataPoint[] => {
  if (!data || data.length === 0) return [];

  const movingAverages: (number | undefined)[] = [];
  const movingStdDevs: (number | undefined)[] = [];

  for (let i = 0; i < data.length; i++) {
    const window = data
      .slice(Math.max(0, i - windowSize + 1), i + 1)
      .map((d) => d[key])
      .filter((v) => typeof v === 'number');
    movingAverages.push(mean(window));
    movingStdDevs.push(deviation(window));
  }

  return data.filter((d, i) => {
    const value = d[key];
    const avg = movingAverages[i];
    const stdDev = movingStdDevs[i];
    if (
      typeof value !== 'number' ||
      avg === undefined ||
      stdDev === undefined ||
      stdDev === 0
    ) {
      return true;
    }
    return Math.abs(value - avg) <= threshold * stdDev;
  });
};

export function movingAverage(data: any[], key: string, window: number) {
  if (window < 1) {
    return [];
  }

  const movingAverages = data.map((_d, i, arr) => {
    if (i < window - 1) {
      return null;
    }
    const windowSlice = arr.slice(i - window + 1, i + 1);
    const sum = windowSlice.reduce((acc, val) => acc + val[key], 0);
    return sum / window;
  });

  return movingAverages;
}
