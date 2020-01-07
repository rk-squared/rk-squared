import * as _ from 'lodash';

import { logException, logger } from '../../utils/logger';
import { arrayify, getAllSameValue, scalarify } from '../../utils/typeUtils';
import {
  enlir,
  EnlirElement,
  EnlirSchool,
  EnlirSkill,
  EnlirSkillType,
  EnlirStatus,
  EnlirStatusPlaceholders,
  EnlirStatusWithPlaceholders,
  getEnlirOtherSkill,
  getEnlirStatusByName,
  getEnlirStatusWithPlaceholders,
} from '../enlir';
import { describeDamage, describeDamageType } from './attack';
import * as common from './commonTypes';
import { describeCondition } from './condition';
import { describeRageEffects } from './rage';
import { convertEnlirSkillToMrP, describeRecoilHp, formatMrPSkill } from './skill';
import * as skillTypes from './skillTypes';
import {
  formatSmartEther,
  lowHpAlias,
  rankBoostAlias,
  rankCastSpeedAlias,
  resolveStatusAlias,
  sbPointsAlias,
  sbPointsBoosterAlias,
  statusLevelAlias,
} from './statusAlias';
import * as statusParser from './statusParser';
import * as statusTypes from './statusTypes';
import {
  damageTypeAbbreviation,
  formatSchoolOrAbilityList,
  getElementAbbreviation,
  getElementShortName,
  getSchoolShortName,
  whoText,
} from './typeHelpers';
import {
  andJoin,
  andList,
  formatUseCount,
  handleOrOptions,
  isSequential,
  numberOrUnknown,
  orList,
  percentToMultiplier,
  signedNumber,
  slashMerge,
  slashMergeWithDetails,
  toMrPFixed,
  toMrPKilo,
} from './util';

const wellKnownStatuses = new Set<string>([
  'Berserk',
  'Blind',
  'Confuse',
  'Haste',
  'Paralyze',
  'Petrify',
  'Poison',
  'Protect',
  'Reflect',
  'Regenga',
  'Sap',
  'Shell',
  'Silence',
  'Sleep',
  'Slow',
  'Stop',
  'Stun',
  'KO',
]);

const wellKnownAliases: _.Dictionary<string> = {
  'Low Regen': 'Regen (lo)',
  'Medium Regen': 'Regen (med)',
  'High Regen': 'Regen (hi)',

  // Orlandeau's "Infinite Haste" deserves its own name.
  'Infinite Haste': 'Infinite Haste',
};

interface StatusOptions {
  forceNumbers?: boolean;
}

const uncertain = (isUncertain: boolean | undefined) => (isUncertain ? '?' : '');

export function safeParseStatus(
  status: EnlirStatus,
  placeholders?: EnlirStatusPlaceholders,
): statusTypes.StatusEffect | null {
  try {
    return statusParser.parse(status.effects, placeholders);
  } catch (e) {
    logger.error(`Failed to parse ${status.name}:`);
    logException(e);
    if (e.name === 'SyntaxError') {
      return null;
    }
    throw e;
  }
}

const finisherText = 'Finisher: ';
export const hitWeaknessTriggerText = 'hit weak';
export const formatGenericTrigger = (
  trigger: string,
  description: string,
  percent?: string | number,
) => '(' + trigger + ' ⤇ ' + (percent ? `${percent}% for ` : '') + description + ')';

export function describeStats(stats: string[]): string {
  return stats
    .map(i => i.toUpperCase())
    .join('/')
    .replace(/^ATK\/DEF\/MAG\/RES/, 'A/D/M/R')
    .replace(/^ATK\/MAG\/DEF\/RES/, 'A/D/M/R');
}

/**
 * Hide durations for some statuses, like Astra, because that's typically
 * removed due to enemy action.  Hide Stun (interrupt) because it's effectively
 * instant.
 */
const hideDuration = new Set(['Astra', 'Stun']);

const isExStatus = (status: string) => status.startsWith('EX: ');
const isAwokenStatus = (status: string) =>
  status.startsWith('Awoken ') &&
  status !== 'Awoken Keeper Mode Critical Chance' &&
  !status.endsWith(' Follow-Up');

/**
 * Heuristically guess if this is a stacking status effect.  We identify
 * stacking statuses as those that have names ending with a number and that
 * are exclusive with other statuses with the same base name.
 */
function isStackingStatus({ name, exclusiveStatus }: EnlirStatus): boolean {
  const m = name.match(/^(.*) (\d+)/);
  if (!m || !exclusiveStatus || !exclusiveStatus.length) {
    return false;
  }

  const [, baseName] = m;
  if (
    !_.find(exclusiveStatus, `All other "${baseName}" status`) &&
    !_.find(exclusiveStatus, i => i.match(new RegExp('^' + baseName + ' \\d+')))
  ) {
    return false;
  }

  return true;
}

type FollowUpStatusSequence = Array<[EnlirStatus, statusTypes.StatusEffect]>;

/**
 * Gets the follow-up status sequence for a follow-up effect with the given
 * status name.
 *
 * A "status sequence" is used to handle soul breaks like Auron's Lost Arts,
 * where the soul break grants a Status Level 0, which is a follow-up status
 * granting Status Level 1, which is a follow-up status granting
 * Status Level 2, etc.
 */
function getFollowUpStatusSequence(
  statusName: string,
  trigger: statusTypes.Trigger,
): FollowUpStatusSequence | null {
  if (!statusName.endsWith(' 1')) {
    return null;
  }

  const result: FollowUpStatusSequence = [];
  const baseStatusName = statusName.replace(/ 1$/, '');
  for (let n = 1; ; n++) {
    // Verify that the next status in the sequence exists, that it's actually
    // a follow-up status, and that it's triggered the same as this status.
    // (If it has a different trigger, we can't format it as part of the same
    // sequence.)
    const thisStatusName = baseStatusName + ' ' + n;
    const thisStatus = getEnlirStatusByName(thisStatusName);
    if (!thisStatus) {
      break;
    }

    const thisEffects = safeParseStatus(thisStatus);
    if (!thisEffects) {
      break;
    }

    let hasFollowUp = false;
    for (let i = 0; i < thisEffects.length; i++) {
      const effect = thisEffects[i];
      if (effect.type === 'triggeredEffect' && _.isEqual(trigger, effect.trigger)) {
        const triggeredEffects = arrayify(effect.effects);
        for (let j = 0; j < triggeredEffects.length; j++) {
          const e = triggeredEffects[j];
          if (e.type === 'grantStatus') {
            const followUp = _.find(
              arrayify(e.status),
              granted =>
                granted.status === thisStatusName ||
                granted.status === baseStatusName + ' ' + (n + 1),
            );
            if (followUp) {
              hasFollowUp = true;
              if (!Array.isArray(e.status)) {
                triggeredEffects.splice(j, 1);
              } else {
                e.status = scalarify(e.status.filter(granted => granted !== followUp));
              }
              if (!triggeredEffects.length) {
                thisEffects.splice(i, 1);
              } else {
                effect.effects = scalarify(triggeredEffects);
              }
            }
          }
        }
      }
    }

    result.push([thisStatus, thisEffects]);

    if (!hasFollowUp) {
      break;
    }
  }
  return result.length > 1 ? result : null;
}

/**
 * Given a follow-up status sequence, return a merged string describing the
 * effects.
 */
function describeMergedSequence(sequence: FollowUpStatusSequence) {
  // Hack: Insert spaces in strings like '2x' and '50%' so that their numeric
  // parts can be slash-merged, then remove them when done.
  const parts = sequence.map(([status, effects]) =>
    describeEnlirStatusEffects(effects, status, undefined, { forceNumbers: true }).replace(
      /(\d)([x%])([ ,]|$)/g,
      '$1 $2$3',
    ),
  );
  return slashMerge(parts, { join: '-' }).replace(/(\d) ([x%])([ ,]|$)/g, '$1$2$3');
}

const isTriggerStatus = (statusEffects: statusTypes.StatusEffect) =>
  statusEffects.find(
    i =>
      i.type === 'switchDraw' ||
      i.type === 'switchDrawStacking' ||
      ('trigger' in i && i.trigger != null),
  ) != null;

const isSoulBreakMode = ({ name, codedName }: EnlirStatus) =>
  codedName === 'BRAVE_MODE' ||
  codedName === 'BURST_MODE' ||
  codedName === 'SYNCHRO_MODE' ||
  // Prior to the introduction of Synchro, this was the coded name for burst.
  codedName === 'TRANCE' ||
  name === 'Brave Mode' ||
  name === 'Burst Mode' ||
  name === 'Synchro Mode';

/**
 * "Mode" statuses are, typically, character-specific trances or EX-like
 * statuses provided by a single Ultra or Awakening soul break.
 */
function isModeStatus(enlirStatus: EnlirStatus): boolean {
  const { name, codedName, effects } = enlirStatus;
  if (isSoulBreakMode(enlirStatus)) {
    return false;
  } else {
    const codedNameString = codedName || '';
    return (
      !!codedNameString.match(/_MODE/) ||
      name.endsWith(' Mode') ||
      // Specialized counter-attacks
      (codedNameString.startsWith('COUNTER_AIMING') &&
        name !== 'Retaliate' &&
        name !== 'High Retaliate') ||
      // Rage statuses
      effects.match(/[Ff]orces a specified action/) != null ||
      // Special cases - treat as a mode to give it more room for its description.
      name === 'Haurchefant Cover'
    );
  }
}

/**
 * Checks whether this status effect indicates that it's limited to a specific
 * soul break's mode status.
 */
function isModeLimitedEffect(effect: statusTypes.EffectClause): boolean {
  // Hack: "Any" statuses are typically well-known statuses like Stoneskin
  // or Physical Blink.  Specific statuses are normally related to the
  // current soul break.
  return effect.type === 'removedUnlessStatus' && !effect.any;
}

/**
 * Various usual statuses for which we want to force showing individual
 * effects.
 */
function forceEffects({ name, codedName }: EnlirStatus) {
  return (
    (codedName && codedName.startsWith('ABSORB_HP_')) ||
    name.startsWith('Greased Lightning ') ||
    name === 'Phantom Regen'
  );
}

/**
 * Various statuses which are specialized, verbose, and always self, so we show
 * them as "detail" instead of "self."
 */
function forceDetail({ name }: EnlirStatus) {
  return (
    name === 'Runic' ||
    name === 'High Runic' ||
    name === 'Sentinel' ||
    name === 'Unyielding Fist' ||
    name === 'Haurchefant Cover' ||
    name.startsWith('Ingredients ')
  );
}

function isBurstToggle({ effects }: EnlirStatus) {
  return effects.match(/affects certain burst commands/i) != null;
}

export const allTranceStatus = new Set(
  _.values(enlir.legendMateria)
    // Exclude LMRs - those may grant generic statuses as trance.
    .filter(i => i.relic == null)
    .map(i => i.effect.match(/.*[Gg]rants (.*) when HP fall below/))
    .filter(i => i != null && !i[1].match(/to all allies/))
    .map(i => i![1].split(andList))
    // Take the last status - in practice, that's the one that's the character-
    // specific trance.
    .map(i => i[i.length - 1])
    // Exclude generic statuses, like Haurchefant and Jack.
    .filter(i => resolveStatusAlias(i) == null),
);

export function isTranceStatus({ name }: EnlirStatus) {
  return allTranceStatus.has(name);
}

/**
 * Custom stat mods - Bushido, Dark Bargain, etc.  Omit turn-limited effects
 * here; it's easier to special case those within describeEnlirStatus than to
 * make describeEffects smart enough to handle them.
 */
const isCustomStatMod = ({ name, codedName, effects }: EnlirStatus) =>
  (codedName && codedName.startsWith('CUSTOM_PARAM_') && !effects.match(/, lasts for \d+ turn/)) ||
  name === 'Advance';

interface AnyType {
  element?: common.OrOptions<EnlirElement>;
  school?: common.OrOptions<EnlirSchool>;
  ranged?: boolean;
  nonRanged?: boolean;
  jump?: boolean;
  magical?: boolean;
  skillType?: EnlirSkillType | EnlirSkillType[];
  skill?: string;
}

function isMagical(skillType: EnlirSkillType | EnlirSkillType[]): boolean {
  return Array.isArray(skillType) && _.isEqual(_.sortBy(skillType), ['BLK', 'BLU', 'SUM', 'WHT']);
}

function formatAnyType(type: AnyType, suffix?: string, physAbbrev?: string): string {
  const result: string[] = [];

  // The way that formatAnyType is used, a slash-separated list of alternatives
  // may be displayed the same as a comma-separated list.
  if (type.element) {
    if (common.isOptions(type.element)) {
      result.push(type.element.options.map(getElementAbbreviation).join('/'));
    } else {
      result.push(formatSchoolOrAbilityList(type.element));
    }
  }
  if (type.school) {
    result.push(
      formatSchoolOrAbilityList(common.isOptions(type.school) ? type.school.options : type.school),
    );
  }

  const magical = type.magical || (type.skillType && isMagical(type.skillType));
  if (type.skillType === 'PHY' && physAbbrev) {
    result.push(physAbbrev);
  } else if (type.skillType && !magical) {
    result.push(arrayify(type.skillType).join('/'));
  }
  if (type.ranged && !type.jump) {
    result.push('rngd');
  }
  if (type.nonRanged) {
    result.push('non-rngd');
  }
  if (type.jump) {
    result.push('jump');
  }
  if (type.skill) {
    result.push(type.skill);
  }
  if (magical) {
    result.push('mag');
  }
  return result.length ? result.join(' ') + (suffix || '') : '';
}

function formatAnyCast<T extends AnyType>(type: T, cast: string): string {
  // Since we treat magical damage specially ("...zap"), and to match MrP, we
  // treat physical damage specially also.
  return (
    formatAnyType({ ...type, magical: false }, ' ', 'phys') + cast + (type.magical ? 'zap' : 'cast')
  );
}

function formatElementOrSchoolList(
  {
    element,
    school,
  }: { element?: EnlirElement | EnlirElement[]; school?: EnlirSchool | EnlirSchool[] },
  prefix: string = '',
  suffix: string = '',
): string {
  return (
    (element ? prefix + formatSchoolOrAbilityList(element) + suffix : '') +
    (school ? prefix + formatSchoolOrAbilityList(school) + suffix : '')
  );
}

function shouldAbbreviateTurns(effect: statusTypes.EffectClause) {
  return (
    effect.type === 'instacast' ||
    effect.type === 'castSpeed' ||
    effect.type === 'instantAtb' ||
    effect.type === 'atbSpeed'
  );
}

function formatAwoken({
  awoken,
  dualcast,
  instacast,
  rankBoost,
  rankCast,
}: statusTypes.Awoken): string {
  const type = formatSchoolOrAbilityList('school' in awoken ? awoken.school : awoken.element);
  let result = `${type} inf. hones`;
  // TODO: Remove redundant `${type}` below
  if (rankBoost) {
    result += ', up to 1.3x dmg @ rank 5';
  }
  if (rankCast) {
    result += ', ' + rankCastSpeedAlias(type);
  }
  if (dualcast) {
    result += ', 100% dualcast';
  }
  if (instacast) {
    result += `, ${type} instacast`;
  }
  return result;
}

function formatTriggerCount(count: statusTypes.TriggerCount) {
  if (!('values' in count)) {
    return formatUseCount(count) + ' ';
  }

  if (count.values === 1 && !count.plus) {
    return '';
  }

  const values = arrayify(count.values);
  let result: string;
  if (isSequential(values) && values.length > 4) {
    // Clean up a slashed numbers list by summarizing longer ranges.
    result = values[0] + '-' + values[values.length - 1];
  } else {
    result = values.join('/');
  }
  return result + (count.plus ? '+' : '') + ' ';
}

/**
 * Gets a good preposition to use for expressing this trigger as a duration.
 * This is a hack.
 */
function getTriggerPreposition(trigger: statusTypes.Trigger): string {
  if (trigger.type === 'damaged' || (trigger.type === 'skillTriggered' && trigger.isSelfSkill)) {
    return 'until';
  } else if (trigger.type === 'skillTriggered' || trigger.type === 'ability') {
    return 'for next';
  } else {
    return 'for';
  }
}

function formatTrigger(trigger: statusTypes.Trigger): string {
  switch (trigger.type) {
    case 'ability':
      const count = formatTriggerCount(trigger.count);
      let result: string;
      if (!trigger.element && !trigger.school && !trigger.jump) {
        if (trigger.requiresAttack) {
          result = !count ? 'any attack' : count + ' attacks';
        } else {
          result = !count ? 'any ability' : count + ' abilities';
        }
      } else {
        result = count + formatAnyType(trigger);
      }
      return result + (trigger.requiresDamage ? ' dmg' : '');
    case 'crit':
      return 'crit';
    case 'vsWeak':
      return hitWeaknessTriggerText;
    case 'whenRemoved':
      // Finishers are handled separately, so this code path isn't hit.
      return 'finisher';
    case 'auto':
      return describeAutoInterval(trigger.interval);
    case 'damaged':
      return 'damaged';
    case 'dealDamage':
      return 'next atk';
    case 'loseStatus':
      return (statusLevelAlias[trigger.status] || trigger.status) + ' lost';
    case 'skill':
      return (trigger.count ? trigger.count + ' ' : '') + arrayify(trigger.skill).join('/');
    case 'skillTriggered':
      return trigger.count + ' ' + (trigger.isSelfSkill ? 'times' : trigger.skill);
    case 'damagedByAlly':
      return `take ${formatAnyType(trigger, ' ')}dmg from ally`;
    case 'singleHeal':
      return 'ally heal';
    case 'lowHp':
      return lowHpAlias(trigger.value);
  }
}

function addTrigger(effect: string, trigger: statusTypes.Trigger | undefined): string {
  if (!trigger) {
    return effect;
  } else {
    return formatGenericTrigger(formatTrigger(trigger), effect);
  }
}

function formatCastSkill(
  effect: statusTypes.CastSkill | statusTypes.RandomCastSkill,
  enlirStatus: EnlirStatus,
  abbreviate: boolean,
  condition: common.Condition | undefined,
): string {
  const skillText = handleOrOptions(effect.skill, skill => {
    let options: string[];
    if (skill.match('/') && !getEnlirOtherSkill(skill, enlirStatus.name)) {
      options = expandSlashOptions(skill);
    } else {
      options = [skill];
    }

    const result = options.map(option => {
      const enlirSkill = getEnlirOtherSkill(option, enlirStatus.name);
      if (!enlirSkill) {
        return option;
      } else {
        return formatMrPSkill(
          convertEnlirSkillToMrP(enlirSkill, {
            abbreviate,
            showNoMiss: false,
            includeSchool: true,
            includeSbPoints: false,
            prereqStatus: getPrereqStatus(condition),
          }),
          { showTime: false },
        );
      }
    });

    if (options.length > 1) {
      // Slash-merging skills is really a hack:
      // - For abilities like Exdeath's Balance of Power or Relm's Friendly
      //   Friendly Sketch that have significantly varying effects, the code
      //   does a good job of separating the clauses.
      // - For abilities like Dr. Mog's AASB that have the same number of
      //   effects, some effects can be similar enough to force another one to
      //   merged piecemeal.  Merge effects individually in that case.
      // There really ought to be a better way of handling this...
      const resultParts = result.map(i => i.split(', '));
      const length = getAllSameValue(resultParts.map(i => i.length));
      if (length) {
        return _.times(length, i => slashMerge(resultParts.map(parts => parts[i]))).join(', ');
      }
    }
    return slashMerge(result);
  });
  return skillText + (effect.type === 'randomCastSkill' ? ' (random)' : '');
}

function formatGrantStatus(
  { verb, status, who, duration, condition }: statusTypes.GrantStatus,
  trigger: statusTypes.Trigger,
  enlirStatus: EnlirStatus,
  source: EnlirSkill | undefined,
): string {
  let result = '';
  result += verb === 'removes' ? 'remove ' : '';

  if (who && who !== 'self' && who !== 'target') {
    result += whoText[who] + ' ';
  } else if (who === 'target' && trigger.type === 'singleHeal') {
    result += whoText['ally'] + ' ';
  } else if (!who && arrayify(status).find(i => i.chance != null)) {
    // Hack: The convention is to show chance for negative statuses.  A
    // negative self status is unusual, so force showing who in that case.
    // This is used for Eight's trance (Back to the Wall Mode).
    result += whoText['self'] + ' ';
  }

  result += arrayify(status)
    .reduce(slashMergeElementStatuses, [])
    .map((i: statusTypes.StatusWithPercent) => {
      if (i.status === enlirStatus.name) {
        return 'status';
      }
      const sequence = getFollowUpStatusSequence(i.status, trigger);
      if (sequence) {
        return describeMergedSequence(sequence);
      } else {
        return slashMerge(
          expandSlashOptions(i.status).map(option => {
            const parsed = parseEnlirStatus(option, source);
            let optionResult = parsed.description;

            // Hack: Partial duplication of logic on when to append durations.
            // This is valuable to make Galuf AASB's instacast clear.
            if (
              !duration &&
              parsed.defaultDuration &&
              !parsed.isVariableDuration &&
              !parsed.specialDuration &&
              !parsed.isModeLimited
            ) {
              optionResult +=
                ' ' + formatDuration({ value: parsed.defaultDuration, units: 'seconds' });
            }

            if (i.chance) {
              optionResult += ` (${i.chance}%)`;
            }
            return optionResult;
          }),
        );
      }
    })
    .join(', ');

  if (duration) {
    result += ' ' + formatDuration(duration);
  }
  if (condition) {
    result += ' ' + describeCondition(condition);
  }

  return result.trim();
}

function getPrereqStatus(condition: common.Condition | undefined): string | undefined {
  return condition && condition.type === 'status' ? condition.status : undefined;
}

function formatTriggerableEffect(
  effect: statusTypes.TriggerableEffect,
  trigger: statusTypes.Trigger,
  enlirStatus: EnlirStatus,
  source: EnlirSkill | undefined,
  abbreviate: boolean,
  condition: common.Condition | undefined,
): string {
  switch (effect.type) {
    case 'castSkill':
    case 'randomCastSkill':
      return formatCastSkill(effect, enlirStatus, abbreviate, condition);
    case 'gainSb':
      return sbPointsAlias(effect.value);
    case 'grantStatus':
      return formatGrantStatus(effect, trigger, enlirStatus, source);
    case 'heal':
      return whoText[effect.who] + ' heal ' + toMrPKilo(effect.fixedHp) + ' HP';
    case 'triggerChance':
      return (
        effect.chance +
        '% for ' +
        formatTriggerableEffect(effect.effect, trigger, enlirStatus, source, abbreviate, condition)
      );
    case 'recoilHp':
      return describeRecoilHp(effect);
    case 'smartEther':
      return formatSmartEther(effect.amount, effect.school);
  }
}

function formatSwitchDraw(
  elements: EnlirElement[],
  isStacking?: boolean,
  stackingLevel?: number,
): string {
  return formatGenericTrigger(
    elements.map(getElementShortName).join('/'),
    elements.map(getElementShortName).join('/') +
      ' infuse' +
      (stackingLevel ? ' ' + stackingLevel : '') +
      (isStacking ? ' w/ stacking' : ''),
  );
}

function formatTriggeredEffect(
  effect: statusTypes.TriggeredEffect,
  enlirStatus: EnlirStatus,
  source?: EnlirSkill,
): string {
  // Following MrP's example, finishers are displayed differently.
  const isFinisher = effect.trigger.type === 'whenRemoved';
  const effects = arrayify(effect.effects)
    .map(i =>
      formatTriggerableEffect(
        i,
        effect.trigger,
        enlirStatus,
        source,
        !isFinisher,
        effect.condition,
      ),
    )
    .join(', ');

  // Hack: As of January 2020, any prerequisite status is always reflected in
  // the follow-up skill, so we don't need to list it separately.  (See, e.g.,
  // Edge's Chaotic Moon / Lurking Shadow.)
  const condition =
    effect.condition && !getPrereqStatus(effect.condition)
      ? ' ' + describeCondition(effect.condition)
      : '';

  if (isFinisher) {
    return 'Finisher: ' + effects + condition;
  } else {
    return (
      '(' +
      formatTrigger(effect.trigger) +
      ' ⤇ ' +
      effects +
      condition +
      (effect.onceOnly ? ' (once only)' : '') +
      ')'
    );
  }
}

function formatCastSpeedBuildup({
  value,
  increment,
  max,
  requiresAttack,
}: statusTypes.CastSpeedBuildup): string {
  const what = requiresAttack ? 'atk' : 'abil';
  const maxCount = Math.round((max - value) / increment);
  return `cast speed ${value.toFixed(1)}x, +${increment.toFixed(
    1,
  )}x per ${what}, max ${max}x @ ${maxCount} ${what}s`;
}

function formatAbilityBuildup(effect: statusTypes.AbilityBuildup): string {
  const increment = percentToMultiplier(effect.increment);
  const max = percentToMultiplier(effect.max);
  const school = getSchoolShortName(effect.school);
  const maxCount = effect.max / effect.increment;
  return `${increment}x ${school} dmg per ${school}, max ${max}x @ ${maxCount} ${school}`;
}

function formatCounter(
  { skillType, chance, counter, enemyOnly }: statusTypes.Counter,
  source?: EnlirStatus,
): string {
  let counterText: string;
  let isSimple = skillType === 'PHY';
  if (!counter) {
    counterText = 'Retaliate';
  } else if (counter.type === 'attack') {
    counterText =
      'Retaliate @' +
      damageTypeAbbreviation(describeDamageType(null, counter.overrideSkillType)) +
      describeDamage(counter.attackMultiplier, counter.numAttacks);
  } else {
    isSimple = false;
    const skill = getEnlirOtherSkill(counter.skill, source ? source.name : undefined);
    if (!skill) {
      logger.warn(`Unknown counter skill ${skill}`);
      counterText = counter.skill;
    } else {
      const mrP = convertEnlirSkillToMrP(skill, {
        abbreviate: true,
        showNoMiss: false,
        includeSbPoints: false,
      });
      counterText = formatMrPSkill(mrP, { showTime: false });
    }
  }

  if (isSimple) {
    return counterText + (chance != null && chance !== 100 ? ' (' + chance + '%)' : '');
  }

  return formatGenericTrigger(
    (enemyOnly ? "foe's " : '') + arrayify(skillType).join('/') + ' atk',
    counterText,
    chance,
  );
}

function isDurationEffect(effect: statusTypes.EffectClause) {
  return (
    effect.type === 'turnDuration' ||
    effect.type === 'removedUnlessStatus' ||
    effect.type === 'removedAfterTrigger'
  );
}

function describeStatusEffect(
  effect: statusTypes.EffectClause,
  enlirStatus: EnlirStatus,
  source: EnlirSkill | undefined,
  options: StatusOptions,
): string | null {
  switch (effect.type) {
    case 'statMod':
      return (
        signedNumber(effect.value) +
        uncertain(effect.valueIsUncertain) +
        '% ' +
        describeStats(arrayify(effect.stats))
      );
    case 'critChance':
      return addTrigger(
        'crit =' + arrayify(effect.value).join('/') + uncertain(effect.valueIsUncertain) + '%',
        effect.trigger,
      );
    case 'critDamage':
      return signedNumber(effect.value) + uncertain(effect.valueIsUncertain) + '% crit dmg';
    case 'hitRate':
      return signedNumber(effect.value) + '% hit rate';
    case 'ko':
      return 'KO';
    case 'lastStand':
      return 'Last stand';
    case 'reraise':
      return 'Reraise ' + effect.value + '%';
    case 'statusChance':
      return (
        percentToMultiplier(effect.value) + uncertain(effect.valueIsUncertain) + 'x status chance'
      );
    case 'statusStacking':
      return (statusLevelAlias[effect.status] || effect.status) + ' stacking';
    case 'preventStatus':
      if (enlirStatus.name === 'Astra') {
        return 'Status blink 1';
      } else {
        return effect.status.join('/') + ' blink 1';
      }
    case 'speed':
      return effect.value === 2
        ? 'Haste'
        : effect.value === 0.5
        ? 'Slow'
        : effect.value + 'x speed';
    case 'instacast':
      return formatAnyCast(effect, 'insta');
    case 'castSpeedBuildup':
      return formatCastSpeedBuildup(effect);
    case 'castSpeed': {
      let cast: string = '';
      // Skip checking valueIsUncertain; it doesn't seem to actually be used
      // in current statuses.
      if (Array.isArray(effect.value) || options.forceNumbers) {
        cast =
          arrayify(effect.value)
            .map(i => i.toString())
            .join('/') + 'x ';
      } else {
        cast =
          effect.value === 2
            ? 'fast'
            : effect.value === 3
            ? 'hi fast'
            : effect.value.toString() + 'x ';
      }
      return addTrigger(formatAnyCast(effect, cast), effect.trigger);
    }
    case 'instantAtb':
      return 'instant ATB';
    case 'atbSpeed':
      return effect.value + 'x ATB';
    case 'physicalBlink':
      return 'Phys blink ' + effect.level;
    case 'magicBlink':
      return 'Magic blink ' + effect.level;
    case 'dualBlink':
      return 'PM blink ' + effect.level;
    case 'elementBlink':
      return getElementShortName(effect.element) + ' blink ' + effect.level;
    case 'stoneskin':
      return (
        'Negate dmg ' +
        effect.percentHp +
        '%' +
        (effect.element ? ' (' + getElementShortName(effect.element) + ' only)' : '')
      );
    case 'magiciteStoneskin':
      return (
        'Negate dmg ' +
        effect.percentHp +
        '% magicite HP (' +
        getElementShortName(effect.element) +
        ' only)'
      );
    case 'fixedStoneskin':
      return (
        'Negate dmg ' +
        toMrPKilo(effect.damage) +
        ' HP (' +
        arrayify(effect.skillType).join('/') +
        ' only)'
      );
    case 'damageBarrier':
      return effect.value + '% Dmg barrier ' + effect.attackCount;
    case 'radiantShield': {
      let result =
        'Reflect Dmg' +
        (options.forceNumbers || effect.value !== 100 ? ' ' + effect.value + '%' : '');
      if (effect.element) {
        result +=
          (effect.overflow ? ' as overstrike ' : ' as ') + getElementShortName(effect.element);
      } else if (effect.overflow) {
        result += ' overstrike';
      }
      return result;
    }
    case 'reflect':
      return 'Reflect';
    case 'awoken':
      return formatAwoken(effect);
    case 'switchDraw':
      return formatSwitchDraw(effect.elements);
    case 'switchDrawStacking':
      return formatSwitchDraw(effect.elements, true, effect.level);
    case 'elementAttack':
      return signedNumber(effect.value) + '% ' + getElementShortName(effect.element) + ' dmg';
    case 'elementResist':
      return (
        signedNumber(-effect.value) +
        uncertain(effect.valueIsUncertain) +
        '% ' +
        getElementShortName(effect.element) +
        ' vuln.'
      );
    case 'enElement':
      return getElementShortName(effect.element) + ' infuse';
    case 'enElementStacking':
      return getElementShortName(effect.element) + ' infuse stacking';
    case 'enElementWithStacking':
      return (
        getElementShortName(effect.element) +
        ' infuse ' +
        (effect.level !== 1 ? effect.level + ' ' : '') +
        'w/ stacking'
      );
    case 'loseEnElement':
      return (
        'lose ' +
        (effect.element ? getElementShortName(effect.element) + ' ' : '') +
        ' element infuse' +
        (effect.level !== 1 ? ' ' + effect.level : '')
      );
    case 'abilityBuildup':
      return formatAbilityBuildup(effect);
    case 'rankBoost':
      return rankBoostAlias(formatAnyType(effect));
    case 'damageUp':
      return addTrigger(
        arrayify(effect.value)
          .map(percentToMultiplier)
          .join('-') +
          'x ' +
          formatAnyType(effect, ' ') +
          'dmg' +
          (effect.vsWeak ? ' vs weak' : ''),
        effect.trigger,
      );
    case 'abilityDouble':
      return 'double' + formatElementOrSchoolList(effect, ' ') + ' (uses extra hone)';
    case 'dualcast':
      return effect.chance + '% dualcast' + formatElementOrSchoolList(effect, ' ');
    case 'dualcastAbility':
      return 'dualcast' + formatElementOrSchoolList(effect, ' ');
    case 'noAirTime':
      return 'no air time';
    case 'breakDamageCap':
      return 'break ' + formatAnyType(effect, ' ') + 'dmg cap';
    case 'damageCap':
      return 'dmg cap +' + toMrPKilo(effect.value);
    case 'hpStock':
      // Skip valueIsUncertain; HP stock values are always documented.
      return 'Autoheal ' + toMrPKilo(effect.value);
    case 'regen':
      // Show regen details.  The standard low/medium/high regen are aliased elsewhere.
      return `regen ${effect.percentHp}% HP per ${effect.interval.toFixed(2)}s`;
    case 'fixedHpRegen':
      return 'regen ' + toMrPKilo(effect.value) + ' HP per ' + effect.interval + 's';
    case 'poison':
      return (
        'lose ' +
        effect.fractionHp.numerator +
        '/' +
        effect.fractionHp.denominator +
        ' HP per ' +
        effect.interval +
        's'
      );
    case 'healUp':
      return signedNumber(effect.value) + '% healing';
    case 'pain':
      return signedNumber(effect.value) + '% dmg taken';
    case 'damageTaken':
      return percentToMultiplier(effect.value) + 'x dmg taken';
    case 'barHeal':
      return -effect.value + '% healing recv';
    case 'doom':
      return 'Doom ' + effect.timer + 's';
    case 'doomTimer':
      return effect.value + 's Doom';
    case 'drainHp':
      return 'heal ' + effect.value + '% of' + formatElementOrSchoolList(effect, ' ') + ' dmg';
    case 'counter':
      return formatCounter(effect, enlirStatus);
    case 'rowCover':
      return (
        `if in front, ${effect.chance}% cover ` +
        arrayify(effect.skillType).join() +
        ` vs back row, taking ${percentToMultiplier(-effect.damageReduce)}x dmg`
      );
    case 'triggeredEffect':
      return formatTriggeredEffect(effect, enlirStatus, source);
    case 'gainSb':
      return sbPointsAlias(effect.value);
    case 'sbGainUp':
      return sbPointsBoosterAlias(effect.value, formatElementOrSchoolList(effect));
    case 'taunt':
      return 'taunt ' + arrayify(effect.skillType).join('/');
    case 'runic':
      return 'taunt & absorb ' + arrayify(effect.skillType).join('/');
    case 'immuneAttacks':
      return 'immune ' + formatAnyType(effect, ' ') + 'atks';
    case 'zeroDamage':
      return '0 dmg';
    case 'evadeAll':
      return 'immune atks/status/heal';
    case 'multiplyDamage':
      return effect.value + uncertain(effect.valueIsUncertain) + 'x dmg recv';
    case 'berserk':
      return 'berserk';
    case 'rage':
      return source ? describeRageEffects(source) : null;
    case 'abilityBerserk':
      return 'Abil. berserk';
    case 'turnDuration':
      return formatDuration(effect.duration);
    case 'removedUnlessStatus':
      // Mode-specific statuses are detailed enough that we can omit them.
      if (!isModeLimitedEffect(effect)) {
        return 'until ' + (statusLevelAlias[effect.status] || effect.status) + ' lost';
      } else {
        return null;
      }
    case 'onceOnly':
      return 'once only'; // Handled at the trigger level
    case 'removedAfterTrigger':
      return getTriggerPreposition(effect.trigger) + ' ' + formatTrigger(effect.trigger);
    case 'changeStatusLevel':
      return addTrigger(
        (statusLevelAlias[effect.status] || effect.status) + ' ' + signedNumber(effect.value),
        effect.trigger,
      );
    case 'setStatusLevel':
      if (effect.value) {
        return (statusLevelAlias[effect.status] || effect.status) + ' =' + effect.value;
      } else {
        return 'reset ' + (statusLevelAlias[effect.status] || effect.status);
      }
    case 'statusLevelBooster':
      return `+${effect.value} to all ${statusLevelAlias[effect.status] || effect.status} gains`;
    case 'burstToggle':
      // Manually handled elsewhere. TODO: Consolidate duplicated logic.
      return null;
    case 'trackStatusLevel':
      return (
        (statusLevelAlias[effect.status] || effect.status) +
        (!isNaN(effect.current) ? ' ' + effect.current : '')
      );
    case 'trackUses':
    case 'burstOnly':
    case 'burstReset':
    case 'statusReset':
      // Internal details; omit from descriptions.
      return null;
    case 'disableAttacks':
      return "can't " + formatAnyType(effect, ' ') + 'atk';
    case 'paralyze':
      return "can't act";
  }
}

function describeEnlirStatusEffects(
  statusEffects: statusTypes.StatusEffect,
  enlirStatus: EnlirStatus,
  source: EnlirSkill | undefined,
  options: StatusOptions,
): string {
  return sortStatusEffects(statusEffects)
    .map(i => describeStatusEffect(i, enlirStatus, source, options))
    .filter(i => !!i)
    .join(', ');
}

/**
 * Sort statuses for nicer display.
 */
function sortStatusEffects(statusEffects: statusTypes.EffectClause[]): statusTypes.EffectClause[] {
  // For example, put Draw Fire's taunt effect before its stat mod, since a
  // stat mod that immediately follows an attack normally applies to the enemy.
  return _.sortBy(statusEffects, i => (i.type === 'taunt' ? 0 : 1));
}

export function describeEnlirStatusAndDuration(
  status: string,
  enlirStatus?: EnlirStatusWithPlaceholders,
  source?: EnlirSkill,
  options?: StatusOptions,
): [string, string | null, statusTypes.StatusEffect | null] {
  options = options || {};

  if (wellKnownStatuses.has(status)) {
    return [status, null, null];
  } else if (wellKnownAliases[status]) {
    return [wellKnownAliases[status], null, null];
  }
  if (!enlirStatus) {
    enlirStatus = getEnlirStatusWithPlaceholders(status);
  }
  if (!enlirStatus) {
    return [status, null, null];
  }

  const statusEffects = safeParseStatus(enlirStatus.status, enlirStatus.placeholders);
  if (!statusEffects) {
    return [status, null, null];
  }

  const [durationEffects, normalEffects] = _.partition(statusEffects, isDurationEffect);

  // If dealing with an effect from a stacking status, like Tifa's
  // Striker Mode's 2x / 4x / 6x cast, then prefer generic numbered effects,
  // on the assumption that higher-level code will want to slash-merge it.
  options.forceNumbers = options.forceNumbers || isStackingStatus(enlirStatus.status);

  let effects = describeEnlirStatusEffects(normalEffects, enlirStatus.status, source, options);
  let duration = durationEffects.length
    ? describeEnlirStatusEffects(durationEffects, enlirStatus.status, source, options || {})
    : null;

  // Hack: Simple turn-limited statuses are represented with a numeric suffix.
  let suffix = '';
  if (
    normalEffects.length === 1 &&
    normalEffects[0].type !== 'switchDraw' &&
    normalEffects[0].type !== 'switchDrawStacking' &&
    normalEffects[0].type !== 'triggeredEffect' &&
    durationEffects.length === 1 &&
    durationEffects[0].type === 'turnDuration' &&
    (durationEffects[0] as statusTypes.TurnDuration).duration.units === 'turns'
  ) {
    const { value, valueIsUncertain } = (durationEffects[0] as statusTypes.TurnDuration).duration;
    const turnCount = value;
    suffix = ' ' + turnCount;
    if (valueIsUncertain) {
      suffix += '?';
    }
    if (!shouldAbbreviateTurns(statusEffects[0])) {
      suffix += ' turn' + (turnCount === 1 ? '' : 's');
    }
    effects += suffix;
    duration = null;
  }

  return [effects, duration || null, statusEffects];
}

export function describeEnlirStatus(
  status: string,
  enlirStatus?: EnlirStatusWithPlaceholders,
  source?: EnlirSkill,
  options?: StatusOptions,
): string {
  return describeEnlirStatusAndDuration(status, enlirStatus, source, options)[0];
}

export interface ParsedEnlirStatus {
  description: string;
  isDetail: boolean;
  isExLike: boolean;
  isBurstToggle: boolean;
  isTrance: boolean;
  isModeLimited: boolean;
  defaultDuration: number | null;
  isVariableDuration: boolean;
  specialDuration?: string;
}

const slashOptionsRe = /(?:(?:\w|\.)+\/)+(?:\w|\.)+/;
function getSlashOptions(s: string): string[] | null {
  const m = s.match(slashOptionsRe);
  if (!m) {
    return null;
  }
  let options = m[0].split('/');
  // Make sure we consistently have a multiplier sign at the beginning or end.
  if (options[0].startsWith('x')) {
    options = options.map(i => i.replace(/^[^x]/, c => 'x' + c));
  }
  if (options[options.length - 1].endsWith('x')) {
    options = options.map(i => i.replace(/[^x]$/, c => c + 'x'));
  }
  return options;
}
function expandSlashOptions(s: string, options?: string[] | null): string[] {
  if (!options) {
    options = getSlashOptions(s);
    if (!options) {
      return [s];
    }
  }
  return options.map(i => s.replace(slashOptionsRe, i));
}

const describeAutoInterval = (autoInterval: number) => `every ${toMrPFixed(autoInterval)}s`;

function isFinisherOnly(effects: statusTypes.StatusEffect): boolean {
  // Hack: If the skill starts with 'Removed ', instead of having ', removed'
  // in the middle, then assume that it consists only of finisher effects.
  return (
    effects.length > 0 &&
    (effects[0].type === 'removedAfterTrigger' || effects[0].type === 'removedUnlessStatus')
  );
}

const hideUnknownStatusWarning = (status: string) => status.match(/^\d+ SB points$/);

/**
 * Parses a string description of an Enlir status name, returning details about
 * it and how it should be shown.
 */
export function parseEnlirStatus(
  status: string,
  source?: EnlirSkill,
  options?: StatusOptions,
): ParsedEnlirStatus {
  let isUnconfirmed = false;
  if (status !== '?') {
    isUnconfirmed = status.endsWith('?');
    status = status.replace(/\?$/, '');
  }

  const enlirStatusWithPlaceholders = getEnlirStatusWithPlaceholders(status);
  if (!enlirStatusWithPlaceholders && !hideUnknownStatusWarning(status)) {
    logger.warn(`Unknown status: ${status}`);
  }
  const enlirStatus = enlirStatusWithPlaceholders ? enlirStatusWithPlaceholders.status : undefined;
  // tslint:disable: prefer-const
  let [description, specialDuration, statusEffects] = describeEnlirStatusAndDuration(
    status,
    enlirStatusWithPlaceholders,
    source,
    options,
  );
  // tslint:enable: prefer-const

  const isEx = isExStatus(status);
  const isAwoken = isAwokenStatus(status);
  const isExLike =
    isEx ||
    isAwoken ||
    (statusEffects != null && isTriggerStatus(statusEffects)) ||
    (enlirStatus != null && isModeStatus(enlirStatus));

  const burstToggle = enlirStatus != null && isBurstToggle(enlirStatus);

  if (
    enlirStatus &&
    (isExLike || isCustomStatMod(enlirStatus) || forceEffects(enlirStatus) || burstToggle)
  ) {
    if (isEx) {
      description = 'EX: ' + description;
    }
    if (isAwoken) {
      description = status.replace(/ Mode$/, '') + ': ' + description;
    }
  }

  if (statusEffects && isFinisherOnly(statusEffects)) {
    // Hack: Munge the text to change 'until foo: Finisher: bar' to
    // 'when foo: bar'
    if (description.startsWith(finisherText)) {
      description = description.replace(finisherText, '');
    }
    if (specialDuration) {
      specialDuration = specialDuration.replace(/^until /, 'when ');
    }
  }

  if (isUnconfirmed) {
    description += '?';
  }

  return {
    description,
    isExLike,
    isDetail: isExLike || (enlirStatus != null && forceDetail(enlirStatus)),
    isBurstToggle: burstToggle,
    isTrance: enlirStatus != null && isTranceStatus(enlirStatus),
    isModeLimited: statusEffects != null && statusEffects.find(isModeLimitedEffect) != null,
    defaultDuration: enlirStatus && !hideDuration.has(status) ? enlirStatus.defaultDuration : null,
    isVariableDuration: !!enlirStatus && !!enlirStatus.mndModifier,
    specialDuration: specialDuration || undefined,
  };
}

interface ParsedEnlirStatusWithSlashes extends ParsedEnlirStatus {
  optionCount?: number;
}

export function parseEnlirStatusWithSlashes(
  status: string,
  source?: EnlirSkill,
): ParsedEnlirStatusWithSlashes {
  function makeResult(options: ParsedEnlirStatus[], join?: string) {
    return {
      // Assume that most parameters are the same across options.
      ...options[0],

      description: slashMerge(options.map(i => i.description), { join }),

      optionCount: options.length,
    };
  }

  let m: RegExpMatchArray | null;
  const enlirStatus = getEnlirStatusByName(status);
  if (
    !enlirStatus &&
    (m = status.match(/^((?:[A-Z]{3}\/)*[A-Z]{3}) or ((?:[A-Z]{3}\/)*[A-Z]{3}) (\+\d+%)$/))
  ) {
    // Handle hybrid ("or") stat buffs.
    const [, stat1, stat2, amount] = m;
    const makeStat = (stat: string) => andJoin(stat.split('/'), false) + ' ' + amount;
    const options = [parseEnlirStatus(makeStat(stat1)), parseEnlirStatus(makeStat(stat2))];
    return makeResult(options, ' or ');
  } else if (!enlirStatus && status.match(' or ')) {
    // Handle hybrid ("or") statuses.
    const options = status.split(orList).map(i => parseEnlirStatus(i, source));
    return makeResult(options, ' or ');
  } else if (!enlirStatus && status.match('/')) {
    // Handle slash-separated options.
    const statusOptions = expandSlashOptions(status);
    const options = [false, true].map(forceNumbers =>
      statusOptions.map(i => parseEnlirStatus(i, source, { forceNumbers })),
    );
    const descriptions = options.map(opt => slashMergeWithDetails(opt.map(i => i.description)));

    // If forcing numbers gives us a better merge than not forcing numbers,
    // then use that.
    const pickedForceNumbers = descriptions[+true].different < descriptions[+false].different;

    return makeResult(options[+pickedForceNumbers]);
  } else {
    return parseEnlirStatus(status, source);
  }
}

export function formatDuration({ value, valueIsUncertain, units }: common.Duration) {
  const formattedValue = numberOrUnknown(value) + (valueIsUncertain ? '?' : '');
  if (units === 'seconds') {
    return formattedValue + 's';
  } else {
    return formattedValue + (value === 1 ? ' turn' : ' turns');
  }
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

const getSortOrder = (status: skillTypes.StatusWithPercent['status']) => {
  if (typeof status !== 'string') {
    return 0;
  } else if (isExStatus(status) || isAwokenStatus(status)) {
    return 999;
  } else {
    return statusSortOrder[status] || 0;
  }
};

export function sortStatus(
  a: skillTypes.StatusWithPercent,
  b: skillTypes.StatusWithPercent,
): number {
  return getSortOrder(a.status) - getSortOrder(b.status);
}

function reduceStatuses(
  combiner: (a: skillTypes.StatusWithPercent, b: skillTypes.StatusWithPercent) => string | null,
  accumulator: skillTypes.StatusWithPercent[],
  currentValue: skillTypes.StatusWithPercent,
) {
  if (accumulator.length) {
    const combined = combiner(accumulator[accumulator.length - 1], currentValue);
    if (combined) {
      accumulator[accumulator.length - 1].status = combined;
      return accumulator;
    }
  }

  accumulator.push(currentValue);
  return accumulator;
}

/**
 * Reducer function for handling statuses like "Beast and Father."  If a status
 * like that is split into two items, this function handles recognizing it as
 * one status and re-merging it.
 */
export function checkForAndStatuses(
  accumulator: skillTypes.StatusWithPercent[],
  currentValue: skillTypes.StatusWithPercent,
) {
  return reduceStatuses(
    (a: skillTypes.StatusWithPercent, b: skillTypes.StatusWithPercent) => {
      if (typeof a.status !== 'string' || typeof b.status !== 'string') {
        return null;
      }
      const thisAndThat = a.status + ' and ' + b.status;
      return enlir.statusByName[thisAndThat] ? thisAndThat : null;
    },
    accumulator,
    currentValue,
  );
}

const elementStatuses = [
  new RegExp('^Minor Buff ([a-zA-Z/]+)$'),
  new RegExp('^Medium Buff ([a-zA-Z/]+)$'),
  new RegExp('^Major Buff ([a-zA-Z/]+)$'),
  new RegExp('^Imperil ([a-zA-Z/]+) 10%$'),
  new RegExp('^Imperil ([a-zA-Z/]+) 20%$'),
];

export function slashMergeElementStatuses(
  accumulator: skillTypes.StatusWithPercent[],
  currentValue: skillTypes.StatusWithPercent,
) {
  return reduceStatuses(
    (a: skillTypes.StatusWithPercent, b: skillTypes.StatusWithPercent) => {
      for (const i of elementStatuses) {
        if (typeof a.status === 'string' && typeof b.status === 'string') {
          const ma = a.status.match(i);
          const mb = b.status.match(i);
          if (ma && mb) {
            return ma && mb ? a.status.replace(ma[1], ma[1] + '/' + mb[1]) : null;
          }
        }
      }
      return null;
    },
    accumulator,
    currentValue,
  );
}

/**
 * Special case for shareStatusDuration - Reks' USB's Lightning Radiant Shield
 * shouldn't be shared.  We try to generalize this by saying that some statuses
 * never get non-default durations.
 */
function forceOwnDuration(status: EnlirStatus) {
  return status.name.match(/Radiant Shield/);
}

export function shareStatusDurations(
  accumulator: skillTypes.StatusWithPercent[],
  currentItem: skillTypes.StatusWithPercent,
) {
  if (accumulator.length) {
    const prevItem = accumulator[accumulator.length - 1];
    if (typeof prevItem.status === 'string' && typeof currentItem.status === 'string') {
      const prevStatus = getEnlirStatusByName(prevItem.status);
      const thisStatus = getEnlirStatusByName(currentItem.status);
      // If the previous status can have a duration (as implied by the
      // defaultDuration field) and doesn't have an explicit duration, and the
      // current status has an explicit duration, then assume that the current
      // status's duration also applies to the previous.  E.g.:
      //
      // - "causes Imperil Fire 10% and DEF -50% for 15 seconds"
      // - "Causes Imperil Wind 10% and Imperil Fire 10% for 15 seconds"
      //
      // As an exception, if both have an explicit target, then that's intended
      // to separate the two statues.  E.g.:
      //
      // - "grants Unyielding Fist to the user, ATK +50% to the user for 25
      //   seconds"
      //
      // And we still need a special case for Reks' SB.  Sigh.
      if (
        prevStatus &&
        thisStatus &&
        !prevItem.duration &&
        currentItem.duration &&
        prevStatus.defaultDuration &&
        !prevItem.who &&
        !forceOwnDuration(prevStatus)
      ) {
        accumulator[accumulator.length - 1] = {
          ...prevItem,
          duration: currentItem.duration,
        };
      }
    }
  }

  accumulator.push(currentItem);
  return accumulator;
}

export function shareStatusWho(
  accumulator: skillTypes.StatusWithPercent[],
  currentItem: skillTypes.StatusWithPercent,
) {
  if (currentItem.who && currentItem.whoAllowsLookahead) {
    for (let i = accumulator.length - 1; i >= 0; i--) {
      if (accumulator[i].who) {
        break;
      }
      accumulator[i] = {
        ...accumulator[i],
        who: currentItem.who,
      };
    }
  }

  accumulator.push(currentItem);
  return accumulator;
}
