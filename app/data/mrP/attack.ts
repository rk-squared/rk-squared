import * as _ from 'lodash';
import * as XRegExp from 'xregexp';

import { EnlirBurstCommand, EnlirElement, EnlirSchool, EnlirSkill, isSoulBreak } from '../enlir';
import { describeEnlirStatus } from './status';
import {
  formatMediumList,
  formatSchoolOrAbilityList,
  getElementShortName,
  MrPDamageType,
  SB_BAR_SIZE,
} from './types';
import {
  countMatches,
  describeChances,
  formatUseCount,
  orList,
  parseNumberString,
  parsePercentageCounts,
  parseThresholdValues,
  toMrPFixed,
} from './util';

export interface ParsedEnlirAttack {
  damageType: MrPDamageType;
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

  /**
   * For hybrid attacks, this gives the magical damage string, and the damage
   * property gives the physical damage string.
   */
  hybridDamage?: string;
  hybridDamageType?: MrPDamageType;

  additionalCrit?: number[];
  additionalCritType?: string;
  additionalCritDamage?: number;

  minDamage?: number;

  defaultDamage?: string;

  status?: string;
  statusChance?: number;
  statusDuration?: number;

  element: EnlirElement[] | null;
  school?: EnlirSchool;
  isAoE: boolean;
  isRanged: boolean;
  isJump: boolean;
  isOverstrike: boolean;
  isSummon: boolean;
  isNat: boolean;
  isNoMiss: boolean;
}

// Source for convergent mechanics:
// https://www.reddit.com/r/FFRecordKeeper/comments/6eldg4/change_to_convergent_attacks_mechanics/
const sbConvergentScaleFactor = 0.42;
// Only used for Orlandeau's God Among Men
const otherConvergentScaleFactor = 0.35;

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
  return describeChances(damages, percents);
}

const thresholdJoin = ' - ';

function describeThresholdDamage(
  numAttacks: number | null,
  numAttacksRange: number[] | null,
  attackMultiplier: string,
): string {
  let attackMultipliersRange = parseThresholdValues(attackMultiplier);
  if (!numAttacksRange) {
    numAttacksRange = _.times(attackMultipliersRange.length, _.constant(numAttacks!));
  }
  if (attackMultipliersRange.length === 1) {
    attackMultipliersRange = _.times(numAttacksRange.length, _.constant(attackMultipliersRange[0]));
  }
  return _.zip(attackMultipliersRange, numAttacksRange)
    .map(([m, n]) => describeDamage(m!, n!))
    .join(thresholdJoin);
}

function formatThreshold(
  thresholdValues: string,
  thresholdName: string,
  units: string = '',
): string {
  return '@ ' + thresholdValues.replace(/\//g, '-') + units + ' ' + thresholdName;
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
  if (orCondition === 'the user is in the front row' || orCondition === 'user is in front row') {
    return 'if in front row';
  } else if (orCondition === 'exploiting elemental weakness') {
    return 'vs. weak';
  } else if (orCondition === 'all allies are alive') {
    return 'if no allies KO';
  } else if (orCondition === 'the user has any Doom' || orCondition === 'with any Doom') {
    return 'if Doomed';
  } else if ((m = orCondition.match(/the target has (.*)/))) {
    // If we have one status, show it.  Otherwise, in practice, this is always
    // the same status ailments that the attack itself inflicts, so omit
    // details to save space.
    const status = m[1].split(orList);
    return status.length === 1 ? 'vs. ' + status[0] : 'vs. status';
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
    /(?:([0-9\.]+) (?:multiplier|mult\.)|([a-z\-]+) attacks) (?:if (.*?)|(with .*?))(?=, grants|, causes|, restores HP |, damages the user |, heals the user |, [A-Z]{3}|$)/,
  );
  if (!m) {
    return [undefined, undefined];
  }

  const [, orMultiplier, orNumAttacksString, orCondition, withCondition] = m;
  const orNumAttacks = orNumAttacksString && parseNumberString(orNumAttacksString);
  let orDamage: string | undefined;
  if (orMultiplier && numAttacks) {
    orDamage = describeDamage(parseFloat(orMultiplier), numAttacks);
  } else if (orNumAttacks) {
    orDamage = describeDamage(attackMultiplier, orNumAttacks);
  }

  return [orDamage, describeOrCondition(orCondition || withCondition)];
}

function describeScaleType(scaleType: string): string {
  let m: RegExpMatchArray | null;
  if (scaleType === ' scaling with HP%') {
    return '@ 1% HP';
  } else if (scaleType === ' scaling with hits taken') {
    return 'w/ hits taken';
  } else if ((m = scaleType.match(/scaling with (\w+) attacks used/))) {
    return `w/ ${getElementShortName(m[1] as EnlirElement)} atks used`;
  } else if ((m = scaleType.match(/scaling with (\w+) abilities used/))) {
    return `w/ ${m[1]} used`;
  } else if (scaleType === ' scaling with Doom timer') {
    return 'at low Doom time';
  } else {
    return scaleType.trim();
  }
}

function isConvergent(scaleType: string) {
  return scaleType === ' scaling with targets';
}

function describeDamageType({ formula, type }: EnlirSkill): MrPDamageType {
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
      return '?';
  }
}

function describeHybridDamageType(skill: EnlirSkill): MrPDamageType | undefined {
  // HACK: The spreadsheet doesn't record whether it's a physical/magical
  // hybrid or a physical/white hybrid.  I'm not even positive that Cecil's
  // soul break is physical/white instead of physical/magical.  But, since
  // Cecil's soul breaks are the only skills affected by this, we'll hard-code
  // it.
  if (skill.formula !== 'Hybrid') {
    return undefined;
  } else if ('character' in skill && skill.character === 'Cecil (Paladin)') {
    return 'white';
  } else {
    return 'magic';
  }
}

function describeAdditionalCritType(
  {
    additionalCritType,
    additionalCritCharacter,
    additionalCritStatus,
    additionalCritScaleWithUses,
  }: {
    additionalCritType: string;
    additionalCritCharacter: string | null;
    additionalCritStatus: string | null;
    additionalCritScaleWithUses: string | null;
  },
  additionalCrit: number[] | undefined,
): string {
  if (additionalCritCharacter) {
    return `if ${additionalCritCharacter} alive`;
  } else if (additionalCritStatus) {
    // Special case: We don't show "High Retaliate" to the user.
    if (additionalCritStatus === 'Retaliate or High Retaliate') {
      return 'if Retaliate';
    } else {
      return 'if ' + describeEnlirStatus(additionalCritStatus.replace(/^any /, ''));
    }
  } else if (additionalCritScaleWithUses) {
    return formatUseCount(additionalCrit ? additionalCrit.length : undefined);
  } else {
    return additionalCritType;
  }
}

const attackRe = XRegExp(
  String.raw`
  (?:^|,\ )
  (?<numAttacks>[Rr]andomly\ deals\ .*|[A-Za-z-]+|[0-9/]+)\ #
  (?:(?<attackType>group|random|single)\ )?
  (?<modifiers>(hybrid\ |ranged\ |jump\ )*)
  attacks?
  (?:\ \(
    (?<randomMultiplier>randomly\ )?
    (?<attackMultiplier>[0-9.]+|\?)
    (?<altAttackMultiplier>(?:/[0-9.]+)*)?
    (?:\ or\ (?<hybridAttackMultiplier>[0-9.]+))?
    (?:~(?<scaleToAttackMultiplier>[0-9.]+))?
    (?:\ each)?
    (?<scaleType>\ scaling\ with[^)]+?)?
    (?:,\ (?<defaultMultiplier>[0-9.]+)\ default)?
  \))?
  (?<overstrike>,?\ capped\ at\ 99999)?

  (?<scaleWithUses>,?\ scaling\ with\ uses)?
  (?:,?\ (?:scaling|scal\.)\ with\ (?<scaleWithSkillUses>.*?)\ uses)?
  (?<rank>\ at\ rank\ 1/2/3/4/5\ of\ the\ triggering\ ability)?
  (?:\ if\ (?:the\ )?user\ has\ (?<statusThreshold>.*)\ (?<statusThresholdCount>(?:\d+/)+\d+))?
  (?:\ if\ the\ user's\ HP\ are\ below\ (?<lowHpThresholdValue>(?:\d+/)+\d+)%)?
  (?:\ if\ the\ user\ took\ (?<tookHitsValue>(?:\d+/)+\d+)\ (?<tookHits>.*)\ hits)?
  (?:\ at\ (?<statThresholdValue>(?:\d+/)+\d+)\ (?<statThreshold>[A-Z]{3}))?
  (?:,?\ scaling\ with\ (?<attackThresholdType>.*)\ (?:attacks|abilities)\ used\ \((?<attackThresholdCount>(?:\d+/)+\d+)\))?
  (?:\ if\ the\ user\ used\ (?<simpleAttackThresholdCount>(?:\d+/)+\d+)\ damaging\ actions)?
  (?<finisherAttackThreshold>\ if\ the\ user\ used\ (?<finisherAttackThresholdCount>(?:\d+/)+\d+)\ (?<finisherAttackThresholdType>.*)?\ during\ the\ status)?
  (?:\ if\ the\ target\ has\ (?<statusAilmentsThresholdValue>(?:\d+/)+\d+)\ ailments)?

  (?:,\ (?<additionalCrit>[0-9/]+)%\ (?:additional|add.)\ critical\ chance
    (?<additionalCritType>
      \ if\ the\ user\ has\ (?<additionalCritStatus>[A-Za-z ]+)|
      \ if\ (?<additionalCritCharacter>.*?)\ is\ alive|
      (?<additionalCritScaleWithUses>\ scaling\ with\ uses)
    )?
  )?
  (?:,\ (?<additionalCritDamage>[0-9/]+)%\ (?:additional|add\.)\ critical\ damage)?
  (?:,\ (?<statusChance>\d+)%\ chance\ to\ cause\ (?<status>.*?)\ for\ (?<statusDuration>\d+)\ seconds)?

  (?<noMiss>,\ 100%\ hit\ rate)?
  (?:,\ multiplier\ increased\ by\ (?<sbMultiplierIncrease>[0-9.]+)\ for\ every\ SB\ point)?
  (?:\ for\ (?<finisherPercentDamage>[0-9.]+)%\ of\ the\ damage\ dealt\ with\ (?<finisherPercentCriteria>.*)\ during\ the\ status)?
  (?:,\ minimum\ damage\ (?<minDamage>\d+))?
  `,
  'x',
);

/**
 * Parses the "attack" portion of an Enlir skill.
 *
 * @param effects The skill effects string, or the portion of it corresponding
 *   to the attack
 * @param skill The containing Enlir skill JSON
 * @param prereqStatus A status that must be present for this skill to
 *   trigger - e.g., for Edge's Lurking Shadow.  parseEnlirAttack can use this
 *   to clean up attack formatting
 * @param burstCommands Optional list of burst commands for which this skill is
 *   a part.  If present, this is used to process items like Squall's BSB2,
 *   where one command powers up the other.
 */
export function parseEnlirAttack(
  effects: string,
  skill: EnlirSkill,
  {
    prereqStatus,
    burstCommands,
  }: {
    prereqStatus?: string;
    burstCommands?: EnlirBurstCommand[];
  },
): ParsedEnlirAttack | null {
  const m = XRegExp.exec(effects, attackRe) as any;
  if (!m) {
    return null;
  }

  const randomAttacks = parsePercentageCounts(m.numAttacks);
  const attackMultiplier = parseFloat(m.attackMultiplier);
  const scaleToAttackMultiplier = parseFloat(m.scaleToAttackMultiplier);
  const numAttacks = parseNumberString(m.numAttacks);
  const numAttacksRange = m.numAttacks.match('/') ? parseThresholdValues(m.numAttacks) : null;

  const isRanged = m.modifiers.match('ranged');
  const isJump = m.modifiers.match('jump');
  const isHybrid = m.modifiers.match('hybrid') || skill.formula === 'Hybrid';

  let randomChances: string | undefined;
  let damage: string;
  let hybridDamage: string | undefined;
  if (randomAttacks) {
    [randomChances, damage] = describeRandomDamage(attackMultiplier, randomAttacks);
  } else if (numAttacks && m.randomMultiplier && m.altAttackMultiplier) {
    damage = [attackMultiplier, ...m.altAttackMultiplier.split('/').map(parseFloat)]
      .map(i => describeDamage(i, numAttacks))
      .join(' or ');
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
  } else if (numAttacksRange || m.altAttackMultiplier) {
    damage = describeThresholdDamage(
      numAttacks,
      numAttacksRange,
      m.attackMultiplier + (m.altAttackMultiplier || ''),
    );
  } else if (isHybrid && numAttacks) {
    damage = describeDamage(attackMultiplier, numAttacks);
    hybridDamage = describeDamage(parseFloat(m.hybridAttackMultiplier), numAttacks);
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
  } else if (m.rank) {
    scaleType = '@ rank 1-5';
  } else if (m.statThreshold) {
    scaleType = formatThreshold(m.statThresholdValue, m.statThreshold);
  } else if (m.lowHpThresholdValue) {
    scaleType = formatThreshold(m.lowHpThresholdValue, 'HP', '%');
  } else if (m.statusAilmentsThresholdValue) {
    scaleType = formatThreshold(m.statusAilmentsThresholdValue, 'statuses');
  } else if (m.scaleWithUses) {
    const count = numAttacksRange
      ? numAttacksRange.length
      : m.altAttackMultiplier
      ? countMatches(m.altAttackMultiplier, /\//g)
      : undefined;
    scaleType = formatUseCount(count);
  } else if (m.attackThresholdType) {
    scaleType = formatThreshold(
      m.attackThresholdCount,
      formatMediumList(m.attackThresholdType) + ' used',
    );
  } else if (m.simpleAttackThresholdCount) {
    scaleType = formatThreshold(m.simpleAttackThresholdCount, 'atks');
  } else if (m.scaleWithSkillUses) {
    if (burstCommands && burstCommands.filter(i => i.name === m.scaleWithSkillUses)) {
      // Do nothing on the receiving end - the other command will get text from
      // the main function.
      scaleType = undefined;
    } else {
      scaleType = 'w/ ' + m.scaleWithSkillUses + ' uses';
    }
  } else if (m.statusThreshold) {
    let statusThresholdCount: string = m.statusThresholdCount;

    // If the status threshold is the same as the prereq status, then we can
    // filter out "0" from the possible actions.
    if (prereqStatus === m.statusThreshold) {
      statusThresholdCount = m.statusThresholdCount.replace(/^0\//, '');
      if (statusThresholdCount !== m.statThreshold) {
        damage = damage.replace(new RegExp('^.*?' + thresholdJoin), '');
      }
    }

    scaleType = formatThreshold(statusThresholdCount, describeEnlirStatus(m.statusThreshold));
  } else if (m.tookHits) {
    scaleType = formatThreshold(
      m.tookHitsValue,
      m.tookHits.split(orList).join('/') + ' hits taken',
    );
  } else if (m.scaleType && m.scaleToAttackMultiplier && numAttacks && isConvergent(m.scaleType)) {
    const scaleFactor = isSoulBreak(skill) ? sbConvergentScaleFactor : otherConvergentScaleFactor;
    damage = describeConvergentDamage(
      +m.attackMultiplier,
      +m.scaleToAttackMultiplier,
      numAttacks,
      scaleFactor,
    );
    scaleType = convergentScaleType;
  } else {
    if (m.scaleType) {
      scaleType = describeScaleType(m.scaleType);
    }
    if (m.scaleToAttackMultiplier && numAttacks) {
      // Omit number of attacks - it's always the same as the main attack.
      scaleToDamage = describeDamage(scaleToAttackMultiplier, numAttacks, false);
    }
  }

  const defaultDamage =
    m.defaultMultiplier && numAttacks
      ? describeDamage(m.defaultMultiplier, numAttacks, false)
      : undefined;

  const additionalCrit = m.additionalCrit
    ? m.additionalCrit.split(/\//g).map((i: number) => +i)
    : undefined;

  return {
    isAoE: m.attackType === 'group',
    damageType: describeDamageType(skill),

    numAttacks,
    attackMultiplier,
    damage,
    randomChances,
    minDamage: m.minDamage ? +m.minDamage : undefined,
    defaultDamage,

    orDamage,
    orCondition,

    scaleToDamage,
    scaleType,

    hybridDamage,
    hybridDamageType: describeHybridDamageType(skill),

    additionalCrit,
    additionalCritType: m.additionalCritType
      ? describeAdditionalCritType(m, additionalCrit)
      : undefined,
    additionalCritDamage: m.additionalCritDamage ? +m.additionalCritDamage : undefined,

    element: skill.element,
    school: 'school' in skill ? skill.school : undefined,

    status: m.status || undefined,
    statusChance: m.statusChance ? +m.statusChance : undefined,
    statusDuration: m.statusDuration ? +m.statusDuration : undefined,

    isRanged: isRanged && !isJump,
    isJump,
    isOverstrike: !!m.overstrike,
    isSummon: skill.type === 'SUM',
    isNat: skill.type === 'NAT' && skill.formula !== 'Hybrid',
    isNoMiss: !!m.noMiss,
  };
}
