import * as _ from 'lodash';

import { EnlirRealm } from './enlir';

export type SeriesId =
  | 101001 // I
  | 102001 // II
  | 103001 // III
  | 104001 // IV
  | 105001 // V
  | 106001 // VI
  | 107001 // VII
  | 108001 // VIII
  | 109001 // IX
  | 110001 // X
  | 111001 // XI
  | 112001 // XII
  | 113001 // XIII
  | 114001 // XIV
  | 115001 // XV
  | 150001 // FFT
  | 160001 // T-0
  | 170001 // KH
  | 190001 // Beyond
  | 200001 // Core
  | 900072; // ETC

interface SeriesMaps {
  short: { [id in SeriesId]: string };
  long: { [id in SeriesId]: string };
  enlirRealm: { [id in SeriesId]: EnlirRealm | null };
}

export const series: SeriesMaps = {
  short: {
    101001: 'I',
    102001: 'II',
    103001: 'III',
    104001: 'IV',
    105001: 'V',
    106001: 'VI',
    107001: 'VII',
    108001: 'VIII',
    109001: 'IX',
    110001: 'X',
    111001: 'XI',
    112001: 'XII',
    113001: 'XIII',
    114001: 'XIV',
    115001: 'XV',
    150001: 'FFT',
    160001: 'T-0',
    170001: 'KH',
    190001: 'Beyond',
    200001: 'Core',
    900072: 'ETC',
  },
  long: {
    101001: 'Final Fantasy I',
    102001: 'Final Fantasy II',
    103001: 'Final Fantasy III',
    104001: 'Final Fantasy IV',
    105001: 'Final Fantasy V',
    106001: 'Final Fantasy VI',
    107001: 'Final Fantasy VII',
    108001: 'Final Fantasy VIII',
    109001: 'Final Fantasy IX',
    110001: 'Final Fantasy X',
    111001: 'Final Fantasy XI',
    112001: 'Final Fantasy XII',
    113001: 'Final Fantasy XIII',
    114001: 'Final Fantasy XIV',
    115001: 'Final Fantasy XV',
    150001: 'Final Fantasy Tactics',
    160001: 'Final Fantasy Type-0',
    170001: 'Kingdom Hearts',
    190001: 'Final Fantasy Beyond',
    200001: 'Final Fantasy Record Keeper',
    900072: 'ETC',
  },
  enlirRealm: {
    101001: 'I',
    102001: 'II',
    103001: 'III',
    104001: 'IV',
    105001: 'V',
    106001: 'VI',
    107001: 'VII',
    108001: 'VIII',
    109001: 'IX',
    110001: 'X',
    111001: 'XI',
    112001: 'XII',
    113001: 'XIII',
    114001: 'XIV',
    115001: 'XV',
    150001: 'FFT',
    160001: 'Type-0',
    170001: 'KH',
    190001: 'Beyond',
    200001: 'Core',
    900072: null,
  },
};

export const enlirRealmToSeriesId = _.invert(series.enlirRealm) as Partial<
  { [r in EnlirRealm]: SeriesId }
>;

function enlirRealmTo<T>(mapping: { [s in SeriesId]: T }, realm: EnlirRealm): T | null {
  const seriesId = enlirRealmToSeriesId[realm];
  if (seriesId != null) {
    return mapping[seriesId];
  } else {
    return null;
  }
}

export const enlirRealmLongName = (realm: EnlirRealm) => enlirRealmTo(series.long, realm);
