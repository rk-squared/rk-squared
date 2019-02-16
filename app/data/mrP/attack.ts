import * as _ from 'lodash';

import { EnlirElement, EnlirOtherSkill, EnlirSchool, EnlirSoulBreak } from '../enlir';
import { getElementShortName } from './types';
import { parseNumberString, parsePercentageCounts, toMrPFixed } from './util';

export interface ParsedEnlirAttack {
  damageType: 'phys' | 'white' | 'magic';
  randomChances?: string;

  /**
   * "Normal" multiplier per attack
   */
  attackMultiplier: number;

  /**
   * "Normal" number of attacks.  Null if a random number of attacks.
   */
  numAttacks: number | null;

  /**
   * Text description of total multiplier / number of attacks
   */
  damage: string;

  /**
   * Conditional / alternate damage string
   */
  orDamage?: string;

  /**
   * Condition under which orDamage applies
   */
  orCondition?: string;

  scaleToDamage?: string;
  scaleType?: string;

  element: EnlirElement[] | null;
  school?: EnlirSchool;
  isAoE: boolean;
  isRanged: boolean;
  isJump: boolean;
  isOverstrike: boolean;
  isSummon: boolean;
  isNoMiss: boolean;
}

function describeDamage(
  attackMultiplier: number,
  numAttacks: number,
  includeNumAttacks: boolean = true,
) {
  const multiplier = attackMultiplier * numAttacks;
  return toMrPFixed(multiplier) + (includeNumAttacks && numAttacks !== 1 ? '/' + numAttacks : '');
}

function describeRandomDamage(
  attackMultiplier: number,
  randomAttacks: Array<[number, number]>,
): [string | undefined, string] {
  const percents = randomAttacks.map(([, percent]) => percent);
  const damages = randomAttacks.map(([count]) => describeDamage(attackMultiplier, count));
  const allSamePercentage = _.every(percents, i => i === percents[0]);
  if (allSamePercentage) {
    return [undefined, damages.join(' or ')];
  } else {
    return [percents.join('-') + '%', damages.join('-')];
  }
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
  // prettier-ignore
  const [
    ,
    numAttacksString,
    /*attackType*/,
    /*ranged*/,
    /*jump*/,
    attackMultiplierString,
    overstrike
  ] = m;
  const attackMultiplier = parseFloat(attackMultiplierString);
  const numAttacks = parseNumberString(numAttacksString);
  if (numAttacks == null) {
    return null;
  }

  let damage = '';
  damage += describeDamage(attackMultiplier, numAttacks);
  damage += overstrike ? ' overstrike' : '';
  return damage;
}

function describeOrCondition(orCondition: string): string {
  let m: RegExpMatchArray | null;
  if (orCondition === 'the user is in the front row') {
    return 'if in front row';
  } else if (orCondition === 'exploiting elemental weakness') {
    return 'vs. weak';
  } else if (orCondition === 'all allies are alive') {
    return 'if no allies KO';
  } else if (orCondition === 'the user has any Doom') {
    return 'if Doomed';
  } else if (orCondition.startsWith('the target has ')) {
    // In practice, this is always the same status ailments that the attack
    // itself inflicts.
    return 'vs. status';
  } else if ((m = orCondition.match(/(\d+) or more (.*) are in the party/))) {
    return 'if ' + m[1] + ' ' + m[2] + ' in party';
  } else if ((m = orCondition.match(/(.*) is alive/))) {
    return 'if ' + m[1] + ' alive';
  } else {
    return 'if ' + orCondition;
  }
}

function describeOr(
  effects: string,
  attackMultiplier: number,
  numAttacks: number | null,
): [string | undefined, string | undefined] {
  const m = effects.match(
    /(?:([0-9\.]+) (?:multiplier|mult\.)|([a-z\-]+) attacks) if (.*?)(?=, grants|, causes|, restores HP |, damages the user |, heals the user |, [A-Z]{3}|$)/,
  );
  if (!m) {
    return [undefined, undefined];
  }

  const [, orMultiplier, orNumAttacksString, orCondition] = m;
  const orNumAttacks = orNumAttacksString && parseNumberString(orNumAttacksString);
  let orDamage: string | undefined;
  if (orMultiplier && numAttacks) {
    orDamage = describeDamage(parseFloat(orMultiplier), numAttacks);
  } else if (orNumAttacks) {
    orDamage = describeDamage(attackMultiplier, orNumAttacks);
  }

  return [orDamage, describeOrCondition(orCondition)];
}

function describeScaleType(scaleType: string): string {
  let m: RegExpMatchArray | null;
  if (scaleType === ' scaling with HP%') {
    return '@ 1% HP';
  } else if ((m = scaleType.match(/scaling with (\w+) attacks used/))) {
    return `w/ ${getElementShortName(m[1] as EnlirElement)} atks used`;
  } else if ((m = scaleType.match(/scaling with (\w+) abilities used/))) {
    return `w/ ${m[1]} used`;
  } else {
    return scaleType;
  }
}

export function parseEnlirAttack(
  effects: string,
  skill: EnlirOtherSkill | EnlirSoulBreak,
): ParsedEnlirAttack | null {
  const m = effects.match(
    /([Rr]andomly deals .*|[A-Za-z\-]+) (?:(group|random|single) )?(ranged )?(jump )?attacks? \(([0-9\.]+)(?:~([0-9\.]+))?(?: each)?( scaling with[^)]+)?\)( capped at 99999)?(, 100% hit rate)?/,
  );
  if (!m) {
    return null;
  }

  const [
    ,
    numAttacksString,
    attackType,
    ranged,
    jump,
    attackMultiplierString,
    scaleToAttackMultiplierString,
    scaleType,
    overstrike,
    noMiss,
  ] = m;
  const randomAttacks = parsePercentageCounts(numAttacksString);
  const attackMultiplier = parseFloat(attackMultiplierString);
  const scaleToAttackMultiplier = parseFloat(scaleToAttackMultiplierString);
  const numAttacks = parseNumberString(numAttacksString);
  if ((randomAttacks == null && numAttacks == null) || skill.formula == null) {
    return null;
  }

  let randomChances: string | undefined;
  let damage: string;
  if (randomAttacks) {
    [randomChances, damage] = describeRandomDamage(attackMultiplier, randomAttacks);
  } else {
    randomChances = undefined;
    damage = describeDamage(attackMultiplier, numAttacks!);
  }
  const followedBy = describeFollowedByAttack(skill.effects);
  if (followedBy) {
    damage += ', then ' + followedBy + ',';
  }

  const [orDamage, orCondition] = describeOr(skill.effects, attackMultiplier, numAttacks);

  const scaleToDamage =
    scaleToAttackMultiplierString && numAttacks
      ? // Omit number of attacks - it's always the same as the main attack.
        describeDamage(scaleToAttackMultiplier, numAttacks, false)
      : undefined;

  return {
    isAoE: attackType === 'group',
    damageType: skill.formula === 'Physical' ? 'phys' : skill.type === 'WHT' ? 'white' : 'magic',

    numAttacks,
    attackMultiplier,
    damage,
    randomChances,

    orDamage,
    orCondition,

    scaleToDamage,
    scaleType: scaleType ? describeScaleType(scaleType) : undefined,

    element: skill.element,
    school: 'school' in skill ? (skill.school as EnlirSchool) : undefined,

    isRanged: !!ranged && !jump,
    isJump: !!jump,
    isOverstrike: !!overstrike,
    isSummon: skill.type === 'SUM',
    isNoMiss: !!noMiss,
  };
}
