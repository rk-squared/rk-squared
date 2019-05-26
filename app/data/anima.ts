interface AnimaWave {
  color: string;
  released?: boolean;
  estimatedMonth: number;
  estimatedYear: number;
}

export const animaWaves: { [wave: number]: AnimaWave } = {
  1: {
    color: '#6daf50',
    estimatedMonth: 6,
    estimatedYear: 2019,
  },
  2: {
    color: '#d22d2d',
    estimatedMonth: 10,
    estimatedYear: 2019,
  },
};
