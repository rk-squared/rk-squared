import * as _ from 'lodash';
import * as XRegExp from 'xregexp';

import {
  EnlirBurstCommand,
  EnlirElement,
  EnlirFormula,
  EnlirSchool,
  EnlirSkill,
  EnlirSkillType,
  EnlirSynchroCommand,
  isSoulBreak,
} from '../enlir';
import { describeEnlirStatus } from './status';
import {
  formatSchoolOrAbilityList,
  getElementShortName,
  getSchoolShortName,
  getShortName,
  MrPDamageType,
  SB_BAR_SIZE,
  XRegExpNamedGroups,
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
  scaleDown?: boolean;

  /**
   * For hybrid attacks, this gives the magical damage string, and the damage
   * property gives the physical damage string.
   */
  hybridDamage?: string;
  hybridDamageType?: MrPDamageType;
  hybridIsPiercing?: boolean;

  additionalDamage?: number[];
  additionalDamageType?: string;
  additionalCrit?: number[];
  additionalCritType?: string;
  additionalCritDamage?: number;

  minDamage?: number;

  defaultDamage?: string;

  status?: string;
  statusChance?: number[];
  statusDuration?: number;

  element: EnlirElement[] | null;
  school?: EnlirSchool;
  isFixedDamage: boolean;
  isAoE: boolean;
  isRanged: boolean;
  isJump: boolean;
  isOverstrike: boolean;
  isSummon: boolean;
  isNat: boolean;
  isNoMiss: boolean;
  isPiercing: boolean;
  airTime?: string;
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

function addNumAttacks(numAttacks: number) {
  return numAttacks !== 1 ? '/' + numAttacks : '';
}

export function describeDamage(
  attackMultiplier: number,
  numAttacks: number,
  includeNumAttacks: boolean = true,
) {
  const multiplier = attackMultiplier * numAttacks;
  return toMrPFixed(multiplier) + (includeNumAttacks ? addNumAttacks(numAttacks) : '');
}

function describeRandomDamage(
  damageFunction: (n: number) => string,
  randomAttacks: Array<[number, number]>,
): [string | undefined, string] {
  const percents = randomAttacks.map(([, percent]) => percent);
  const damages = randomAttacks.map(([count]) => damageFunction(count));
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

export function formatThreshold(
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
function describeFollowedByAttack(effects: string, parentAttackType: string): string | null {
  // HACK: Make sure we don't pick up the "Additional" attacks at the end of
  // some finisher and follow-up skills.
  effects = effects.replace(/ +Additional .*/, '');

  const m = effects.match(
    /followed by ([A-Za-z\-]+) (?:(group|random|single) )?(rang\.?(?:ed)? )?(jump )?attacks? \(([0-9\.]+(?: each)?)\)( capped at 99999)?/,
  );
  if (!m) {
    return null;
  }
  // prettier-ignore
  const [
    ,
    numAttacksString,
    attackType,
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
  damage +=
    attackType === 'group' && parentAttackType !== 'group'
      ? 'AoE '
      : attackType !== 'group' && parentAttackType === 'group'
      ? attackType + ' '
      : '';
  damage += describeDamage(attackMultiplier, numAttacks);
  damage += overstrike ? ' overstrike' : '';
  return damage;
}

function describeOrCondition(orCondition: string, burstCommands?: EnlirBurstCommand[]): string {
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
  } else if ((m = orCondition.match(/the user has (.*)/))) {
    const statusName = m[1];
    let statusDescription = describeEnlirStatus(statusName.replace(/^any /, ''));
    if (statusName === statusDescription && burstCommands) {
      const commandRelatingToStatus = _.findIndex(
        burstCommands,
        i => i.effects.match(new RegExp('[Gg]rants ' + statusName + '\\b')) != null,
      );
      if (commandRelatingToStatus !== -1) {
        statusDescription = 'cmd' + (commandRelatingToStatus + 1) + ' status';
      }
    }
    return 'if ' + statusDescription;
  } else if ((m = orCondition.match(/(.*) is alive/))) {
    return 'if ' + m[1] + ' alive';
  } else if (orCondition === 'equipping a ranged weapon') {
    return 'if using a rngd wpn';
  } else if ((m = orCondition.match(/equipping (an? .*)/))) {
    return 'if using ' + m[1];
  } else {
    return 'if ' + orCondition;
  }
}

function describeOr(
  effects: string,
  attackMultiplier: number,
  numAttacks: number | null,
  burstCommands?: EnlirBurstCommand[],
): [string | undefined, string | undefined] {
  const m = effects.match(
    /(?:([\/0-9\.]+) (?:multiplier|mult\.)|([a-z\-]+) attacks) (?:if (.*?)|(with .*?)|when (.*?))(?=, grants|, causes|, restores HP |, damages the user |, heals the user |, [A-Z]{3}|$)/,
  );
  if (!m) {
    return [undefined, undefined];
  }

  const [, orMultiplier, orNumAttacksString, orCondition, withCondition, whenCondition] = m;
  const orNumAttacks = orNumAttacksString && parseNumberString(orNumAttacksString);
  let orDamage: string | undefined;
  if (orMultiplier && numAttacks) {
    orDamage = orMultiplier
      .split('/')
      .map(i => describeDamage(parseFloat(i), numAttacks))
      .join(thresholdJoin);
  } else if (orNumAttacks) {
    orDamage = describeDamage(attackMultiplier, orNumAttacks);
  }

  return [
    orDamage,
    describeOrCondition(orCondition || withCondition || whenCondition, burstCommands),
  ];
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

function describeAdditionalCritType(
  {
    additionalCritType,
    additionalCritCharacter,
    additionalCritStatus,
    additionalCritScaleWithUses,
    additionalCritFinisherAttackCount,
    additionalCritFinisherAttackType,
    additionalCritSB,
  }: XRegExpNamedGroups,
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
  } else if (additionalCritFinisherAttackCount && additionalCritFinisherAttackType) {
    return formatThreshold(
      additionalCritFinisherAttackCount,
      formatSchoolOrAbilityList(additionalCritFinisherAttackType),
    );
  } else if (additionalCritSB) {
    return formatThreshold(additionalCritSB, 'SB pts');
  } else {
    return additionalCritType;
  }
}

function describeAdditionalDamageType(
  { additionalDamageAbilityCount, additionalDamageAbility }: XRegExpNamedGroups,
  additionalDamage: number[],
): string {
  return formatThreshold(
    additionalDamageAbilityCount,
    getShortName(additionalDamageAbility) + ' allies',
  );
}

function parseRandomAttacks(attacks: string): Array<[number, number]> | null {
  // Try to parse it as a series of percentage-annotated number strings.
  const asPercents = parsePercentageCounts(attacks);
  if (asPercents) {
    return asPercents;
  }

  // Try to parse it as a plain series of number strings.
  const m = attacks.match(/Randomly deals (.*)/);
  if (!m) {
    return null;
  }
  const numAttacks = m[1].split(orList).map(parseNumberString);
  if (_.some(numAttacks, i => i == null)) {
    return null;
  }

  const percentage = 100 / numAttacks.length;
  return numAttacks.map(i => [i, percentage] as [number, number]);
}

const attackRe = XRegExp(
  String.raw`
  (?:^|,\ )
  (?<numAttacks>[Rr]andomly\ deals\ .*|[A-Za-z-]+|[0-9/]+)\ #
  (?:(?<attackType>group|random|single)\ )?
  (?<modifiers>(hybrid\ |rang\.?(?:ed)?\ |jump\ )*)
  attacks?
  (?<hasMultiplier>\ \(
    (?<randomMultiplier>randomly\ )?
    (?<attackMultiplier>[0-9.]+|\?)
    (?<altAttackMultiplier>(?:/[0-9.]+)*)?
    (?:\ or\ (?<hybridAttackMultiplier>[0-9.]+|\?))?
    (?:~(?<scaleToAttackMultiplier>[0-9.]+|\?))?
    (?:\ each)?
    (?<scaleType>\ scaling\ with[^)]+?)?
    (?:,\ (?<defaultMultiplier>[0-9.]+)\ default)?
  \))?
  (?:\ that\ deal\ (?<fixedDamage>\d+)\ damage(?:\ each)?)?
  (?<overstrike>,?\ capped\ at\ 99999)?

  # Hack: Simplified regex from describeFollowedBy.  We should merge it into here.
  (?<followedBy>,\ followed\ by\ (?:[A-Za-z\-]+)\ (?:(?:group|random|single)\ )?(?:rang\.?(?:ed)?\ )?(?:jump\ )?attacks?\ \((?:[0-9\.]+(?:\ each)?)\)(?:\ capped\ at\ 99999)?,?)?

  (?:,\ air\ time\ \((?<airTime>[0-9./]+)(?:\ sec\.?)?\))?

  (?<scaleWithUses>,?\ scaling\ with\ uses)?
  (?:,?\ (?:scaling|scal\.)\ with\ (?<scaleWithSkillUses>.*?)\ uses)?
  (?<rank>\ at\ rank\ 1/2/3/4/5\ of\ the\ triggering\ ability)?
  (?:\ if\ (?:the\ )?user\ has\ (?<statusThreshold>.*)\ (?<statusThresholdCount>(?:\d+/)+\d+))?
  (?:\ if\ the\ user's\ HP\ (?:is|are)\ below\ (?<lowHpThresholdValue>(?:\d+/)*\d+)%)?
  (?:\ if\ the\ user\ took\ (?<tookHitsValue>(?:\d+/)*\d+)\ (?<tookHits>.*)\ hits)?
  (?:\ at\ (?<statThresholdValue>(?:\d+/)*\d+)\ (?<statThreshold>[A-Z]{3}))?
  (?:,?\ scaling\ with\ (?<attackThresholdType>.*)\ (?:attacks|abilities)\ used\ \((?<attackThresholdCount>(?:\d+/)*\d+)\))?
  (?:\ if\ the\ user\ used\ (?<simpleAttackThresholdCount>(?:\d+/)*\d+)\ damaging\ actions)?
  (?:\ if\ the\ user\ used\ (?<finisherAttackThresholdCount>(?:\d+/)*\d+)\ (?<finisherAttackThresholdType>.*?)?\ (?:attacks|abilities)\ during\ the\ status)?
  (?:\ if\ (?<damageDealtThresholdValue>(?:\d+/)*\d+)\ damage\ was\ dealt\ during\ the\ status)?
  (?:\ if\ the\ target\ has\ (?<statusAilmentsThresholdValue>(?:\d+/)*\d+)\ ailments)?
  (?:\ if\ (?<statBreakCount>(?:\d+/)*\d+)\ of\ the\ target's\ stats\ are\ lowered)?
  (?:\ at\ (?<differentAbilityValue>(?:\d+/)*\d+)\ different\ (?<differentAbilityType>.*?)\ abilities\ used)?
  (?:\ if\ the\ user's\ Doom\ timer\ is\ below\ (?<doomThresholdValue>(?:\d+/)*\d+))?
  (?:\ if\ (?<characterInPartyValue>(?:\d+/)*\d+)\ (?<characterInParty>.*?)\ (?:is|are)\ in\ the\ party)?

  (?:,\ (?<additionalDamage>(?:-?\d+/)*\d+)%\ more\ damage\ with\ (?<additionalDamageAbilityCount>(?:\d+/)*\d)\ other\ (?<additionalDamageAbility>.*?)\ users)?
  (?:,\ (?<additionalCrit>[0-9/]+)%\ (?:additional|add.)\ critical\ chance
    (?<additionalCritType>
      \ if\ the\ user\ has\ (?<additionalCritStatus>[A-Za-z ]+)|
      \ if\ the\ user\ used\ (?<additionalCritFinisherAttackCount>(?:\d+/)*\d+)\ (?<additionalCritFinisherAttackType>.*?)?\ (?:attacks|abilities)\ during\ the\ status|
      \ if\ (?<additionalCritCharacter>.*?)\ is\ alive|
      \ if\ the\ user\ has\ (?<additionalCritSB>(?:\d+/)+\d+)|
      (?<additionalCritScaleWithUses>\ scaling\ with\ uses)
    )?
  )?
  (?:,\ (?<additionalCritDamage>[0-9/]+)%\ (?:additional|add\.)\ critical\ damage)?

  # Status chances.  HACK: We don't actually validate "scaling with uses"
  # handling - that only appears with Cid XIV's burst, where it's adequately
  # handled by our 'powers up cmd 2' logic.
  (?:,\ (?<statusChance>[0-9/]+)%\ chance\ to\ cause\ (?<status>.*?)(?:\ scaling\ with\ .*\ uses|\ for\ (?<statusDuration>\d+)\ seconds))?

  (?<noMiss>,\ 100%\ hit\ rate)?
  (?:,\ multiplier\ (?<sbMultiplierIncreaseDecrease>increased|decreased)\ by\ (?<sbMultiplierChange>[0-9.]+)\ for\ every\ SB\ point)?
  (?:\ for\ (?<finisherPercentDamage>[0-9.]+)%\ of\ the\ damage\ dealt\ with\ (?<finisherPercentCriteria>.*)\ during\ the\ status)?
  (?:,\ minimum\ damage\ (?<minDamage>\d+))?
  (?<piercing>,\ ignores\ (?:DEF|RES))?
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
 *   where one command powers up the other, as well as cases like Josef's where
 *   one command grants a unique status that affects the other.
 * @param synchroCommands See burstCommands
 */
export function parseEnlirAttack(
  effects: string,
  skill: EnlirSkill,
  {
    prereqStatus,
    burstCommands,
    synchroCommands,
  }: {
    prereqStatus?: string;
    burstCommands?: EnlirBurstCommand[];
    synchroCommands?: EnlirSynchroCommand[];
  },
): ParsedEnlirAttack | null {
  const m = XRegExp.exec(effects, attackRe) as any;
  if (!m) {
    return null;
  }
  if (!m.hasMultiplier && !m.fixedDamage && !m.finisherPercentDamage) {
    return null;
  }

  const randomAttacks = parseRandomAttacks(m.numAttacks);
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
  if (randomAttacks && m.fixedDamage) {
    const fixedDamage = +m.fixedDamage;
    [randomChances, damage] = describeRandomDamage(
      n => (n === 1 ? m.fixedDamage : fixedDamage * n + '/' + n),
      randomAttacks,
    );
    damage += ' fixed dmg';
  } else if (numAttacks && m.fixedDamage) {
    const fixedDamage = +m.fixedDamage * numAttacks;
    damage = fixedDamage + addNumAttacks(numAttacks) + ' fixed dmg';
  } else if (randomAttacks) {
    [randomChances, damage] = describeRandomDamage(
      n => describeDamage(attackMultiplier, n),
      randomAttacks,
    );
  } else if (numAttacks && m.randomMultiplier && m.altAttackMultiplier) {
    damage = [
      attackMultiplier,
      ...m.altAttackMultiplier
        .replace('/', '')
        .split('/') // we capture altAttackModifier as starting with '/' - remove that
        .map(parseFloat),
    ]
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
  } else if (isHybrid && numAttacksRange && numAttacksRange.length === 2) {
    damage = describeDamage(attackMultiplier, numAttacksRange[0]);
    hybridDamage = describeDamage(parseFloat(m.hybridAttackMultiplier), numAttacksRange[1]);
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
  const followedBy = describeFollowedByAttack(effects, m.attackType);
  if (followedBy) {
    damage += ', then ' + followedBy + ',';
  }

  const [orDamage, orCondition] = describeOr(
    skill.effects,
    attackMultiplier,
    numAttacks,
    burstCommands,
  );

  let scaleType: string | undefined;
  let scaleToDamage: string | undefined;
  let scaleDown: boolean | undefined;
  if (m.sbMultiplierIncreaseDecrease) {
    scaleDown = m.sbMultiplierIncreaseDecrease === 'decreased';
    const sbMultiplierChange = parseFloat(m.sbMultiplierChange) * (scaleDown ? -1 : 1);
    const maxSbMultiplier = attackMultiplier + sbMultiplierChange * 6 * SB_BAR_SIZE;
    scaleType = '@ 6 SB bars';
    if (numAttacks) {
      scaleToDamage = numAttacks ? describeDamage(maxSbMultiplier, numAttacks, false) : undefined;
      if ('points' in skill) {
        // Re-adjust the displayed number to reflect actual SB.
        damage = describeDamage(attackMultiplier + skill.points * sbMultiplierChange, numAttacks);
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
      ? countMatches(m.altAttackMultiplier, /\//g) + 1
      : undefined;
    scaleType = formatUseCount(count);
  } else if (m.finisherAttackThresholdCount) {
    scaleType =
      formatThreshold(
        m.finisherAttackThresholdCount,
        formatSchoolOrAbilityList(m.finisherAttackThresholdType),
      ) + ' used';
  } else if (m.damageDealtThresholdValue) {
    scaleType = formatThreshold(m.damageDealtThresholdValue, 'dmg dealt');
  } else if (m.attackThresholdType) {
    scaleType = formatThreshold(
      m.attackThresholdCount,
      formatSchoolOrAbilityList(m.attackThresholdType) + ' used',
    );
  } else if (m.simpleAttackThresholdCount) {
    scaleType = formatThreshold(m.simpleAttackThresholdCount, 'atks');
  } else if (m.differentAbilityType) {
    scaleType = formatThreshold(
      m.differentAbilityValue,
      'diff. ' + getSchoolShortName(m.differentAbilityType) + ' abils.',
    );
  } else if (m.doomThresholdValue) {
    scaleType = formatThreshold(m.doomThresholdValue, 'sec Doom');
  } else if (m.characterInParty) {
    scaleType = formatThreshold(m.characterInPartyValue, m.characterInParty + ' in party');
  } else if (m.statBreakCount) {
    scaleType = formatThreshold(m.statBreakCount, 'stats lowered');
  } else if (m.scaleWithSkillUses) {
    if (
      (burstCommands && burstCommands.filter(i => i.name === m.scaleWithSkillUses)) ||
      (synchroCommands && synchroCommands.filter(i => i.name === m.scaleWithSkillUses))
    ) {
      // Do nothing on the receiving end - the other command will get text from
      // the main function.
      scaleType = undefined;
    } else {
      scaleType = 'w/ ' + m.scaleWithSkillUses + ' uses';
    }
  } else if (m.statusThreshold) {
    let statusThresholdCount: string = m.statusThresholdCount;

    // If the status threshold is the same as the prereq status, or if this is
    // an EnlirOtherSkill that is granted by the status threshold, then we can
    // filter out "0" from the possible actions.
    const isOwnStatusThreshold =
      'source' in skill && skill.source.replace(/ [0-9\/]+$/, '') === m.statusThreshold;
    if (prereqStatus === m.statusThreshold || isOwnStatusThreshold) {
      statusThresholdCount = m.statusThresholdCount.replace(/^0\//, '');
      if (statusThresholdCount !== m.statThreshold) {
        damage = damage.replace(new RegExp('^.*?' + thresholdJoin), '');
      }
    }

    scaleType = formatThreshold(
      statusThresholdCount,
      isOwnStatusThreshold ? 'stacks' : describeEnlirStatus(m.statusThreshold),
    );
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

  if (effects.match(/damage scales with both ATK and DEF/)) {
    scaleType = scaleType ? scaleType + ' ' : '';
    scaleType = '(based on ATK & DEF)';
  }

  const defaultDamage =
    m.defaultMultiplier && numAttacks
      ? describeDamage(m.defaultMultiplier, numAttacks, false)
      : undefined;

  const additionalDamage = m.additionalDamage
    ? m.additionalDamage.split(/\//g).map((i: string) => +i)
    : undefined;

  const additionalCrit = m.additionalCrit
    ? m.additionalCrit.split(/\//g).map((i: string) => +i)
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
    scaleDown,

    hybridDamage,
    hybridDamageType: describeHybridDamageType(skill),
    hybridIsPiercing: isHybridPiercing(skill),

    additionalDamage,
    additionalDamageType: additionalDamage
      ? describeAdditionalDamageType(m, additionalDamage)
      : undefined,
    additionalCrit,
    additionalCritType: m.additionalCritType
      ? describeAdditionalCritType(m, additionalCrit)
      : undefined,
    additionalCritDamage: m.additionalCritDamage ? +m.additionalCritDamage : undefined,

    element: skill.element,
    school: 'school' in skill ? skill.school : undefined,

    airTime: m.airTime || undefined,

    status: m.status || undefined,
    statusChance: m.statusChance ? (m.statusChance as string).split('/').map(i => +i) : undefined,
    statusDuration: m.statusDuration ? +m.statusDuration : undefined,

    isFixedDamage: m.fixedDamage,
    isRanged: isRanged && !isJump,
    isJump,
    isOverstrike: !!m.overstrike,
    isSummon: skill.type === 'SUM',
    isNat: skill.type === 'NAT' && skill.formula !== 'Hybrid',
    isNoMiss: !!m.noMiss,
    isPiercing: !!m.piercing,
  };
}
