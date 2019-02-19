import * as _ from 'lodash';
import * as XRegExp from 'xregexp';

import { EnlirElement, EnlirOtherSkill, EnlirSchool, EnlirSoulBreak } from '../enlir';
import { formatSchoolOrAbilityList, getElementShortName, SB_BAR_SIZE } from './types';
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
    overstrike,
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

const attackRe = XRegExp(
  String.raw`
  (?<numAttacks>[Rr]andomly\ deals\ .*|[A-Za-z-]+)\ #
  (?:(?<attackType>group|random|single)\ )?
  (?<ranged>ranged\ )?
  (?<jump>jump\ )?
  attacks?
  (?:\ \(
    (?<attackMultiplier>[0-9.]+)
    (?:~(?<scaleToAttackMultiplier>[0-9.]+))?
    (?:\ each)?
    (?<scaleType>\ scaling\ with[^)]+)?
  \))?
  (?<overstrike>,?\ capped\ at\ 99999)?
  (?<noMiss>,\ 100%\ hit\ rate)?
  (?:,\ multiplier\ increased\ by\ (?<sbMultiplierIncrease>[0-9.]+)\ for\ every\ SB\ point)?
  (?:\ for\ (?<finisherPercentDamage>\d+)%\ of\ the\ damage\ dealt\ with\ (?<finisherPercentCriteria>.*)\ during\ the\ status)?
  `,
  'x',
);

export function parseEnlirAttack(
  effects: string,
  skill: EnlirOtherSkill | EnlirSoulBreak,
): ParsedEnlirAttack | null {
  const m = XRegExp.exec(effects, attackRe) as any;
  if (!m) {
    return null;
  }

  const randomAttacks = parsePercentageCounts(m.numAttacks);
  const attackMultiplier = parseFloat(m.attackMultiplier);
  const scaleToAttackMultiplier = parseFloat(m.scaleToAttackMultiplier);
  const numAttacks = parseNumberString(m.numAttacks);

  let randomChances: string | undefined;
  let damage: string;
  if (randomAttacks) {
    [randomChances, damage] = describeRandomDamage(attackMultiplier, randomAttacks);
  } else if (m.finisherPercentDamage) {
    const criteria = formatSchoolOrAbilityList(
      m.finisherPercentCriteria.replace(/ (attacks|abilities)/, ''),
    );
    const finisherPercentDamage = +m.finisherPercentDamage;
    if (numAttacks && numAttacks !== 1) {
      damage = finisherPercentDamage * numAttacks + '% ' + criteria + '/' + numAttacks;
    } else {
      damage = finisherPercentDamage + '% ' + criteria;
    }
  } else {
    damage = describeDamage(attackMultiplier, numAttacks!);
  }
  const followedBy = describeFollowedByAttack(skill.effects);
  if (followedBy) {
    damage += ', then ' + followedBy + ',';
  }

  const [orDamage, orCondition] = describeOr(skill.effects, attackMultiplier, numAttacks);

  let scaleType: string | undefined;
  let scaleToDamage: string | undefined;
  if (m.sbMultiplierIncrease) {
    const sbMultiplierIncrease = parseFloat(m.sbMultiplierIncrease);
    const maxSbMultiplier = attackMultiplier + sbMultiplierIncrease * 6 * SB_BAR_SIZE;
    scaleType = '@ 6 SB bars';
    if (numAttacks) {
      scaleToDamage = numAttacks ? describeDamage(maxSbMultiplier, numAttacks, false) : undefined;
      if ('points' in skill) {
        // Re-adjust the displayed number to reflect actual SB.
        damage = describeDamage(attackMultiplier + skill.points * sbMultiplierIncrease, numAttacks);
      }
    }
  } else {
    if (m.scaleType) {
      scaleType = describeScaleType(m.scaleType);
    }
    if (m.scaleToAttackMultiplier && numAttacks) {
      // Omit number of attacks - it's always the same as the main attack.
      scaleToDamage = describeDamage(scaleToAttackMultiplier, numAttacks, false);
    }
  }

  return {
    isAoE: m.attackType === 'group',
    damageType: skill.type === 'PHY' ? 'phys' : skill.type === 'WHT' ? 'white' : 'magic',

    numAttacks,
    attackMultiplier,
    damage,
    randomChances,

    orDamage,
    orCondition,

    scaleToDamage,
    scaleType,

    element: skill.element,
    school: 'school' in skill ? (skill.school as EnlirSchool) : undefined,

    isRanged: !!m.ranged && !m.jump,
    isJump: !!m.jump,
    isOverstrike: !!m.overstrike,
    isSummon: skill.type === 'SUM',
    isNoMiss: !!m.noMiss,
  };
}
