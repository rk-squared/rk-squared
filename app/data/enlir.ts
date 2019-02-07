import * as _ from 'lodash';

// FIXME: Interfaces for remaining Enlir types
export interface EnlirRecordMateria {
  realm: string;
  character: string;
  name: string;
  effect: string;
  unlockCriteria: string;
  nameJp: string;
  id: number;
  gl: boolean;
}

type EnlirSoulBreakTier =
  | 'Default'
  | 'SB'
  | 'BSB'
  | 'OSB'
  | 'USB'
  | 'Glint'
  | 'AOSB'
  | 'AASB'
  | 'Glint+';

export interface EnlirSoulBreak {
  realm: string;
  character: string;
  name: string;
  type: string;
  target: string;
  formula: string | null;
  multiplier: number | null;
  element: string | null;
  time: number;
  effects: string;
  counter: boolean;
  autoTarget: string;
  points: number;
  tier: EnlirSoulBreakTier;
  master: string | null;
  relic: string;
  nameJp: string;
  id: number;
  gl: boolean;
}

const rawData = {
  abilities: require('./enlir/abilities.json'),
  characters: require('./enlir/characters.json'),
  magicite: require('./enlir/magicite.json'),
  recordMateria: require('./enlir/recordMateria.json') as EnlirRecordMateria[],
  relics: require('./enlir/relics.json'),
  soulBreaks: require('./enlir/soulBreaks.json') as EnlirSoulBreak[],
};

// FIXME: Properly update rawData outside of app

export const enlir = {
  abilities: _.keyBy(rawData.abilities, 'id'),
  characters: _.keyBy(rawData.characters, 'id'),
  charactersByName: _.keyBy(rawData.characters, 'name'),
  magicites: _.keyBy(rawData.magicite, 'id'),
  relics: _.keyBy(rawData.relics, 'id'),
  recordMateria: _.keyBy(rawData.recordMateria, 'id'),
  soulBreaks: _.keyBy(rawData.soulBreaks, 'id'),
};
