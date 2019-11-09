import * as _ from 'lodash';

import { logger } from '../../utils/logger';
import { arrayify, arrayifyLength } from '../../utils/typeUtils';
import {
  EnlirBurstCommand,
  EnlirFormula,
  EnlirSkill,
  EnlirSkillType,
  EnlirSynchroCommand,
  isNat,
  isSoulBreak,
} from '../enlir';
import { appendCondition, describeCondition, describeMultiplierScaleType } from './condition';
import {
  appendElement,
  damageTypeAbbreviation,
  DescribeOptions,
  formatSchoolOrAbilityList,
  getElementAbbreviation,
  getElementShortName,
  getSchoolShortName,
  hyphenJoin,
  MrPDamageType,
  SB_BAR_SIZE,
} from './typeHelpers';
import * as types from './types';
import { describeChances, joinOr, toMrPFixed } from './util';

// Source for convergent mechanics:
// https://www.reddit.com/r/FFRecordKeeper/comments/6eldg4/change_to_convergent_attacks_mechanics/
const sbConvergentScaleFactor = 0.42;
// Only used for Orlandeau's God Among Men
const otherConvergentScaleFactor = 0.35;

function forceScalar<T>(value: T | T[], context: string): T {
  if (Array.isArray(value)) {
    logger.warn(`${context}: Unexpectedly received multiple values: ${value.join(', ')}`);
    return value[0];
  }
  return value;
}

function convergentMultiplier(
  minMultiplier: number,
  maxMultiplier: number,
  numberOfEnemies: number,
  scaleFactor: number,
): number {
  return (
    minMultiplier + (maxMultiplier - minMultiplier) * Math.exp(-(numberOfEnemies - 1) * scaleFactor)
  );
}

const convergentScaleType = 'vs 1-2-3… foes';

function isConvergent(attack: types.Attack) {
  return attack.multiplierScaleType && attack.multiplierScaleType.type === 'convergent';
}

/**
 * Describes convergent attacks.  I like MrP's approach of listing numbers
 * instead of just showing the from/to.
 */
function describeConvergentDamage(
  minMultiplier: number,
  maxMultiplier: number,
  numAttacks: number,
  scaleFactor: number,
): string {
  return (
    _.times(3, (i: number) =>
      describeDamage(
        convergentMultiplier(minMultiplier, maxMultiplier, i + 1, scaleFactor),
        numAttacks,
      ),
    ).join(thresholdJoin) + '…'
  );
}

function addNumAttacks(numAttacks: number) {
  return numAttacks !== 1 ? '/' + numAttacks : '';
}

export function describeDamage(
  attackMultiplier: number | number[],
  numAttacks: number | number[],
  includeNumAttacks: boolean = true,
) {
  attackMultiplier = forceScalar(attackMultiplier, 'describeDamage attackMultiplier');
  numAttacks = forceScalar(numAttacks, 'describeDamage numAttacks');
  const multiplier = attackMultiplier * numAttacks;
  return toMrPFixed(multiplier) + (includeNumAttacks ? addNumAttacks(numAttacks) : '');
}

function isRandomNumAttacks(numAttacks: types.NumAttacks): numAttacks is types.RandomNumAttacks {
  return (
    typeof numAttacks === 'object' && 'type' in numAttacks && numAttacks.type === 'randomNumAttacks'
  );
}

function describeRandomDamage(
  damageFunction: (n: number) => string,
  { value }: types.RandomNumAttacks,
): [string | undefined, string] {
  const defaultChanceCount = _.sumBy(value, i => +!Array.isArray(i));
  const defaultChance = 100 / (value.length - defaultChanceCount);
  const percents = value.map(i => (Array.isArray(i) ? i[1] : defaultChance));
  const damages = value.map(i => damageFunction(Array.isArray(i) ? i[0] : i));
  return describeChances(damages, percents);
}

const thresholdJoin = ' - ';

function describeThresholdDamage(
  numAttacks: number | number[],
  attackMultiplier: number | number[],
): string {
  numAttacks = arrayify(numAttacks);
  attackMultiplier = arrayify(attackMultiplier);
  if (numAttacks.length === 1) {
    numAttacks = _.times(attackMultiplier.length, _.constant(numAttacks[0]));
  }
  if (attackMultiplier.length === 1) {
    attackMultiplier = _.times(numAttacks.length, _.constant(attackMultiplier[0]));
  }
  return _.zip(attackMultiplier, numAttacks)
    .map(([m, n]) => describeDamage(m!, n!))
    .join(thresholdJoin);
}

function describeOr(attack: types.Attack): [string | undefined, string | undefined] {
  if (
    !attack.orMultiplier &&
    !attack.orNumAttacks &&
    !attack.orMultiplierCondition &&
    !attack.orNumAttacksCondition
  ) {
    return [undefined, undefined];
  }

  const numAttacks = attack.numAttacks;
  let orDamage: string | undefined;
  if (attack.orMultiplier && !isRandomNumAttacks(numAttacks)) {
    orDamage = arrayify(attack.orMultiplier)
      .map(i => describeDamage(i, numAttacks))
      .join(thresholdJoin);
  } else if (
    attack.orNumAttacks &&
    attack.attackMultiplier &&
    !isRandomNumAttacks(attack.orNumAttacks)
  ) {
    orDamage = describeDamage(attack.attackMultiplier, attack.orNumAttacks);
  }

  return [
    orDamage,
    describeCondition((attack.orMultiplierCondition || attack.orNumAttacksCondition)!),
  ];
}

export function describeDamageType(skill: EnlirSkill): MrPDamageType;
export function describeDamageType(
  formula: EnlirFormula | null,
  type: EnlirSkillType | null,
): MrPDamageType;

export function describeDamageType(
  skillOrFormula: EnlirSkill | EnlirFormula | null,
  type?: EnlirSkillType | null,
): MrPDamageType {
  let formula: EnlirFormula | null;
  if (typeof skillOrFormula === 'object' && skillOrFormula != null) {
    formula = skillOrFormula.formula;
    type = skillOrFormula.type;
  } else {
    formula = skillOrFormula;
  }
  if (formula === 'Hybrid') {
    // For hybrid, report the main damage as physical, and use separate fields
    // for the magical alternative.
    return 'phys';
  }

  switch (type) {
    case 'PHY':
      return 'phys';
    case 'WHT':
      return 'white';
    case 'BLK':
    case 'SUM':
    case 'NIN':
      return 'magic';
    case 'NAT':
      return formula === 'Physical' ? 'phys' : formula === 'Magical' ? 'magic' : '?';
    case '?':
    case null:
    case undefined:
      return '?';
  }
}

function describeHybridDamageType(skill: EnlirSkill): MrPDamageType | undefined {
  if (skill.formula !== 'Hybrid') {
    return undefined;
  } else if (skill.typeDetails && skill.typeDetails.length === 2) {
    return describeDamageType('Magical', skill.typeDetails[1]);
  } else {
    // Fall back to magical.
    // logger.warn(`Missing type details for hybrid skill ${skill.name}`);
    return 'magic';
  }
}

function isHybridPiercing(skill: EnlirSkill): boolean {
  return (
    skill.formula === 'Hybrid' &&
    skill.typeDetails != null &&
    skill.typeDetails.length === 2 &&
    skill.typeDetails[1] === 'NIN'
  );
}

function formatDamageType(damageType: MrPDamageType, abbreviate: boolean): string {
  return abbreviate ? damageTypeAbbreviation(damageType) : damageType + ' ';
}

/**
 * Given an attack, get the values of the scalable parameters for that attack
 * (i.e., the number of attacks and/or the attack multiplier).
 */
function getAttackCount({
  numAttacks,
  attackMultiplier,
}: types.Attack): number | number[] | undefined {
  if (isRandomNumAttacks(numAttacks)) {
    // Currently unimplemented
    return undefined;
  }
  return arrayifyLength(numAttacks) > arrayifyLength(attackMultiplier || [])
    ? numAttacks
    : attackMultiplier;
}

/**
 * Describes the "attack" portion of an Enlir skill.
 *
 * FIXME: Refactor with describeAttack
 * FIXME: Reimplement use of prereqStatus
 *
 * @param skill The containing Enlir skill JSON
 * @param attack The parsed attack
 * @param prereqStatus A status that must be present for this skill to
 *   trigger - e.g., for Edge's Lurking Shadow.  parseEnlirAttack can use this
 *   to clean up attack formatting
 * @param burstCommands Optional list of burst commands for which this skill is
 *   a part.  If present, this is used to process items like Squall's BSB2,
 *   where one command powers up the other, as well as cases like Josef's where
 *   one command grants a unique status that affects the other.
 * @param synchroCommands See burstCommands
 */
function describeAttackDamage(
  skill: EnlirSkill,
  attack: types.Attack,
  {
    prereqStatus,
    burstCommands,
    synchroCommands,
  }: {
    prereqStatus?: string;
    burstCommands?: EnlirBurstCommand[];
    synchroCommands?: EnlirSynchroCommand[];
  },
) {
  const { numAttacks, finisherPercent, finisherPercentCriteria } = attack;
  let { attackMultiplier } = attack;

  if (!(finisherPercent && finisherPercentCriteria) && !attackMultiplier) {
    logger.error(`Skill ${skill.name}: Missing both multiplier and finisher damage`);
    return null;
  }
  // Set something to avoid type errors.
  attackMultiplier = attackMultiplier || NaN;

  if (!!attack.isHybrid !== (skill.formula === 'Hybrid')) {
    logger.warn(`Skill ${skill.name} hybrid attack does not match formula`);
  }

  let randomChances: string | undefined;
  let damage: string;
  let hybridDamage: string | undefined;
  if (isRandomNumAttacks(numAttacks)) {
    [randomChances, damage] = describeRandomDamage(
      n => describeDamage(attackMultiplier || NaN, n),
      numAttacks,
    );
  } else if (attack.isRandomAttackMultiplier && Array.isArray(attack.attackMultiplier)) {
    damage = attack.attackMultiplier.map(i => describeDamage(i, numAttacks)).join(' or ');
  } else if (finisherPercent && finisherPercentCriteria) {
    const criteria = formatSchoolOrAbilityList(finisherPercentCriteria);
    if (typeof numAttacks === 'number' && numAttacks !== 1) {
      damage = finisherPercent * numAttacks + '% ' + criteria + '/' + numAttacks;
    } else {
      damage = finisherPercent + '% ' + criteria;
    }
  } else if (
    attack.isHybrid &&
    attack.hybridMultiplier &&
    Array.isArray(numAttacks) &&
    numAttacks.length === 2
  ) {
    damage = describeDamage(attackMultiplier, numAttacks[0]);
    hybridDamage = describeDamage(attack.hybridMultiplier, numAttacks[1]);
  } else if (Array.isArray(numAttacks) || Array.isArray(attackMultiplier)) {
    damage = describeThresholdDamage(numAttacks, attackMultiplier);
  } else if (attack.isHybrid && attack.hybridMultiplier) {
    damage = describeDamage(attackMultiplier, numAttacks);
    hybridDamage = describeDamage(attack.hybridMultiplier, numAttacks);
  } else {
    damage = describeDamage(attackMultiplier, numAttacks!);
  }

  const [orDamage, orCondition] = describeOr(attack);

  let scaleType: string | undefined;
  let scaleToDamage: string | undefined;
  let scaleDown: boolean | undefined;
  if (attack.sbMultiplierChange && !isRandomNumAttacks(numAttacks)) {
    // Assume a single multiplier.
    const multiplier = Array.isArray(attackMultiplier) ? attackMultiplier[0] : attackMultiplier;

    scaleDown = attack.sbMultiplierChange < 0;
    const maxSbMultiplier = multiplier + attack.sbMultiplierChange * 6 * SB_BAR_SIZE;
    scaleType = '@ 6 SB bars';
    if (numAttacks) {
      scaleToDamage = numAttacks ? describeDamage(maxSbMultiplier, numAttacks, false) : undefined;
      if ('points' in skill) {
        // Re-adjust the displayed number to reflect actual SB.
        damage = describeDamage(multiplier + skill.points * attack.sbMultiplierChange, numAttacks);
      }
    }
  } else if (attack.scaleType && attack.scaleType.type === 'scaleWithSkillUses') {
    const scaleSkill = attack.scaleType.skill;
    if (
      (burstCommands && burstCommands.filter(i => i.name === scaleSkill)) ||
      (synchroCommands && synchroCommands.filter(i => i.name === scaleSkill))
    ) {
      // Do nothing on the receiving end - the other command will get text from
      // the main function.
      scaleType = undefined;
    } else {
      scaleType = describeCondition(attack.scaleType);
    }
  } else if (
    attack.attackMultiplier &&
    attack.scaleToMultiplier &&
    !isRandomNumAttacks(numAttacks) &&
    isConvergent(attack)
  ) {
    const scaleFactor = isSoulBreak(skill) ? sbConvergentScaleFactor : otherConvergentScaleFactor;
    damage = describeConvergentDamage(
      forceScalar(attack.attackMultiplier, 'convergent attackMultiplier'),
      attack.scaleToMultiplier,
      forceScalar(numAttacks, 'convergent numAttacks'),
      scaleFactor,
    );
    scaleType = convergentScaleType;
  } else {
    if (attack.multiplierScaleType) {
      scaleType = describeMultiplierScaleType(attack.multiplierScaleType);
    } else if (attack.scaleType) {
      scaleType = describeCondition(attack.scaleType, getAttackCount(attack));
    }
    if (attack.scaleToMultiplier && !isRandomNumAttacks(numAttacks)) {
      // Omit number of attacks - it's always the same as the main attack.
      scaleToDamage = describeDamage(attack.scaleToMultiplier, numAttacks, false);
    }
  }

  if (attack.scalesWithAtkAndDef) {
    scaleType = scaleType ? scaleType + ' ' : '';
    scaleType = '(based on ATK & DEF)';
  }

  const defaultDamage =
    attack.multiplierScaleType &&
    attack.multiplierScaleType.type === 'doomTimer' &&
    !isRandomNumAttacks(numAttacks)
      ? describeDamage(attack.multiplierScaleType.defaultMultiplier, numAttacks, false)
      : undefined;

  return {
    damageType: describeDamageType(skill),

    numAttacks,
    attackMultiplier,
    damage,
    randomChances,
    defaultDamage,

    orDamage,
    orCondition,

    scaleToDamage,
    scaleType,
    scaleDown,

    hybridDamage,
    hybridDamageType: describeHybridDamageType(skill),
    hybridIsPiercing: isHybridPiercing(skill),
  };
}

export function describeAttack(
  skill: EnlirSkill,
  attack: types.Attack,
  opt: DescribeOptions,
): string {
  const school =
    'school' in skill && skill.school !== '?' && skill.school !== 'Special'
      ? skill.school
      : undefined;
  const attackDamage = describeAttackDamage(skill, attack, {});
  if (!attackDamage) {
    return '???';
  }

  let damage = '';

  const hybridDamageType = describeHybridDamageType(skill);
  const abbreviate = opt.abbreviate || opt.abbreviateDamageType || !!hybridDamageType;
  damage += attack.isAoE ? 'AoE ' : '';
  damage += attackDamage.randomChances ? attackDamage.randomChances + ' ' : '';
  damage += formatDamageType(attackDamage.damageType, abbreviate);
  damage += attack.isPiercing ? '^' : '';
  damage += attackDamage.damage;

  if (attackDamage.hybridDamageType) {
    damage += ' or ';
    damage += formatDamageType(attackDamage.hybridDamageType, abbreviate);
    damage += attackDamage.hybridIsPiercing ? '^' : '';
    damage += attackDamage.hybridDamage;
  }

  damage += appendElement(
    attack.overrideElement ? [attack.overrideElement] : skill.element,
    opt.abbreviate ? getElementAbbreviation : getElementShortName,
  );
  damage += attack.isRanged && !attack.isJump ? ' rngd' : '';
  damage += attack.isJump ? ' jump' : '';
  damage += attack.isOverstrike ? ' overstrike' : '';
  damage += opt.includeSchool && school ? ' ' + getSchoolShortName(school) : '';
  damage += opt.showNoMiss && attack.hitRate === 100 ? ' no miss' : '';

  // If critical hits might depend on the entire attack's scaling, process
  // them now.
  if (attack.additionalCrit && !attack.additionalCritCondition) {
    damage += ' @ +' + hyphenJoin(attack.additionalCrit) + '% crit';
  }
  if (attack.additionalCritDamage && !attack.additionalCritDamageCondition) {
    damage += ` @ +` + hyphenJoin(attack.additionalCritDamage) + '% crit dmg';
  }

  if (!attackDamage.scaleToDamage && attackDamage.scaleType) {
    // Rank chase / threshold / etc.
    damage += ' ' + attack.scaleType;
  }
  if (attackDamage.orDamage && attackDamage.orCondition) {
    damage +=
      ', or ' +
      damageTypeAbbreviation(attackDamage.damageType) +
      attackDamage.orDamage +
      ' ' +
      attackDamage.orCondition;
  }
  if (attackDamage.scaleToDamage && attack.scaleType) {
    // Damage scaling
    damage +=
      (attackDamage.scaleDown ? ', down to ' : ', up to ') +
      damageTypeAbbreviation(attackDamage.damageType) +
      attackDamage.scaleToDamage +
      ' ' +
      attackDamage.scaleType;
  }
  if (attackDamage.defaultDamage) {
    damage +=
      ', default ' + damageTypeAbbreviation(attackDamage.damageType) + attackDamage.defaultDamage;
  }
  if (attack.minDamage) {
    damage += `, min dmg ${attack.minDamage}`;
  }
  if (attack.damageModifier) {
    const damageModifier = arrayify(attack.damageModifier);
    damage += ' @ ' + (damageModifier[0] > 0 ? '+' : '') + damageModifier.join(' - ') + '% dmg';
    damage += appendCondition(attack.damageModifierCondition, attack.damageModifier);
  }
  if (attack.additionalCrit && attack.additionalCritCondition) {
    damage += ' @ +' + hyphenJoin(attack.additionalCrit) + '% crit';
    damage += appendCondition(attack.additionalCritCondition, attack.additionalCrit);
  }
  if (attack.additionalCritDamage && attack.additionalCritDamageCondition) {
    damage += ' @ +' + hyphenJoin(attack.additionalCritDamage) + '% crit dmg';
    damage += appendCondition(attack.additionalCritDamageCondition, attack.additionalCritDamage);
  }
  if (attack.airTime) {
    damage += ', air time ' + attack.airTime + 's';
    damage += appendCondition(attack.airTimeCondition, attack.airTime);
  }
  // Omit ' (SUM)' for Summoning school; it seems redundant.
  damage += skill.type === 'SUM' && school !== 'Summoning' ? ' (SUM)' : '';
  damage += isNat(skill) ? ' (NAT)' : '';

  return damage;
}

export function describeFixedAttack(attack: types.FixedAttack): string {
  const { numAttacks } = attack;

  let randomChances: string | undefined;
  let fixedDamage: string;
  if (isRandomNumAttacks(numAttacks)) {
    [randomChances, fixedDamage] = describeRandomDamage(
      n => (n === 1 ? attack.fixedDamage.toString() : attack.fixedDamage * n + '/' + n),
      numAttacks,
    );
  } else {
    const n = forceScalar(numAttacks, 'describeFixedAttack numAttacks');
    fixedDamage = attack.fixedDamage * n + addNumAttacks(n);
  }

  let damage = '';
  damage += attack.isAoE ? 'AoE ' : '';
  damage += randomChances ? randomChances + ' ' : '';
  damage += fixedDamage + ' fixed dmg';

  return damage;
}

export function describeRandomFixedAttack(attack: types.RandomFixedAttack): string {
  return joinOr(attack.fixedDamage) + ' fixed dmg';
}

export function describeGravityAttack({ damagePercent }: types.GravityAttack): string {
  return damagePercent + '% curr HP dmg';
}

export function describeHpAttack({ multiplier }: types.HpAttack): string {
  return multiplier + ' ⋅ (max HP - curr HP) dmg';
}
