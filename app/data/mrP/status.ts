import * as _ from 'lodash';

import { logException, logger } from '../../utils/logger';
import { arrayify, getAllSameValue, scalarify } from '../../utils/typeUtils';
import {
  enlir,
  EnlirElement,
  enlirPrismElementCount,
  EnlirSchool,
  EnlirSkill,
  EnlirSkillType,
  EnlirStat,
  EnlirStatus,
  EnlirStatusPlaceholders,
  EnlirStatusWithPlaceholders,
  getEnlirOtherSkill,
  getEnlirStatusByName,
  getEnlirStatusWithPlaceholders,
  isSoulBreak,
  isSynchroSoulBreak,
} from '../enlir';
import { describeDamage, describeDamageType } from './attack';
import * as common from './commonTypes';
import { describeCondition, formatThreshold } from './condition';
import { describeRageEffects } from './rage';
import { convertEnlirSkillToMrP, describeRecoilHp, formatMrPSkill } from './skill';
import {
  displayStatusLevel,
  formatDispelOrEsuna,
  formatSmartEther,
  formatSpecialStatusItem,
  lowHpAlias,
  rankBoostAlias,
  rankCastSpeedAlias,
  sbPointsAlias,
  sbPointsBoosterAlias,
  statusLevelAlias,
  statusLevelText,
  vsWeak,
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
  andList,
  formatUseCount,
  handleOrOptions,
  isSequential,
  numberOrUnknown,
  numberSlashList,
  percentToMultiplier,
  signedNumber,
  signedNumberSlashList,
  slashMerge,
  stringSlashList,
  toMrPFixed,
  toMrPKilo,
  tupleVerb,
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

const getCastString = (value: number) =>
  value === 2 ? 'fast' : value === 3 ? 'hi fast' : value.toString() + 'x ';

const memoizedProcessor = (status: EnlirStatus) =>
  preprocessStatus(statusParser.parse(status.effects), status);

const failedStatusIds = new Set<number>();

function preprocessStatus(
  status: statusTypes.StatusEffect,
  source: EnlirStatus,
): statusTypes.StatusEffect {
  // To avoid complexities of mutating a list as we're iterating, we only check
  // for one directGrantStatus.
  const grantIndex = status.findIndex(i => i.type === 'directGrantStatus');
  if (grantIndex !== -1) {
    const grant = status[grantIndex] as statusTypes.DirectGrantStatus;
    grant.status = resolveStatuses(arrayify(grant.status), source);
    if (
      _.every(grant.status, i => i.status.type === 'standardStatus' && i.status.effects != null)
    ) {
      status.splice(
        grantIndex,
        1,
        ..._.flatten(grant.status.map(i => (i.status as common.StandardStatus).effects!)),
      );
    }
  }

  for (const i of status) {
    if (i.type === 'triggeredEffect') {
      for (const j of arrayify(i.effects)) {
        if (j.type === 'grantStatus') {
          j.status = scalarify(mergeSimilarStatuses(resolveStatuses(arrayify(j.status), source)));
        }
      }
    } else if (i.type === 'conditionalStatus') {
      i.status = scalarify(mergeSimilarStatuses(resolveStatuses(arrayify(i.status), source)));
    }
  }
  return status;
}

export function safeParseStatus(status: EnlirStatus): statusTypes.StatusEffect | null {
  try {
    return memoizedProcessor(status);
  } catch (e) {
    if (!failedStatusIds.has(status.id)) {
      logger.error(`Failed to parse ${status.name}:`);
      logException(e);
      failedStatusIds.add(status.id);
    }
    if (e.name === 'SyntaxError') {
      return null;
    }
    throw e;
  }
}

export function getDuration(
  statuses: common.StatusWithPercent | common.StatusWithPercent[],
): common.Duration | undefined {
  if (!Array.isArray(statuses)) {
    return statuses.duration;
  } else {
    return statuses[statuses.length - 1].duration;
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
  return (
    _.find(exclusiveStatus, `All other "${baseName}" status`) != null ||
    _.find(exclusiveStatus, i => i.match(new RegExp('^' + baseName + ' \\d+'))) != null
  );
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
                granted.status.type === 'standardStatus' &&
                (granted.status.name === thisStatusName ||
                  granted.status.name === baseStatusName + ' ' + (n + 1)),
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
    describeEnlirStatusEffects(effects, status, undefined, undefined, {
      forceNumbers: true,
    }).replace(/(\d)([x%])([ ,]|$)/g, '$1 $2$3'),
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
    name === 'Haurchefant Cover'
  );
}

function isBurstToggle({ effects }: EnlirStatus) {
  return effects.match(/affects certain burst commands/i) != null;
}

export const allTranceStatus = new Set(
  _.values(enlir.legendMateria)
    // Exclude LMRs - those may grant generic statuses as trance.
    .filter(i => i.relic == null)
    // Exclude generic statuses, like Haurchefant and Jack.  Invoking the full
    // status-parsing code is too ugly; we'll just hard-code a list for now.
    .filter(i => i.character !== 'Jack' && i.character !== 'Haurchefant')
    .map(i => i.effect.match(/.*[Gg]rants (.*) when HP fall below/))
    .filter(i => i != null && !i[1].match(/to all allies/))
    .map(i => i![1].split(andList))
    // Take the last status - in practice, that's the one that's the character-
    // specific trance.
    .map(i => i[i.length - 1])
    // Strip brackets and durations.
    .map(i =>
      i
        .replace(/^\[/, '')
        .replace(/]$/, '')
        .replace(/ \(\d+s\)$/, ''),
    ),
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

type AnyTypeOrPlaceholder = Omit<AnyType, 'school'> & {
  school?: common.ValueOrPlaceholder<AnyType['school']>;
};

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
    // Should we include multicastAbility here?  By analogy with castSpeed
    // and instacast, yes.  To parallel damageUp (which it's paried with in
    // some synchro commands), no.
    // effect.type === 'multicastAbility'
  );
}

function formatAwoken({
  awoken,
  dualcast,
  instacast,
  rankBoost,
  rankCast,
  castSpeed,
}: statusTypes.Awoken): string {
  const type = formatSchoolOrAbilityList('school' in awoken ? awoken.school : awoken.element);
  let result = `${type} inf. hones`;
  // TODO: Remove redundant `${type}` below?
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
  if (castSpeed) {
    result += `, ${type} ${getCastString(castSpeed)}cast`;
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
  } else if (trigger.type === 'lowHp') {
    return 'once';
  } else {
    return 'for';
  }
}

function getTriggerSkillAlias(skill: string, source: EnlirSkill | undefined): string {
  if (source && isSoulBreak(source) && isSynchroSoulBreak(source) && source.character) {
    if (
      enlir.synchroCommandsByCharacter[source.character] &&
      enlir.synchroCommandsByCharacter[source.character][source.name]
    ) {
      const index = _.findIndex(
        enlir.synchroCommandsByCharacter[source.character][source.name],
        i => i.name.startsWith(skill),
      );
      if (index !== -1) {
        return `cmd ` + (index + 1);
      }
    }
  }
  return skill;
}

export function formatTrigger(trigger: statusTypes.Trigger, source?: EnlirSkill): string {
  switch (trigger.type) {
    case 'ability':
    case 'allyAbility':
      const count = formatTriggerCount(trigger.count);
      let result: string = trigger.type === 'allyAbility' ? 'ally ' : '';
      if (!trigger.element && !trigger.school && !trigger.jump) {
        if (trigger.requiresAttack) {
          result += !count ? 'any attack' : count + ' attacks';
        } else {
          result += !count ? 'any ability' : count + ' abilities';
        }
      } else {
        result += count + formatAnyType(trigger);
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
      return (
        (trigger.count ? trigger.count + ' ' : '') +
        arrayify(trigger.skill)
          .map(i => getTriggerSkillAlias(i, source))
          .join('/')
      );
    case 'skillTriggered':
      return (
        trigger.count +
        ' ' +
        (trigger.isSelfSkill ? 'times' : getTriggerSkillAlias(trigger.skill, source))
      );
    case 'damagedByAlly':
      return `take ${formatAnyType(trigger, ' ')}dmg from ally`;
    case 'singleHeal':
      return 'ally heal';
    case 'lowHp':
      return lowHpAlias(trigger.value);
    case 'damageDuringStatus':
      // Hack: Conditions (which formatThreshold expects) have prepositions, but
      // triggers don't.
      return formatThreshold(trigger.value, 'dmg dealt').replace(/^@ /, '');
  }
}

function addTrigger(
  effect: string,
  trigger: statusTypes.Trigger | undefined,
  source?: EnlirSkill,
): string {
  if (!trigger) {
    return effect;
  } else {
    return formatGenericTrigger(formatTrigger(trigger, source), effect);
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
      const simple = skill.split('/');
      const expanded = expandSlashOptions(skill);
      const simpleCount = _.sumBy(simple, i =>
        getEnlirOtherSkill(i, enlirStatus.name) == null ? 0 : 1,
      );
      const expandedCount = _.sumBy(expanded, i =>
        getEnlirOtherSkill(i, enlirStatus.name) == null ? 0 : 1,
      );
      options = simpleCount > expandedCount ? simple : expanded;
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

function formatOneGrantOrConditionalStatus(
  verb: common.StatusVerb,
  item: common.StatusWithPercent,
  trigger: statusTypes.Trigger | null,
  enlirStatus: EnlirStatus,
  source: EnlirSkill | undefined,
) {
  if (item.status.type === 'standardStatus' && item.status.name === enlirStatus.name) {
    return 'status';
  }

  if (item.status.type !== 'standardStatus') {
    return formatSpecialStatusItem(item.status);
  }

  const sequence = trigger ? getFollowUpStatusSequence(item.status.name, trigger) : null;
  if (sequence) {
    return describeMergedSequence(sequence);
  }

  const parsed = parseEnlirStatusItem(item.status, source);
  let thisResult = parsed.description;

  // Hack: Partial duplication of logic on when to append durations.
  // This is valuable to make Galuf AASB's instacast clear.
  if (
    verb !== 'removes' &&
    !item.duration &&
    parsed.defaultDuration &&
    !parsed.isVariableDuration &&
    !parsed.specialDuration &&
    !parsed.isModeLimited
  ) {
    thisResult += ' ' + formatDuration({ value: parsed.defaultDuration, units: 'seconds' });
  }

  if (item.chance) {
    thisResult += ` (${item.chance}%)`;
  }
  if (item.duration) {
    thisResult += ' ' + formatDuration(item.duration);
  }
  return thisResult;
}

function formatGrantOrConditionalStatus(
  {
    verb,
    status,
    who,
    toCharacter,
    condition,
  }: statusTypes.GrantStatus | statusTypes.ConditionalStatus,
  trigger: statusTypes.Trigger | null,
  enlirStatus: EnlirStatus,
  source: EnlirSkill | undefined,
): string {
  let result = '';
  result += verb === 'removes' ? 'remove ' : '';

  if (toCharacter) {
    result += (who ? whoText[who] + '/' : '') + stringSlashList(toCharacter) + ' ';
  } else if (who && who !== 'self' && who !== 'target') {
    result += whoText[who] + ' ';
  } else if (who === 'target' && trigger && trigger.type === 'singleHeal') {
    result += whoText['ally'] + ' ';
  } else if (!who && arrayify(status).find(i => i.chance != null)) {
    // Hack: The convention is to show chance for negative statuses.  A
    // negative self status is unusual, so force showing who in that case.
    // This is used for Eight's trance (Back to the Wall Mode).
    result += whoText['self'] + ' ';
  }

  status = arrayify(status);
  if (!isComplexStatusList(status)) {
    result += status
      .map(i => formatOneGrantOrConditionalStatus(verb, i, trigger, enlirStatus, source))
      .join(', ');
  } else {
    const statusLength = status.length;
    result += status
      .map((item, i) =>
        appendComplexStatusDescription(
          item,
          formatOneGrantOrConditionalStatus(verb, item, trigger, enlirStatus, source),
          i,
          statusLength,
        ),
      )
      .join('');
  }

  if (condition) {
    result += ' ' + describeCondition(condition);
  }

  return result.trim();
}

function getPrereqStatus(condition: common.Condition | undefined): string | undefined {
  return condition && condition.type === 'status' && typeof condition.status === 'string'
    ? condition.status
    : undefined;
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
      return formatGrantOrConditionalStatus(effect, trigger, enlirStatus, source);
    case 'heal':
      return (
        (effect.who ? whoText[effect.who] + ' ' : '') + 'heal ' + toMrPKilo(effect.fixedHp) + ' HP'
      );
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
    case 'dispelOrEsuna':
      return (effect.who ? whoText[effect.who] + ' ' : '') + formatDispelOrEsuna(effect);
  }
}

function formatSwitchDraw(
  elements: EnlirElement[],
  isStacking?: boolean,
  stackingLevel?: number,
): string {
  return formatGenericTrigger(
    elements.map(i => getElementShortName(i)).join('/'),
    elements.map(i => getElementShortName(i)).join('/') +
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
    const onceOnly = effect.onceOnly === true ? ' (once only)' : '';
    const nextN = effect.onceOnly && effect.onceOnly !== true ? `next ${effect.onceOnly} ` : '';
    return (
      '(' +
      nextN +
      formatTrigger(effect.trigger, source) +
      ' ⤇ ' +
      effects +
      condition +
      onceOnly +
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

function makePlaceholderResolvers(placeholders: EnlirStatusPlaceholders | undefined) {
  return {
    isUncertain: placeholders && placeholders.xValueIsUncertain,
    x: <T extends number | number[]>(value: T | common.SignedPlaceholder) =>
      value === 'X' || value === '-X'
        ? placeholders && placeholders.xValue != null
          ? placeholders.xValue * (value === common.negativePlaceholder ? -1 : 1)
          : NaN
        : value,
    stat: <T extends EnlirStat | EnlirStat[]>(value: T | common.Placeholder) =>
      value === common.placeholder
        ? placeholders && placeholders.stat
          ? placeholders.stat
          : 'atk'
        : value,
    element: <T extends EnlirElement | EnlirElement[]>(value: T | common.Placeholder) =>
      value === common.placeholder
        ? placeholders && placeholders.element
          ? placeholders.element
          : 'NE'
        : value,
    anyType: <T extends AnyType>(value: AnyTypeOrPlaceholder) => ({
      ...value,
      school:
        value.school === common.placeholder
          ? placeholders && placeholders.school
            ? placeholders.school
            : '?'
          : value.school,
    }),
  };
}

const getEnElementName = (element: EnlirElement | EnlirElement[]) =>
  Array.isArray(element) && element.length === enlirPrismElementCount
    ? 'element' // Conditional Attach Element and similar statuses.  See also statusLevelAlias
    : getElementShortName(element, '/');

function describeStatusEffect(
  effect: statusTypes.EffectClause,
  enlirStatus: EnlirStatus,
  placeholders: EnlirStatusPlaceholders | undefined,
  source: EnlirSkill | undefined,
  options: StatusOptions,
): string | null {
  const resolve = makePlaceholderResolvers(placeholders);

  switch (effect.type) {
    case 'statMod':
      return (
        signedNumberSlashList(resolve.x(effect.value)) +
        uncertain(resolve.isUncertain) +
        '% ' +
        describeStats(arrayify(resolve.stat(effect.stats))) +
        (effect.hybridStats ? ' or ' + describeStats(arrayify(effect.hybridStats)) : '')
      );
    case 'critChance':
      return addTrigger(
        'crit =' +
          arrayify(resolve.x(effect.value)).join('/') +
          uncertain(resolve.isUncertain) +
          '%',
        effect.trigger,
        source,
      );
    case 'critDamage':
      return signedNumber(resolve.x(effect.value)) + uncertain(resolve.isUncertain) + '% crit dmg';
    case 'hitRate':
      return signedNumber(effect.value) + '% hit rate';
    case 'ko':
      return 'KO';
    case 'lastStand':
      return 'Last stand';
    case 'raise':
      return 'Raise ' + effect.value + '%';
    case 'reraise':
      return 'Reraise ' + effect.value + '%';
    case 'statusChance':
      return (
        percentToMultiplier(resolve.x(effect.value)) +
        uncertain(resolve.isUncertain) +
        'x status chance'
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
      return formatAnyCast(resolve.anyType(effect), 'insta');
    case 'castSpeedBuildup':
      return formatCastSpeedBuildup(effect);
    case 'castSpeed': {
      let cast: string = '';
      // Skip checking valueIsUncertain; it doesn't seem to actually be used
      // in current statuses.
      if (Array.isArray(effect.value) || options.forceNumbers) {
        cast =
          arrayify(resolve.x(effect.value))
            .map(i => i.toString())
            .join('/') + 'x ';
      } else {
        cast = getCastString(resolve.x(effect.value));
      }
      return addTrigger(formatAnyCast(resolve.anyType(effect), cast), effect.trigger, source);
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
        numberSlashList(effect.value) +
        '%' +
        (effect.element ? ' (' + getElementShortName(effect.element) + ' only)' : '')
      );
    case 'magiciteStoneskin':
      return (
        'Negate dmg ' +
        effect.value +
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
      return numberSlashList(effect.value) + '% Dmg barrier ' + effect.attackCount;
    case 'radiantShield': {
      let result =
        'Reflect Dmg' +
        (options.forceNumbers || effect.value !== 100
          ? ' ' + numberSlashList(effect.value) + '%'
          : '');
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
      return signedNumber(effect.value) + '% ' + getElementShortName(effect.element, '/') + ' dmg';
    case 'elementResist':
      return (
        signedNumber(-resolve.x(effect.value)) +
        uncertain(resolve.isUncertain) +
        '% ' +
        getElementShortName(resolve.element(effect.element), '/') +
        ' vuln.'
      );
    case 'enElement':
      return getEnElementName(effect.element) + ' infuse';
    case 'enElementStacking':
      return getEnElementName(effect.element) + ' infuse stacking';
    case 'enElementWithStacking':
      return (
        getEnElementName(effect.element) +
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
      return (
        addTrigger(
          arrayify(effect.value)
            .map(percentToMultiplier)
            .join('-') +
            'x ' +
            formatAnyType(effect, ' ') +
            'dmg' +
            (effect.vsWeak ? ' vs weak' : ''),
          effect.trigger,
          source,
        ) + (effect.condition ? ' ' + describeCondition(effect.condition) : '')
      );
    case 'abilityDouble':
      return 'double' + formatElementOrSchoolList(effect, ' ') + ' (uses extra hone)';
    case 'multicast':
      const chance = effect.chance === 100 ? '' : effect.chance + '% ';
      return chance + tupleVerb(effect.count, 'cast') + formatElementOrSchoolList(effect, ' ');
    case 'multicastAbility':
      return tupleVerb(effect.count, 'cast') + formatElementOrSchoolList(effect, ' ');
    case 'noAirTime':
      return 'no air time';
    case 'breakDamageCap':
      return 'break ' + formatAnyType(effect, ' ') + 'dmg cap';
    case 'damageCap':
      return 'dmg cap +' + toMrPKilo(effect.value);
    case 'hpStock':
      // Skip valueIsUncertain; HP stock values are always documented.
      return 'Autoheal ' + numberSlashList(resolve.x(effect.value), toMrPKilo);
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
      return (
        signedNumber(effect.value) +
        '% ' +
        (effect.skillType ? effect.skillType + ' ' : '') +
        (effect.school ? formatSchoolOrAbilityList(effect.school) + ' ' : '') +
        'healing'
      );
    case 'pain':
      return signedNumber(effect.value) + '% dmg taken';
    case 'damageTaken':
      return percentToMultiplier(effect.value) + 'x dmg taken';
    case 'barHeal':
      return -effect.value + '% healing recv';
    case 'empowerHeal':
      return signedNumber(effect.value) + '% healing recv';
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
    case 'conditionalStatus':
      return formatGrantOrConditionalStatus(effect, null, enlirStatus, source);
    case 'directGrantStatus':
      // In practice, these should be resolved during preprocessStatus, so this
      // code path should not be hit.
      return arrayify(effect.status)
        .map(i =>
          i.status.type === 'standardStatus' ? i.status.name : formatSpecialStatusItem(i.status),
        )
        .join(', ');
    case 'gainSb':
      return sbPointsAlias(effect.value);
    case 'sbGainUp':
      return sbPointsBoosterAlias(
        effect.value,
        effect.vsWeak ? vsWeak : formatElementOrSchoolList(effect),
      );
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
      return effect.value + uncertain(resolve.isUncertain) + 'x dmg recv';
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
    case 'removedAfterTrigger':
      return getTriggerPreposition(effect.trigger) + ' ' + formatTrigger(effect.trigger, source);
    case 'changeStatusLevel':
      return addTrigger(
        displayStatusLevel(effect.status) + ' ' + signedNumber(effect.value),
        effect.trigger,
        source,
      );
    case 'setStatusLevel': {
      let result: string;
      if (effect.value) {
        result = displayStatusLevel(effect.status) + ' =' + effect.value;
      } else {
        result = 'reset ' + displayStatusLevel(effect.status);
      }
      return addTrigger(result, effect.trigger, source);
    }
    case 'statusLevelBooster':
      return `+${effect.value} to all ${displayStatusLevel(effect.status)} gains`;
    case 'burstToggle':
      // Manually handled elsewhere. TODO: Consolidate duplicated logic.
      return null;
    case 'trackStatusLevel': {
      if (effect.current == null) {
        // A purely internal status level; nothing to report.
        return '';
      }
      const current = resolve.x(effect.current);
      return (
        (statusLevelAlias[effect.status] || effect.status) + (!isNaN(current) ? ' ' + current : '')
      );
    }
    case 'modifiesSkill':
      // Most of what we call "status levels" appear to be tracking SASB-only
      // command counts or levels.  As of January 2020, the only modifiesSkill
      // status operates similarly, so treat it as such.
      return statusLevelText;
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
    case 'stun':
      return 'stun';
  }
}

function describeEnlirStatusEffects(
  statusEffects: statusTypes.StatusEffect,
  enlirStatus: EnlirStatus,
  placeholders: EnlirStatusPlaceholders | undefined,
  source: EnlirSkill | undefined,
  options: StatusOptions,
): string {
  return sortStatusEffects(statusEffects)
    .map(i => describeStatusEffect(i, enlirStatus, placeholders, source, options))
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
  preprocessedEffects?: statusTypes.StatusEffect | null,
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

  const statusEffects = preprocessedEffects || safeParseStatus(enlirStatus.status);
  if (!statusEffects) {
    return [status, null, null];
  }

  const [durationEffects, normalEffects] = _.partition(statusEffects, isDurationEffect);

  // If dealing with an effect from a stacking status, like Tifa's
  // Striker Mode's 2x / 4x / 6x cast, then prefer generic numbered effects,
  // on the assumption that higher-level code will want to slash-merge it.
  options.forceNumbers = options.forceNumbers || isStackingStatus(enlirStatus.status);

  let effects = describeEnlirStatusEffects(
    normalEffects,
    enlirStatus.status,
    enlirStatus.placeholders,
    source,
    options,
  );
  let duration = durationEffects.length
    ? describeEnlirStatusEffects(
        durationEffects,
        enlirStatus.status,
        enlirStatus.placeholders,
        source,
        options || {},
      )
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
  return describeEnlirStatusAndDuration(status, enlirStatus, undefined, source, options)[0];
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
  // Is this a generic status level for a SASB?
  statusLevel?: number;
  // The number of possible options for this status (for, e.g., scaleWithUses)
  optionCount?: number;
}

const slashOptionsRe = /(?:[+-]?(?:\w|\.)+%?\/)+[+-]?(?:\w|\.)+%?/;
function getSlashOptions(s: string): string[] | null {
  const m = s.match(slashOptionsRe);
  if (!m) {
    return null;
  }
  let options = m[0].split('/');
  // Make sure we consistently have signs (if appropriate) at the beginning or
  // end.
  if (options[0].startsWith('x')) {
    options = options.map(i => i.replace(/^[^x]/, c => 'x' + c));
  }
  if (options[0].startsWith('+')) {
    options = options.map(i => i.replace(/^[^+-]/, c => '+' + c));
  }
  if (options[0].startsWith('-')) {
    options = options.map(i => i.replace(/^[^+-]/, c => '-' + c));
  }
  if (options[options.length - 1].endsWith('x')) {
    options = options.map(i => i.replace(/[^x]$/, c => c + 'x'));
  }
  if (options[options.length - 1].endsWith('%')) {
    options = options.map(i => i.replace(/[^%]$/, c => c + '%'));
  }
  return options;
}
export function expandSlashOptions(s: string, options?: string[] | null): string[] {
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

/**
 * Parses a string description of an Enlir status item, returning details about
 * it and how it should be shown.
 */
export function parseEnlirStatusItem(
  status: common.StandardStatus,
  source?: EnlirSkill,
): ParsedEnlirStatus {
  let statusLevel: number | undefined;
  const enlirStatus = status.id == null ? undefined : enlir.status[status.id];
  // tslint:disable: prefer-const
  let [description, specialDuration, statusEffects] = describeEnlirStatusAndDuration(
    status.name,
    enlirStatus && { status: enlirStatus, placeholders: status.placeholders },
    status.effects,
    source,
  );
  // tslint:enable: prefer-const

  const isEx = isExStatus(status.name);
  const isAwoken = isAwokenStatus(status.name);
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
      description = status.name.replace(/ Mode$/, '') + ': ' + description;
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
  if (statusEffects && statusEffects.find(i => i.type === 'modifiesSkill')) {
    statusLevel = 1;
  }

  if (status.isUncertain) {
    description += '?';
  }

  return {
    description,
    isExLike,
    isDetail: isExLike || (enlirStatus != null && forceDetail(enlirStatus)),
    isBurstToggle: burstToggle,
    isTrance: enlirStatus != null && isTranceStatus(enlirStatus),
    isModeLimited: statusEffects != null && statusEffects.find(isModeLimitedEffect) != null,
    defaultDuration:
      enlirStatus && !hideDuration.has(status.name) ? enlirStatus.defaultDuration : null,
    isVariableDuration: !!enlirStatus && !!enlirStatus.mndModifier,
    specialDuration: specialDuration || undefined,
    statusLevel,
    optionCount: status.mergeCount,
  };
}

/**
 * Parses a string description of an Enlir status name, returning details about
 * it and how it should be shown.
 */
export function parseEnlirStatus(status: string, source?: EnlirSkill): ParsedEnlirStatus {
  const isUncertain = status !== '?' && status.endsWith('?');

  const enlirStatusWithPlaceholders = getEnlirStatusWithPlaceholders(status.replace(/\?$/, ''));
  if (!enlirStatusWithPlaceholders) {
    logger.warn(`Unknown status: ${status}`);
  }
  const enlirStatus = enlirStatusWithPlaceholders ? enlirStatusWithPlaceholders.status : undefined;

  return parseEnlirStatusItem(
    {
      type: 'standardStatus',
      name: status,
      id: enlirStatus && enlirStatus.id,
      placeholders: enlirStatusWithPlaceholders && enlirStatusWithPlaceholders.placeholders,
      isUncertain,
    },
    source,
  );
}

export interface ParsedEnlirStatusWithSlashes extends ParsedEnlirStatus {
  optionCount?: number;
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

const getSortOrder = (status: common.StatusItem) => {
  if (status.type !== 'standardStatus') {
    return 0;
  } else if (isExStatus(status.name) || isAwokenStatus(status.name)) {
    return 999;
  } else {
    return statusSortOrder[status.name] || 0;
  }
};

export function sortStatus(a: common.StatusWithPercent, b: common.StatusWithPercent): number {
  return getSortOrder(a.status) - getSortOrder(b.status);
}

/**
 * Given a set of status items, annotate them with Enlir status IDs and
 * placeholder values, and expand any slash-separated items.
 */
export function resolveStatuses(
  statuses: common.StatusWithPercent[],
  source: EnlirSkill | EnlirStatus,
) {
  function update(
    item: common.StatusWithPercent,
    status: common.StandardStatus,
    enlirStatus: EnlirStatusWithPlaceholders,
    isUncertain?: boolean,
    conj?: common.Conjunction,
  ): common.StatusWithPercent {
    return {
      ...item,
      conj: conj || item.conj,
      status: {
        ...status,
        name: enlirStatus.status.name,
        id: enlirStatus.status.id,
        placeholders: enlirStatus.placeholders,
        isUncertain,
        // Avoid circular references
        effects: enlirStatus.status === source ? undefined : safeParseStatus(enlirStatus.status),
      },
    };
  }

  const newStatuses: common.StatusWithPercent[] = [];
  for (const i of statuses) {
    if (i.status.type !== 'standardStatus') {
      newStatuses.push(i);
      continue;
    }

    let name = i.status.name;
    let isUncertain: boolean | undefined;
    if (name !== '?' && name.endsWith('?')) {
      name = name.replace(/\?$/, '');
      isUncertain = true;
    }
    const enlirStatus = getEnlirStatusWithPlaceholders(name);
    if (enlirStatus) {
      newStatuses.push(update(i, i.status, enlirStatus, isUncertain));
    } else if (i.status.name.match('/')) {
      const statusOptions = expandSlashOptions(name);
      let conj: common.Conjunction | undefined = i.conj;
      for (const j of statusOptions) {
        const thisEnlirStatus = getEnlirStatusWithPlaceholders(j);
        if (thisEnlirStatus) {
          newStatuses.push(update(i, i.status, thisEnlirStatus, isUncertain, conj));
        } else {
          logger.warn(`Unknown status ${i.status.name}`);
          newStatuses.push({ ...i, conj });
        }
        conj = '[/]';
      }
    } else {
      logger.warn(`Unknown status ${i.status.name}`);
      newStatuses.push(i);
    }
  }
  return newStatuses;
}

const valueMergeTypes = [
  'castSpeed',
  'critChance',
  'damageBarrier',
  'damageUp',
  'hpStock',
  'radiantShield',
  'statMod',
  'stoneskin',
] as const;
const elementMergeTypes = [
  'elementAttack',
  'elementResist',
  'enElement',
  'enElementStacking',
  'enElementWithStacking',
] as const;

function tryToMergeEffects(
  effectA: statusTypes.StatusEffect,
  effectB: statusTypes.StatusEffect,
  conj: common.Conjunction | undefined,
  placeholdersA?: EnlirStatusPlaceholders,
  placeholdersB?: EnlirStatusPlaceholders,
): statusTypes.StatusEffect | undefined {
  if (effectA.length !== effectB.length) {
    return undefined;
  }

  const placeholdersEqual = _.isEqual(placeholdersA, placeholdersB);
  const resolveA = makePlaceholderResolvers(placeholdersA);
  const resolveB = makePlaceholderResolvers(placeholdersB);

  const result: statusTypes.StatusEffect = [];
  for (let i = 0; i < effectA.length; i++) {
    const a = effectA[i];
    const b = effectB[i];
    if (a.type !== b.type) {
      return undefined;
    }

    if (_.isEqual(a, b) && placeholdersEqual) {
      result.push(a);
      continue;
    }

    let match = false;
    if (conj === 'or') {
      if (
        a.type === 'statMod' &&
        b.type === 'statMod' &&
        !a.hybridStats &&
        _.isEqual(_.omit(a, 'stats'), _.omit(b, 'stats'))
      ) {
        result.push({
          ...a,
          hybridStats: resolveB.stat(b.stats),
        });
        match = true;
      }
    } else {
      for (const type of valueMergeTypes) {
        if (
          a.type === type &&
          b.type === type &&
          _.isEqual(_.omit(a, 'value'), _.omit(b, 'value'))
        ) {
          const valueA = resolveA.x(a.value);
          const valueB = resolveB.x(b.value);
          result.push({ ...a, value: _.flatten([valueA, valueB]) });
          match = true;
          break;
        }
      }

      for (const type of elementMergeTypes) {
        if (
          a.type === type &&
          b.type === type &&
          _.isEqual(_.omit(a, 'element'), _.omit(b, 'element'))
        ) {
          const valueA = resolveA.element(a.element);
          const valueB = resolveB.element(b.element);
          result.push({ ...a, element: _.flatten([valueA, valueB]) });
          match = true;
          break;
        }
      }
    }

    if (!match) {
      return undefined;
    }
  }

  return result;
}

export function mergeSimilarStatuses(statuses: common.StatusWithPercent[]) {
  const newStatuses: common.StatusWithPercent[] = [];
  for (const i of statuses) {
    if (
      i.status.type !== 'standardStatus' ||
      wellKnownStatuses.has(i.status.name) ||
      !i.status.effects
    ) {
      newStatuses.push(i);
      continue;
    }

    const prev = newStatuses.length ? newStatuses[newStatuses.length - 1] : undefined;
    if (!prev || (prev.status.type !== 'standardStatus' || !prev.status.effects)) {
      newStatuses.push(i);
      continue;
    }

    const merged = tryToMergeEffects(
      prev.status.effects,
      i.status.effects,
      i.conj,
      prev.status.placeholders,
      i.status.placeholders,
    );
    if (!merged) {
      newStatuses.push(i);
      continue;
    }

    newStatuses[newStatuses.length - 1] = {
      ...prev,
      duration: prev.duration || i.duration,
      status: {
        ...prev.status,
        effects: merged,
        mergeCount: (prev.status.mergeCount || 1) + 1,
      },
    };
  }
  return newStatuses;
}

/**
 * Complex combinations of statuses, like "[A1] and [B1]/[A2] and [B2]/[A3]
 * and [B3] and [C] if 1/2/3", need special handling.
 */
export function isComplexStatusList(statuses: common.StatusWithPercent[]): boolean {
  // TODO: This could use refinement.
  // The first conjunction is (nearly?) always null, so we're really just
  // checking whether there's a slash, but it seems to work well in practice.
  return statuses.find(i => i.conj === '/') != null && statuses.find(i => i.conj !== '/') != null;
}

export function appendComplexStatusDescription(
  item: common.StatusWithPercent,
  description: string,
  index: number,
  length: number,
) {
  let result: string;
  if (index) {
    result = item.conj === '/' ? ') / (' : item.conj === 'or' ? ' or ' : ', ';
  } else {
    result = '(';
  }
  result += description;
  if (index + 1 === length) {
    result += ')';
  }
  return result;
}
