import * as _ from 'lodash';
import {
  allEnlirElements,
  enlir,
  EnlirElement,
  EnlirRealm,
  EnlirSoulBreak,
  isEnlirElement,
} from './enlir';
import { safeParseSkill } from './mrP/skill';
import * as skillTypes from './mrP/skillTypes';
import { logger } from '../utils/logger';

export type PhysMagElementChain = {
  [s in EnlirElement]?: {
    phys: EnlirSoulBreak[];
    mag: EnlirSoulBreak[];
  };
};

export interface OrganizedChains {
  element: {
    gen05: { [s in EnlirElement]?: EnlirSoulBreak };
    gen1: PhysMagElementChain;
    gen2: PhysMagElementChain;
    gen25: PhysMagElementChain;
  };

  realm: {
    gen1: { [s in EnlirRealm]?: EnlirSoulBreak };
    gen2: { [s in EnlirRealm]?: EnlirSoulBreak };
  };
}

function getElementGen(effect: skillTypes.Chain) {
  if (effect.fieldBonus === 20 && effect.max === 99) {
    return 'gen1' as const;
  } else if (effect.fieldBonus === 50 && effect.max === 150) {
    return 'gen2' as const;
  } else if (effect.fieldBonus === 50 && effect.max === 99) {
    return 'gen25' as const;
  } else {
    return undefined;
  }
}

function getRealmGen(effect: skillTypes.Chain) {
  if (effect.fieldBonus === 50 && effect.max === 150) {
    return 'gen1' as const;
  } else if (effect.fieldBonus === 50 && effect.max === 99) {
    return 'gen2' as const;
  } else {
    return undefined;
  }
}

function getPhysMag(soulBreak: EnlirSoulBreak, effects: skillTypes.EffectClause[]): 'phys' | 'mag' {
  if (soulBreak.type === 'PHY') {
    return 'phys';
  } else if (soulBreak.type === 'BLK' || soulBreak.type === 'SUM' || soulBreak.type === 'WHT') {
    return 'mag';
  } else {
    return effects.find(
      i =>
        i.type === 'status' &&
        i.statuses.find(j => j.status.type === 'standardStatus' && j.status.name.match(/ATK/)),
    )
      ? 'phys'
      : 'mag';
  }
}

function getOrganizedChainsImpl(): OrganizedChains {
  const result: OrganizedChains = {
    element: {
      gen05: {},
      gen1: {},
      gen2: {},
      gen25: {},
    },
    realm: {
      gen1: {},
      gen2: {},
    },
  };

  for (const i of enlir.allSoulBreaks) {
    if (!i.character || i.tier !== 'CSB') {
      continue;
    }
    const effects = safeParseSkill(i);
    const asChain =
      effects && (effects.find(i => i.type === 'chain') as skillTypes.Chain | undefined);
    if (!effects || !asChain) {
      continue;
    }
    if (isEnlirElement(asChain.chainType)) {
      const element = asChain.chainType as EnlirElement;
      if (effects.length === 1) {
        result.element.gen05[element] = i;
        continue;
      }

      const gen = getElementGen(asChain);
      if (!gen) {
        logger.error(`Failed to process chain ${i.name}:`);
        continue;
      }

      const part = (result.element[gen][element] = result.element[gen][element] || {
        phys: [],
        mag: [],
      });

      const physMag = getPhysMag(i, effects);
      part[physMag].push(i);
    } else {
      const realm = asChain.chainType as EnlirRealm;

      const gen = getRealmGen(asChain);
      if (!gen) {
        logger.error(`Failed to process chain ${i.name}:`);
        continue;
      }

      result.realm[gen][realm] = i;
    }
  }

  // Try to sort same-type chains.  The Enlir database doesn't give release
  // order; sorting by the character's soul break number isn't too bad...
  for (const gen of ['gen1', 'gen2', 'gen25'] as const) {
    for (const element of allEnlirElements) {
      const part = result.element[gen][element];
      if (part) {
        for (const physMag of ['phys', 'mag'] as const) {
          part[physMag] = _.sortBy(part[physMag], i => i.id % 1000);
        }
      }
    }
  }

  return result;
}

export const getOrganizedChains = _.memoize(getOrganizedChainsImpl);
