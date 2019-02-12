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

export type EnlirElement =
  | 'Fire'
  | 'Ice'
  | 'Lightning'
  | 'Earth'
  | 'Wind'
  | 'Water'
  | 'Holy'
  | 'Dark'
  | 'Poison'
  | 'NE';

export type EnlirSkillType = 'BLK' | 'NAT' | 'NIN' | 'PHY' | 'SUM' | 'WHT';

export type EnlirSoulBreakTier =
  | 'Default'
  | 'SB'
  | 'BSB'
  | 'OSB'
  | 'USB'
  | 'Glint'
  | 'AOSB'
  | 'AASB'
  | 'Glint+';

export interface EnlirOtherSkill {
  sourceType: string;
  source: string;
  name: string;
  type: EnlirSkillType | null;
  target: string;
  formula: string | null;
  multiplier: number | null;
  element: EnlirElement[] | null;
  time: number;
  effects: string;
  counter: boolean;
  autoTarget: string;
  sb: number;
  school: string;
  id: number;
  gl: boolean;
}

export interface EnlirSoulBreak {
  realm: string;
  character: string;
  name: string;
  type: EnlirSkillType | null;
  target: string;
  formula: string | null;
  multiplier: number | null;
  element: EnlirElement[] | null;
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

export interface EnlirStatus {
  id: number;
  commonName: string;
  effects: string;
  defaultDuration: number | null;
  mndModifier: number | null;
  mndModifierIsOpposed: boolean;
  exclusiveStatus: string[] | null;
  codedName: string;
  notes: string | null;
}

const rawData = {
  abilities: require('./enlir/abilities.json'),
  characters: require('./enlir/characters.json'),
  magicite: require('./enlir/magicite.json'),
  otherSkills: require('./enlir/otherSkills.json') as EnlirOtherSkill[],
  recordMateria: require('./enlir/recordMateria.json') as EnlirRecordMateria[],
  relics: require('./enlir/relics.json'),
  soulBreaks: require('./enlir/soulBreaks.json') as EnlirSoulBreak[],
  status: require('./enlir/status.json') as EnlirStatus[],
};

// FIXME: Properly update rawData outside of app

export const enlir = {
  abilities: _.keyBy(rawData.abilities, 'id'),
  characters: _.keyBy(rawData.characters, 'id'),
  charactersByName: _.keyBy(rawData.characters, 'name'),
  magicites: _.keyBy(rawData.magicite, 'id'),
  otherSkillsByName: _.keyBy(rawData.otherSkills, 'name'),
  relics: _.keyBy(rawData.relics, 'id'),
  recordMateria: _.keyBy(rawData.recordMateria, 'id'),
  soulBreaks: _.keyBy(rawData.soulBreaks, 'id'),
  statusByName: _.keyBy(rawData.status, 'name'),
};
