import { EnlirElement, EnlirOtherSkill, EnlirSoulBreak } from '../enlir';
import { parseNumberString, toMrPFixed } from './util';

export interface ParsedEnlirAttack {
  damageType: 'phys' | 'white' | 'magic';
  damage: string;
  element: EnlirElement[] | null;
  school?: string;
  isAoE: boolean;
  isRanged: boolean;
  isJump: boolean;
  isOverstrike: boolean;
  isSummon: boolean;
}

function describeDamage(damageString: string, numAttacks: number) {
  const multiplier = parseFloat(damageString) * numAttacks;
  return toMrPFixed(multiplier) + (numAttacks !== 1 ? '/' + numAttacks : '');
}

/**
 * Describes the "followed by" portion of an attack.  This is used for 20+1
 * AOSBs.
 */
function describeFollowedByAttack(effects: string): string | null {
  const m = effects.match(
    /followed by ([A-Za-z\-]+) ((?:group|random|single) )?(ranged )?(jump )?attacks? \(([0-9\.]+(?: each)?)\)( capped at 99999)?/,
  );
  if (!m) {
    return null;
  }
  const [, numAttacksString, attackType, ranged, jump, damageString, overstrike] = m;
  const numAttacks = parseNumberString(numAttacksString);
  if (numAttacks == null) {
    return null;
  }

  let damage = '';
  damage += overstrike ? 'overstrike ' : '';
  damage += describeDamage(damageString, numAttacks);
  return damage;
}

export function parseEnlirAttack(
  effects: string,
  skill: EnlirOtherSkill | EnlirSoulBreak,
): ParsedEnlirAttack | null {
  const m = effects.match(
    /([A-Za-z\-]+) (?:(group|random|single) )?(ranged )?(jump )?attacks? \(([0-9\.]+(?: each)?)\)( capped at 99999)?/,
  );
  if (!m) {
    return null;
  }

  const [, numAttacksString, attackType, ranged, jump, damageString, overstrike] = m;
  const numAttacks = parseNumberString(numAttacksString);
  if (numAttacks == null || skill.formula == null || skill.multiplier == null) {
    return null;
  }

  let damage = describeDamage(damageString, numAttacks);
  const followedBy = describeFollowedByAttack(skill.effects);
  if (followedBy) {
    damage += ', then ' + followedBy + ',';
  }

  return {
    isAoE: attackType === 'group',
    damageType: skill.formula === 'Physical' ? 'phys' : skill.type === 'WHT' ? 'white' : 'magic',
    damage,
    element: skill.element,
    school: 'school' in skill ? skill.school : undefined,
    isRanged: !!ranged && !jump,
    isJump: !!jump,
    isOverstrike: !!overstrike,
    isSummon: skill.type === 'SUM',
  };
}
