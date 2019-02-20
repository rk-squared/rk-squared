import { logger } from '../../utils/logger';
import {
  allEnlirElements,
  allEnlirSchools,
  enlir,
  EnlirElement,
  EnlirOtherSkill,
  EnlirStatus,
} from '../enlir';
import { parseEnlirAttack } from './attack';
import { describeEnlirSoulBreak, formatMrP } from './index';
import { splitStatusEffects } from './splitStatusEffects';
import {
  appendElement,
  damageTypeAbbreviation,
  formatSchoolOrAbilityList,
  getElementAbbreviation,
  getElementShortName,
  getSchoolShortName,
} from './types';
import { andList, numberWithCommas, parseNumberString, toMrPFixed } from './util';

/**
 * Status effects which should be omitted from the regular status list
 */
export function includeStatus(status: string): boolean {
  // En-Element is listed separately.
  return !status.startsWith('Attach ');
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
  '{X}% Critical': 'crit ={X}%',

  'Reraise: {X}%': 'Reraise {X}%',

  '{X}% Damage Reduction Barrier 1': '-{X}% Dmg barrier 1',
  '{X}% Damage Reduction Barrier 2': '-{X}% Dmg barrier 2',
  '{X}% Damage Reduction Barrier 3': '-{X}% Dmg barrier 3',
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

function parseFollowUpEffect(effect: string) {
  const m = effect.match(/(?:([cC]asts)|([gG]rants)) (.*) after using (.*)/);
  if (!m) {
    return null;
  }
  const [, casts, grants, skillOrStatus, trigger] = m;
  return {
    isSkill: !!casts,
    isStatus: !!grants,
    skillOrStatus,
    trigger,
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
  } else if ((m = status.match(/(\d+)/))) {
    const statusText = status.replace(/\d+/, '{X}');
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

  if (enlirStatus && parseFollowUpEffect(effect)) {
    return describeFollowUp(enlirStatus);
  }

  if (enlirStatus) {
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

function describeExLike(enlirStatus: EnlirStatus): string {
  return splitStatusEffects(enlirStatus.effects)
    .map(i => describeEnlirStatusEffect(i, enlirStatus))
    .join(', ');
}

function describeFollowUpTrigger(trigger: string): string {
  if (trigger === 'an ability') {
    return 'any ability';
  }

  trigger = trigger
    .split(' ')
    .map(i => (allEnlirElements.indexOf(i as EnlirElement) !== -1 ? i.toLowerCase() : i))
    .map(i => parseNumberString(i) || i)
    .join(' ');

  return trigger
    .replace(/ (abilities|ability|attacks|attack)$/, '')
    .replace(' or ', '/')
    .replace(/^a /, '');
}

function describeFollowUpStatusSkill(skill: EnlirOtherSkill): string | null {
  const m = skill.effects.match(/^Causes (.*) for (\d+) seconds$/);
  if (!m) {
    return null;
  }

  const [, status, duration] = m;
  return describeEnlirStatus(status) + ` ${duration}s`;
}

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
  // Omit ' (SUM)' for Summoning school; it seems redundant.
  damage += attack.isSummon && attack.school !== 'Summoning' ? ' (SUM)' : '';

  return damage;
}

function describeFollowUpSkill(skillName: string): string {
  const skill = enlir.otherSkillsByName[skillName];
  if (!skill) {
    return skillName;
  }

  return describeFollowUpStatusSkill(skill) || describeFollowUpAttackSkill(skill) || skillName;
}

function describeFollowUp(enlirStatus: EnlirStatus): string {
  const followUp = parseFollowUpEffect(enlirStatus.effects);
  if (!followUp) {
    return enlirStatus.effects;
  }
  const describe = followUp.isSkill ? describeFollowUpSkill : describeEnlirStatus;
  return (
    '(' + describeFollowUpTrigger(followUp.trigger) + ' ⤇ ' + describe(followUp.skillOrStatus) + ')'
  );
}

function getEnlirStatusByName(status: string): EnlirStatus | undefined {
  if (enlir.statusByName[status]) {
    return enlir.statusByName[status];
  }

  status = status.replace(/\d+/, 'X');
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
