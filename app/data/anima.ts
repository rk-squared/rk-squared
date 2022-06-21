import { enlir, EnlirRelic } from './enlir';

interface AnimaWave {
  color: string;
  released?: boolean;
  estimatedMonth: number;
  estimatedYear: number;
}

// NOTE: These currently must be manually kept in sync with anima icons in
// localData.ts.
export const animaWaves: { [wave: number]: AnimaWave } = {
  1: {
    color: '#6daf50',
    released: true,
    estimatedMonth: 6,
    estimatedYear: 2019,
  },
  2: {
    color: '#6daf50',
    released: true,
    estimatedMonth: 10,
    estimatedYear: 2019,
  },
  3: {
    color: '#6daf50',
    released: true,
    estimatedMonth: 4,
    estimatedYear: 2020,
  },
  4: {
    color: '#6daf50',
    released: true,
    estimatedMonth: 12,
    estimatedYear: 2020,
  },
  5: {
    color: '#6daf50',
    released: true,
    estimatedMonth: 10,
    estimatedYear: 2021,
  },
  6: {
    color: '#6daf50',
    released: true,
    estimatedMonth: 4,
    estimatedYear: 2022,
  },
  7: {
    color: '#03fce3',
    released: false,
    estimatedMonth: 11,
    estimatedYear: 2022,
  },
};

export function getRelicAnimaWave({ id }: EnlirRelic): AnimaWave | null {
  const anima = enlir.relicSoulBreaks[id]
    ? enlir.relicSoulBreaks[id].anima
    : enlir.relicLegendMateria[id]
    ? enlir.relicLegendMateria[id].anima
    : null;
  return anima != null ? animaWaves[anima] : null;
}
