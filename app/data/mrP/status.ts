import { logger } from '../../utils/logger';
import { allEnlirElements, allEnlirSchools, enlir, EnlirOtherSkill, EnlirStatus } from '../enlir';
import { parseEnlirAttack } from './attack';
import { describeEnlirSoulBreak, formatMrP } from './index';
import { splitStatusEffects } from './split';
import {
  appendElement,
  damageTypeAbbreviation,
  formatSchoolOrAbilityList,
  getElementAbbreviation,
  getElementShortName,
  getSchoolShortName,
  getShortName,
} from './types';
import { andList, numberWithCommas, orList, parseNumberString, toMrPFixed } from './util';

/**
 * Status effects which should be omitted from the regular status list
 */
export function includeStatus(status: string): boolean {
  // En-Element is listed separately by our functions, and smart ether isn't a
  // real status.  Dispel is handled separately.
  return (
    !status.startsWith('Attach ') &&
    !status.match(/\bsmart\b.*\bether\b/) &&
    status !== 'removes positive effects'
  );
}

export function describeStats(stats: string[]): string {
  const result = stats.join('/');
  if (result === 'ATK/DEF/MAG/RES/MND') {
    return 'A/D/M/R/MND';
  } else if (result === 'ATK/DEF/MAG/RES') {
    return 'A/D/M/R';
  } else {
    return result;
  }
}

/**
 * Hide durations for some statuses, like Astra, because that's typically
 * removed due to enemy action.
 */
const hideDuration = new Set(['Astra']);

/**
 * Handle statuses for which the FFRK Community spreadsheet is inconsistent.
 *
 * NOTE: These are unconfirmed.  (If they were confirmed, we'd just update
 * the spreadsheet.)  TODO: Try to clean up alternate status names.
 */
const enlirStatusAltName: { [status: string]: EnlirStatus } = {
  'Critical 100%': enlir.statusByName['100% Critical'],
};

/**
 * Maps from Enlir status names to MMP aliases.  Some Enlir statuses have
 * embedded numbers and so can't use a simple string lookup like this.
 */
const enlirStatusAlias: { [status: string]: string } = {
  Astra: 'Status blink 1',

  'Cast speed *2': 'fastcast',
  'High Quick Cast': 'hi fastcast',

  'Low Regen': 'Regen (lo)',
  'Medium Regen': 'Regen (med)',
  'High Regen': 'Regen (hi)',

  'Last Stand': 'Last stand',
  'Radiant Shield: 100%': 'Reflect Dmg',

  'High Retaliate': 'Retaliate @p1.2',

  'Instant KO': 'KO',
};

for (const i of allEnlirElements) {
  enlirStatusAlias[`Minor Resist ${i}`] = `-10% ${getElementShortName(i)} vuln.`;
}
for (const i of allEnlirSchools) {
  enlirStatusAlias[`${i} +30% Boost`] = `1.3x ${getSchoolShortName(i)} dmg`;
  enlirStatusAlias[`${i} High Quick Cast`] = `${getSchoolShortName(i)} hi fastcast`;
}

const enlirStatusAliasWithNumbers: { [status: string]: string } = {
  'Quick Cast {X}': 'fastcast {X}',
  'High Quick Cast {X}': 'hi fastcast {X}',
  'Instant Cast {X}': 'instacast {X}',
  'Magical Quick Cast {X}': 'fastzap {X}',

  'Magical Blink {X}': 'Magic blink {X}',
  'Physical Blink {X}': 'Phys blink {X}',

  'Stoneskin: {X}%': 'Negate dmg {X}%',

  'Critical Chance {X}%': 'crit ={X}%',
  // The FFRK Community spreadsheet has both forms.  This is probably an error.
  '{X}% Critical': 'crit ={X}%',
  'Critical {X}%': 'crit ={X}%',

  'Reraise: {X}%': 'Reraise {X}%',

  '{X}% Damage Reduction Barrier 1': '{X}% Dmg barrier 1',
  '{X}% Damage Reduction Barrier 2': '{X}% Dmg barrier 2',
  '{X}% Damage Reduction Barrier 3': '{X}% Dmg barrier 3',

  // Manually expand non-standard stat buffs to give their effects instead -
  // this is easier than trying to programmatically identify a few statuses as
  // needing expansion.
  'Crash {X}%': '{X}% DEF/RES',
};

for (const i of allEnlirElements) {
  enlirStatusAliasWithNumbers[`Imperil ${i} {X}%`] = `+{X}% ${getElementShortName(i)} vuln.`;
  enlirStatusAliasWithNumbers[`${i} Stoneskin: {X}%`] =
    'Negate dmg {X}% (' + getElementShortName(i) + ' only)';
  enlirStatusAliasWithNumbers[`${i} Radiant Shield: {X}%`] =
    'Reflect Dmg {X}% as ' + getElementShortName(i);
}
for (const i of allEnlirSchools) {
  for (const j of ['Quick Cast {X}', 'High Quick Cast {X}', 'Instant Cast {x}']) {
    enlirStatusAliasWithNumbers[i + ' ' + j] =
      getSchoolShortName(i) + ' ' + enlirStatusAliasWithNumbers[j];
  }
}

const enlirRankBoost = 'deal 5/10/15/20/30% more damage at ability rank 1/2/3/4/5';
const enlirRankBoostRe = /(.*) (abilities|attacks) deal 5\/10\/15\/20\/30% more damage at ability rank 1\/2\/3\/4\/5/;

const enlirStatusEffectAlias: { [statusEffect: string]: string } = {
  'cast speed x2.00': 'fastcast',
};

const isExStatus = (status: string) => status.startsWith('EX: ');
const isAwakenStatus = (status: string) => status.startsWith('Awaken ');

interface FollowUpEffect {
  isSkill: boolean;
  isStatus: boolean;
  skillOrStatus: string;
  trigger: string;
  isDamageTrigger: boolean;
}

function parseFollowUpEffect(effect: string): FollowUpEffect | null {
  const m = effect.match(/(?:([cC]asts)|([gG]rants)) (.*) after (using|dealing damage with) (.*)/);
  if (!m) {
    return null;
  }
  const [, casts, grants, skillOrStatus, triggerType, trigger] = m;
  return {
    isSkill: !!casts,
    isStatus: !!grants,
    skillOrStatus,
    trigger,
    isDamageTrigger: triggerType === 'dealing damage with',
  };
}

const isFollowUpStatus = ({ effects, codedName }: EnlirStatus) =>
  !!parseFollowUpEffect(effects) ||
  codedName.endsWith('_CHASE') ||
  codedName.startsWith('CHASE_MODE_');

/**
 * "Mode" statuses are, typically, character-specific trances or EX-like
 * statuses provided by a single Ultra or Awakening soul break.
 */
const isModeStatus = ({ codedName }: EnlirStatus) =>
  !!codedName.match(/_MODE/) && codedName !== 'BRAVE_MODE';

function describeGenericStatus(status: string): string | null {
  let m: RegExpMatchArray | null;

  if (enlirStatusAlias[status]) {
    return enlirStatusAlias[status];
  } else if ((m = status.match(/(-?\d+)/))) {
    const statusText = status.replace(/-?\d+/, '{X}');
    if (enlirStatusAliasWithNumbers[statusText]) {
      return enlirStatusAliasWithNumbers[statusText].replace('{X}', m[1]);
    }
  }

  return null;
}

/**
 * Describes a "well-known" or common Enlir status name.
 *
 * One-off statuses instead need to be looked up and their effects processed
 * via describeEnlirStatusEffect.
 */
function describeEnlirStatus(status: string) {
  let m: RegExpMatchArray | null;

  // Generic statuses
  {
    const genericStatus = describeGenericStatus(status);
    if (genericStatus) {
      return genericStatus;
    }
  }

  // Special cases - numbers that require processing, so they can't easily
  // merge with enlirStatusAliasWithNumbers
  if ((m = status.match(/HP Stock \((\d+)\)/))) {
    return 'Autoheal ' + +m[1] / 1000 + 'k';
  } else if ((m = status.match(/Damage Cap (\d+)/))) {
    const [, cap] = m;
    return `dmg cap=${numberWithCommas(+cap)}`;
  } else if ((m = status.match(/((?:[A-Z]{3}(?:,? and |, ))*[A-Z]{3}) ([-+]\d+%)/))) {
    // Status effects: e.g., "MAG +30%" from EX: Attack Hand
    // Reorganize stats into, e.g., +30% MAG to match MMP
    const [, stat, amount] = m;
    return amount + ' ' + stat.split(andList).join('/');
  }

  // More special cases - schools + numbers
  if ((m = status.match(/(\w+) (?:Extended )?\+(\d+)% Boost/))) {
    const [, type, percent] = m;
    const multiplier = 1 + +percent / 100;
    if (type === 'Weakness') {
      return `${toMrPFixed(multiplier)}x dmg vs weak`;
    } else {
      return `${toMrPFixed(multiplier)}x ${type} dmg`;
    }
  }

  // Turn-limited versions of generic statuses.  Some turn-limited versions,
  // like 'hi fastcast 2', are common enough that they're separately listed
  // under enlirStatusAliasWithNumbers and omit the 'turn' text.
  if ((m = status.match(/(.*) (\d)$/))) {
    const [, baseStatus, turns] = m;
    const genericStatus = describeGenericStatus(baseStatus);
    if (genericStatus) {
      return genericStatus + ' ' + turns + (turns === '1' ? ' turn' : ' turns');
    }
  }

  // Fallback
  return status;
}

const getFinisherSkillName = (effect: string) => {
  const m = effect.match(/[Cc]asts (.*?) when removed/);
  return m ? m[1] : null;
};

function describeFinisher(skillName: string) {
  const skill = enlir.otherSkillsByName[skillName];
  if (!skill) {
    logger.warn(`Unknown finisher skill ${skill}`);
    return skillName;
  }

  const mrP = describeEnlirSoulBreak(skill);

  return 'Finisher: ' + formatMrP(mrP);
}

/**
 * Describes a single "status effect" - one fragment of an EnlirStatus effects string
 */
function describeEnlirStatusEffect(effect: string, enlirStatus: EnlirStatus | null) {
  let m: RegExpMatchArray | null;

  if (enlirStatus) {
    const followUp = parseFollowUpEffect(effect);
    if (followUp) {
      return describeFollowUp(followUp);
    }

    const finisherSkillName = getFinisherSkillName(effect);
    if (finisherSkillName) {
      return describeFinisher(finisherSkillName);
    }
  }

  // Generic status effects
  if (enlirStatusEffectAlias[effect]) {
    return enlirStatusEffectAlias[effect];
  }

  // Special cases
  if ((m = effect.match(/((?:[A-Z]{3}(?:,? and |, ))*[A-Z]{3}) ([-+]\d+%)/))) {
    // Status effects: e.g., "MAG +30%" from EX: Attack Hand
    // Reorganize stats into, e.g., +30% MAG to match MMP
    const [, stat, amount] = m;
    return amount + ' ' + stat.split(andList).join('/');
  }

  // Awaken
  if ((m = effect.match(/(.*) (?:abilities|attacks) don't consume uses/))) {
    let result = formatSchoolOrAbilityList(m[1]) + ' inf. hones';
    if (effect.endsWith(enlirRankBoost)) {
      result += ', up to 1.3x dmg @ rank 5';
    }
    return result;
  }

  if ((m = effect.match(/dualcasts (.*) (?:abilities|attacks)/))) {
    if (enlirStatus && isAwakenStatus(enlirStatus.name)) {
      // Ability or element should be redundant for AASBs
      return '100% dualcast';
    } else {
      return `100% dualcast ${formatSchoolOrAbilityList(m[1])}`;
    }
  }

  if ((m = effect.match(enlirRankBoostRe))) {
    return `1.05-1.1-1.15-1.2-1.3x ${m[1]} dmg @ ranks 1-5`;
  }

  // Fallback
  return effect;
}

export interface ParsedEnlirStatus {
  description: string;
  isExLike: boolean;
  defaultDuration: number | null;
  isVariableDuration: boolean;
  chance?: number;
}

/**
 * Describes an "EX mode-like" status.  This is not an exact science, but the
 * general idea is that "common" statuses can be listed more or less as is
 * (possibly using our shorter or more explanatory aliases), while rare or
 * character-specific statuses should be broken down and their individual
 * effects listed separately.
 */
function describeExLike(enlirStatus: EnlirStatus): string {
  return splitStatusEffects(enlirStatus.effects)
    .map(i => describeEnlirStatusEffect(i, enlirStatus))
    .join(', ');
}

/**
 * Describes the trigger portion of a follow-up.
 *
 * @param trigger - Enlir's text description of the trigger
 * @param isDamageTrigger - Does it have to deal damage to trigger?
 */
function describeFollowUpTrigger(trigger: string, isDamageTrigger: boolean): string {
  if (trigger === 'an ability') {
    return 'any ability';
  }

  trigger = trigger.replace(/ (abilities|ability|attacks|attack)$/, '').replace(/^a /, '');

  let count: number | null = null;
  const m = trigger.match(/^(\S+) (.*)/);
  if (m && m[1]) {
    count = parseNumberString(m[1]);
    if (count != null) {
      trigger = m[2];
    }
  }

  trigger = trigger
    .split(orList)
    .map(getShortName)
    .join('/');

  return (count ? count + ' ' : '') + trigger + (isDamageTrigger ? ' dmg' : '');
}

/**
 * Describes a follow-up skill that inflicts a status (e.g., imperil).
 */
function describeFollowUpStatusSkill(skill: EnlirOtherSkill): string | null {
  const m = skill.effects.match(/^Causes (.*) for (\d+) seconds$/);
  if (!m) {
    return null;
  }

  const [, status, duration] = m;
  return describeEnlirStatus(status) + ` ${duration}s`;
}

/**
 * Describes a follow-up attack skill.  This is a simplified version of the
 * main function; since follow-up attacks are typically simpler, we can
 * abbreviate them without confusion.
 *
 * TODO: See about combining this plus describeFollowUpStatusSkill with main function
 */
function describeFollowUpAttackSkill(skill: EnlirOtherSkill): string | null {
  const attack = parseEnlirAttack(skill.effects, skill);
  if (!attack) {
    return null;
  }

  let damage = '';
  damage += attack.isAoE ? 'AoE ' : '';
  damage += attack.randomChances ? attack.randomChances + ' ' : '';
  damage += damageTypeAbbreviation(attack.damageType) + attack.damage;

  damage += appendElement(attack.element, getElementAbbreviation);
  damage += attack.isRanged ? ' rngd' : '';
  damage += attack.isJump ? ' jmp' : '';
  damage += attack.isOverstrike ? ' overstrike' : '';
  damage += attack.school ? ' ' + getSchoolShortName(attack.school) : '';
  damage += attack.isNoMiss ? ' no miss' : '';
  damage += attack.scaleType ? ' ' + attack.scaleType : '';
  // Omit ' (SUM)' for Summoning school; it seems redundant.
  damage += attack.isSummon && attack.school !== 'Summoning' ? ' (SUM)' : '';

  return damage;
}

/**
 * For a follow-up that triggers a skill, describes the skill.
 */
function describeFollowUpSkill(skillName: string): string {
  const skill = enlir.otherSkillsByName[skillName];
  if (!skill) {
    return skillName;
  }

  return describeFollowUpStatusSkill(skill) || describeFollowUpAttackSkill(skill) || skillName;
}

/**
 * For follow-up statuses, returns a string describing the follow-up (how it's
 * triggered and what it does).
 */
function describeFollowUp(followUp: FollowUpEffect): string {
  const describe = followUp.isSkill ? describeFollowUpSkill : describeEnlirStatus;
  return (
    '(' +
    describeFollowUpTrigger(followUp.trigger, followUp.isDamageTrigger) +
    ' ⤇ ' +
    describe(followUp.skillOrStatus) +
    ')'
  );
}

/**
 * Retrieves an EnlirStatus by name, including support for generic numbers and
 * elements.
 */
function getEnlirStatusByName(status: string): EnlirStatus | undefined {
  if (enlir.statusByName[status]) {
    return enlir.statusByName[status];
  }

  if (enlirStatusAltName[status]) {
    return enlirStatusAltName[status];
  }

  status = status.replace(/\d+/, 'X');
  if (enlir.statusByName[status]) {
    return enlir.statusByName[status];
  }

  status = status.replace(/-X/, '+X');
  if (enlir.statusByName[status]) {
    return enlir.statusByName[status];
  }

  for (const i of allEnlirElements) {
    status = status.replace(i, '[Element]');
  }
  if (enlir.statusByName[status]) {
    return enlir.statusByName[status];
  }

  return undefined;
}

/**
 * Parses a string description of an Enlir status name, returning details about
 * it and how it should be shown.
 */
export function parseEnlirStatus(status: string): ParsedEnlirStatus {
  const m = status.match(/(.*) \((\d+)%\)$/);
  let chance: number | undefined;
  if (m) {
    status = m[1];
    chance = +m[2];
  }

  const enlirStatus = getEnlirStatusByName(status);
  if (!enlirStatus) {
    logger.warn(`Unknown status: ${status}`);
  }
  let description = describeEnlirStatus(status);

  const isEx = isExStatus(status);
  const isAwaken = isAwakenStatus(status);
  const isExLike =
    isEx ||
    isAwaken ||
    (enlirStatus != null && (isFollowUpStatus(enlirStatus) || isModeStatus(enlirStatus)));

  if (enlirStatus && isExLike) {
    description = describeExLike(enlirStatus);
    if (isEx) {
      description = 'EX: ' + description;
    }
    if (isAwaken) {
      description = status + ': ' + description;
    }
  }

  return {
    description,
    isExLike,
    defaultDuration: enlirStatus && !hideDuration.has(status) ? enlirStatus.defaultDuration : null,
    isVariableDuration: !!enlirStatus && !!enlirStatus.mndModifier,
    chance,
  };
}

/**
 * Status effect sort orders - we usually follow Enlir's order, but listing
 * effects here can cause them to be sorted before (more negative) or after
 * (more positive) other effects.
 */
const statusSortOrder: { [status: string]: number } = {
  Haste: -1,
  'Last Stand': 1,
};

const getSortOrder = (status: string) => {
  if (isExStatus(status) || isAwakenStatus(status)) {
    return 999;
  } else {
    return statusSortOrder[status] || 0;
  }
};

export function sortStatus(a: string, b: string): number {
  return getSortOrder(a) - getSortOrder(b);
}
