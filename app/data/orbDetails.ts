import * as _ from 'lodash';

import { logger } from '../utils/logger';
import { EnlirAbility } from './enlir';
import { itemsByName } from './items';

export type OrbType =
  | 'Fire'
  | 'Ice'
  | 'Lightning'
  | 'Earth'
  | 'Wind'
  | 'Holy'
  | 'Dark'
  | 'NE'
  | 'Power'
  | 'Black'
  | 'White'
  | 'Summon';

export const orbCosts = {
  '1': [1, 2, 3, 4, 5],
  '2': [2, 3, 6, 12, 18],
  '2+': [2, 5, 10, 20, 30],
  '3<': [3, 6, 9, 12, 15],
  '3--': [3, 5, 10, 15, 25],
  '3-': [3, 5, 10, 20, 30],
  '3': [3, 6, 12, 18, 30],
  '3+': [3, 8, 15, 30, 45],
  '5': [5, 10, 20, 30, 50],
  '6+': [6, 12, 24, 36, 60],
  '06+': [0, 12, 24, 36, 60],
  '6': [6, 12, 18, 30, 60],
  '6-': [6, 10, 20, 40, 60],
  '8': [8, 15, 30, 45, 75],
  '010': [0, 20, 40, 60, 100],
  '10': [10, 20, 40, 60, 100],
  '10-': [10, 20, 30, 50, 100],
  '15': [15, 30, 45, 75, 150],
};
export type CostType = keyof typeof orbCosts;

const orbCostLookup = _.invert(_.mapValues(orbCosts, _.sum));

const levelToRarity: { [s: string]: number } = {
  Minor: 1,
  Lesser: 2,
  Greater: 4,
  Major: 5,
  Crystal: 6,
};
const defaultRarity = 3;

export function parseOrb(orbName: string): [OrbType, number] {
  const m = orbName.match(/^(Minor |Lesser ||Greater |Major )?(.*?)( Orb| Crystal)?$/);
  if (!m) {
    throw new Error(`Failed to parse ${orbName}`);
  }
  const [, level, typeName, orbOrCrystal] = m;

  const rarity =
    levelToRarity[(orbOrCrystal || '').trim()] ||
    levelToRarity[(level || '').trim()] ||
    defaultRarity;
  const orbType =
    typeName === 'Non-Elemental'
      ? 'NE'
      : typeName.match(/^Summon/)
      ? 'Summon'
      : (typeName as OrbType);
  return [orbType, rarity];
}

export interface OrbCost {
  orbType: OrbType;
  rarity: number;
  cost: CostType;
  id?: number;
}

export function getOrbCosts(ability: EnlirAbility): OrbCost[] {
  return _.toPairs(ability.orbs)
    .filter(([i]) => i !== 'Ability Record')
    .sort(([orbName, costs]) => -costs[0])
    .map(([orbName, costs]) => {
      const [orbType, rarity] = parseOrb(orbName);
      const cost = orbCostLookup[_.sum(costs)] as CostType;

      const item = itemsByName[orbName] || itemsByName[orbName + ' Orb'];
      if (!item) {
        logger.warn(`Unknown orb "${orbName}" for ${ability.name}`);
      }

      return {
        orbType,
        rarity,
        cost,
        id: item ? item.id : undefined,
      };
    });
}
