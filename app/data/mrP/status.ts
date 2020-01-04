import * as _ from 'lodash';
import * as XRegExp from 'xregexp';

import { logException, logger } from '../../utils/logger';
import { arrayify, getAllSameValue } from '../../utils/typeUtils';
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
import * as common from './commonTypes';
import { describeRageEffects } from './rage';
import { convertEnlirSkillToMrP, formatMrPSkill } from './skill';
import * as skillTypes from './skillTypes';
import { splitStatusEffects } from './split';
import {
  doubleAlias,
  effectAlias,
  enlirRankBoost,
  enlirRankBoostRe,
  enlirRankCastSpeedRe,
  formatSmartEther,
  rankBoostAlias,
  rankCastSpeedAlias,
  resolveEffectAlias,
  resolveNumbered,
  resolveStatusAlias,
  sbPointsBoosterAlias,
  splitNumbered,
} from './statusAlias';
import * as statusParser from './statusParser';
import * as statusTypes from './statusTypes';
import {
  formatSchoolOrAbilityList,
  getAbbreviation,
  getElementShortName,
  getShortName,
  getShortNameWithSpaces,
  XRegExpNamedGroups,
} from './typeHelpers';
import {
  andJoin,
  andList,
  andOrList,
  cleanUpSlashedNumbers,
  lowerCaseFirst,
  numberOrUnknown,
  orList,
  parseNumberOccurrence,
  parseNumberString,
  percentToMultiplier,
  signedNumber,
  slashMerge,
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
]);

const wellKnownAliases: _.Dictionary<string> = {
  'Low Regen': 'Regen (lo)',
  'Medium Regen': 'Regen (med)',
  'High Regen': 'Regen (hi)',
};

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
export const formatTriggeredEffectOld = (
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

function parseWho(who: string): string | undefined {
  return who.match('user')
    ? undefined // No need to spell out "self" for, e.g., "hi fastcast 1"
    : who.match('target')
    ? 'ally'
    : who.match('front')
    ? 'front row'
    : who.match('back')
    ? 'back row'
    : who.match("character's")
    ? 'same row'
    : 'party';
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

interface FollowUpEffect {
  /**
   * Follow-up statuses granted.
   */
  statuses: StatusItem[] | undefined;

  /**
   * Follow-up skills that are cast.  Array support is currently only used for
   * Ace's Firaga BOM follow-up.
   */
  skills: string[] | undefined;

  /**
   * Follow-up individual status effects granted - stored as StatusItem so we
   * can easily track metadata.
   */
  effects: StatusItem[] | undefined;

  randomSkills: boolean;
  customStatusesDescription?: string;

  chance: number | undefined;
  trigger: string | null;
  isDamageTrigger: boolean;
  isRankTrigger: boolean;
  customTriggerSuffix?: string;
  triggerPrereqStatus?: string;
  customSkillSuffix?: string;

  /**
   * Auto interval, in seconds.  Either this or trigger is non-null.
   */
  autoInterval: number | null;
}

function checkCustomTrigger(enlirStatus?: EnlirStatus | null): string | undefined {
  if (
    enlirStatus &&
    (enlirStatus.effects.endsWith('removed after triggering') ||
      enlirStatus.effects.endsWith('removes ' + enlirStatus.name))
  ) {
    return 'once only';
  } else {
    return undefined;
  }
}

const followUpRe = XRegExp(
  String.raw`
  (?:(?<chance>\d+)%\ chance\ to\ )?
  (?<allEffects>.*)\ #
  (?:after\ #
    (?<triggerType>using|dealing\ damage\ with|dealing|exploiting|taking\ (?<takeDamageTrigger>.*?)\ damage)\ #
    (?<trigger>.*?)
    (?<rankTrigger>\ at\ rank\ 1/2/3/4/5)?
  |
    every\ (?<autoInterval>[0-9.]+)\ seconds
  )
  (\ if\ there\ are\ (?<realmThresholdCount>(?:[0-9]+/)*[0-9]+\+?)\ (?<realmThresholdType>.*?)\ characters\ in\ the\ party)?
  (\ if\ the\ user\ has\ any\ (?<triggerPrereqStatus>.*?))?

  (?:,\ removed\ (?:if|after)|$)
  `,
  'x',
);

function parseFollowUpEffect(
  effect: string,
  enlirStatus?: EnlirStatus | null,
): FollowUpEffect | null {
  // Hack: Make sure we don't accidentally pick up "removed" clauses with our
  // broad regex.
  if (effect.startsWith('removed ')) {
    return null;
  }

  const match = XRegExp.exec(effect, followUpRe) as any;
  if (!match) {
    return null;
  }
  const {
    chance,
    allEffects,
    triggerType,
    takeDamageTrigger,
    rankTrigger,
    trigger,
    autoInterval,
    triggerPrereqStatus,
    realmThresholdCount,
    realmThresholdType,
  } = match as XRegExpNamedGroups;

  let skills: string[] | undefined;
  let effects: StatusItem[] | undefined;
  let statuses: StatusItem[] | undefined;

  let randomSkills = false;
  let m: RegExpMatchArray | null;
  if ((m = allEffects.match(/([Rr]andomly )?[Cc]asts (.*?)(?:(?:,| and) grants|$)/))) {
    randomSkills = m[1] != null;
    skills = m[2].split(' / ');
  }
  if ((m = allEffects.match(/(?:[Gg]rants|[Cc]auses) (.*?)(?:(?:,| and) (?:randomly )?casts|$)/))) {
    statuses = m[1].split(andList).map(i => parseStatusItem(i, allEffects));
  }
  if (!skills && !statuses) {
    effects = allEffects.split(andList).map(i => parseStatusItem(i, allEffects));
  }

  // Hack: Auto-cast skills are currently only actual skills.  Make sure we
  // don't try to process regen, sap, etc.
  if (autoInterval && !skills) {
    return null;
  }

  let customSkillSuffix: string | undefined;
  if (realmThresholdCount) {
    customSkillSuffix = `if ${realmThresholdCount} ${realmThresholdType} chars.`;
  }

  return {
    chance: chance ? +chance : undefined,
    skills,
    statuses,
    effects,
    randomSkills,
    // Hack: Merge the damage trigger back in; we'll parse it out in
    // describeFollowUpTrigger.
    trigger: takeDamageTrigger ? takeDamageTrigger + ' dmg ' + trigger : trigger,
    isDamageTrigger: triggerType === 'dealing damage with',
    isRankTrigger: !!rankTrigger,
    customTriggerSuffix: checkCustomTrigger(enlirStatus),
    customSkillSuffix,
    triggerPrereqStatus: triggerPrereqStatus || undefined,
    autoInterval: autoInterval ? parseFloat(autoInterval) : null,
  };
}

const isSameTrigger = (a: FollowUpEffect, b: FollowUpEffect) =>
  a.trigger === b.trigger && a.isDamageTrigger === b.isDamageTrigger;

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

type FollowUpStatusSequence = Array<[EnlirStatus, string[]]>;

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
  followUp: FollowUpEffect,
): FollowUpStatusSequence | null {
  if (!statusName.endsWith(' 0')) {
    return null;
  }

  const result: FollowUpStatusSequence = [];
  const baseStatusName = statusName.replace(/ 0$/, '');
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

    const thisEffects = splitStatusEffects(thisStatus.effects).filter(
      i => !shouldSkipEffect(i) && !parseFollowUpEffect(i),
    );

    result.push([thisStatus, thisEffects]);

    const thisStatusFollowUp = parseFollowUpEffect(thisStatus.effects);
    if (!thisStatusFollowUp) {
      break;
    }
    if (!isSameTrigger(followUp, thisStatusFollowUp)) {
      break;
    }
    // To be thorough, we'd also verify that the triggered name matches,
    // instead of assuming that they all follow the numbered sequence.
  }
  return result.length ? result : null;
}

/**
 * Given a follow-up status sequence, return a merged string describing the
 * effects.
 */
function describeMergedSequence(sequence: FollowUpStatusSequence) {
  const fallback = sequence.map(([, effects]) => effects.join(', ')).join(' / ');

  // The component effects of the sequence.  Object keys give the numbered
  // effect alias (see statusAlias.ts), while object values give the
  // (string-formatted) numbers themselves.
  const result: { [s: string]: string[] } = {};

  for (const [, effects] of sequence) {
    for (const i of effects) {
      const [text, numbered] = splitNumbered(i);
      if (!text || !numbered) {
        return fallback;
      }
      result[text] = result[text] || [];
      // Cast to number and back to format floating point values more simply.
      result[text].push('' + +numbered);
    }
  }

  return _.map(result, (values, key) =>
    resolveNumbered(effectAlias.numbered[lowerCaseFirst(key)] || key, values.join('-')),
  ).join(', ');
}

const isFinisherStatus = ({ effects }: EnlirStatus) =>
  !!getFinisherSkillName(effects) || !!getFinisherStatusName(effects);
const isFollowUpStatus = ({ effects }: EnlirStatus) => !!parseFollowUpEffect(effects);

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

function formatTurns(turns: string | number | null): string {
  if (!turns) {
    return '';
  } else if (+turns === 1) {
    return ' 1 turn';
  } else {
    return ' ' + turns + ' turns';
  }
}

function statusAsStatMod(statusName: string, enlirStatus?: EnlirStatus) {
  const statModRe = /((?:[A-Z]{3}(?:,? and |, ))*[A-Z]{3}) ([-+][0-9X]+%)/;
  let m: RegExpMatchArray | null;

  if ((m = statusName.match(statModRe))) {
    const [, stat, amount] = m;
    return { stat: stat.split(andList), amount };
  }

  if (enlirStatus && enlirStatus.codedName && enlirStatus.codedName.startsWith('CUSTOM_')) {
    if ((m = enlirStatus.effects.match(statModRe))) {
      const stat = m[1];
      let amount = m[2];

      // Hack: Substitute placeholders back from our status name.
      if (amount === '+X%') {
        if ((m = statusName.match(/([-+]\d+%)/))) {
          amount = m[1];
        }
      }

      return { stat: stat.split(andList), amount };
    }
  }

  return null;
}

interface AnyType {
  element?: common.OrOptions<EnlirElement>;
  school?: common.OrOptions<EnlirSchool>;
  jump?: boolean;
  magical?: boolean;
  skillType?: EnlirSkillType | EnlirSkillType[];
  skill?: string;
}

function formatAnyType<T extends AnyType>(type: T, suffix?: string): string {
  const result: string[] = [];

  // The way that formatAnyType is used, a slash-separated list of alternatives
  // is displayed the same as a comma-separated list.
  if (type.element) {
    result.push(
      formatSchoolOrAbilityList(
        common.isOptions(type.element) ? type.element.options : type.element,
      ),
    );
  }
  if (type.school) {
    result.push(
      formatSchoolOrAbilityList(common.isOptions(type.school) ? type.school.options : type.school),
    );
  }

  if (type.skillType === 'PHY') {
    result.push('phys');
  } else if (type.skillType) {
    result.push(arrayify(type.skillType).join('/'));
  }
  if (type.jump) {
    result.push('jump');
  }
  if (type.skill) {
    result.push(type.skill);
  }
  if (type.magical) {
    result.push('mag');
  }
  return result.length ? result.join(' ') + (suffix || '') : '';
}

function formatAnyCast<T extends AnyType>(type: T, cast: string): string {
  return formatAnyType({ ...type, magical: false }, ' ') + cast + (type.magical ? 'zap' : 'cast');
}

function shouldAbbreviateTurns(effect: statusTypes.EffectClause) {
  return effect.type === 'instacast' || effect.type === 'castSpeed';
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
    result += `, 2-3x ${type} cast @ rank 1-5`;
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
  if (count.values === 1 && !count.plus) {
    return '';
  } else {
    return arrayify(count.values).join('/') + (count.plus ? '+' : '') + ' ';
  }
}

function formatTrigger(trigger: statusTypes.Trigger): string {
  switch (trigger.type) {
    case 'ability':
      const count = formatTriggerCount(trigger.count);
      if (!trigger.element && !trigger.school && !trigger.jump) {
        if (trigger.requiresAttack) {
          return !count ? 'any attack' : count + ' attacks';
        } else {
          return !count ? 'any ability' : count + ' abilities';
        }
      } else {
        return count + formatAnyType(trigger);
      }
    case 'crit':
      return ''; // TODO
    case 'vsWeak':
      return ''; // TODO
    case 'whenRemoved':
      return ''; // TODO
    case 'auto':
      return ''; // TODO
    case 'damaged':
      return ''; // TODO
    case 'dealDamage':
      return ''; // TODO
    case 'loseStatus':
      return ''; // TODO
    case 'skill':
      return ''; // TODO
    case 'skillTriggered':
      return ''; // TODO
    case 'damagedByAlly':
      return ''; // TODO
    case 'singleHeal':
      return ''; // TODO
  }
}

function handleOrOptions<T>(options: common.OrOptions<T>, f: (item: T) => string): string {
  if (Array.isArray(options)) {
    return options.map(f).join('+');
  } else if (typeof options === 'object' && 'options' in options) {
    return slashMerge(options.options.map(f));
  } else {
    return f(options);
  }
}

function formatTriggerableEffect(
  effect: statusTypes.TriggerableEffect,
  enlirStatus: EnlirStatus,
  source: EnlirSkill | undefined,
  abbreviate: boolean,
): string {
  switch (effect.type) {
    case 'castSkill': {
      return handleOrOptions(effect.skill, skill => {
        const enlirSkill = enlir.otherSkillsByName[skill];
        if (enlirSkill) {
          return formatMrPSkill(
            convertEnlirSkillToMrP(enlirSkill, {
              abbreviate,
              showNoMiss: false,
              includeSchool: true,
              includeSbPoints: false,
              prereqStatus: enlirStatus.name,
            }),
            { showTime: false },
          );
        } else {
          return skill;
        }
      });
    }
    case 'randomCastSkill':
      return ''; // TODO
    case 'gainSb':
      return ''; // TODO
    case 'grantStatus':
      return ''; // TODO
    case 'heal':
      return ''; // TODO
    case 'triggerChance':
      return ''; // TODO
    case 'smartEther':
      return ''; // TODO
  }
}

function formatTriggeredEffect(
  effect: statusTypes.TriggeredEffect,
  enlirStatus: EnlirStatus,
  source?: EnlirSkill,
): string {
  // TODO: condition
  // Following MrP's example, finishers are displayed differently.
  const isFinisher = effect.trigger.type === 'whenRemoved';
  const effects = arrayify(effect.effects)
    .map(i => formatTriggerableEffect(i, enlirStatus, source, !isFinisher))
    .join(', ');
  if (isFinisher) {
    return 'Finisher: ' + effects;
  } else {
    return '(' + formatTrigger(effect.trigger) + ' ⤇ ' + effects + ')';
  }
}

function describeStatusEffect(
  effect: statusTypes.EffectClause,
  enlirStatus: EnlirStatus,
  source?: EnlirSkill,
): string | null {
  switch (effect.type) {
    case 'statMod':
      return (
        signedNumber(effect.value) +
        '% ' +
        arrayify(effect.stats)
          .map(i => i.toUpperCase())
          .join('/')
      );
    case 'critChance':
      // TODO: trigger
      return 'crit =' + effect.value + '%';
    case 'critDamage':
      return signedNumber(effect.value) + '% crit dmg';
    case 'hitRate':
      return signedNumber(effect.value) + '% hit rate';
    case 'ko':
      return 'KO';
    case 'lastStand':
      return 'Last stand';
    case 'reraise':
      return 'Reraise ' + effect.value + '%';
    case 'statusChance':
      return null; // TODO
    case 'statusStacking':
      return null; // TODO
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
      return null; // TODO
    case 'castSpeed': {
      let cast: string;
      if (Array.isArray(effect.value)) {
        cast = effect.value.map(i => i.toString()).join('/');
      } else {
        cast =
          effect.value === 2 ? 'fast' : effect.value === 3 ? 'hi fast' : effect.value.toString();
      }
      return formatAnyCast(effect, cast);
    }
    case 'instantAtb':
      return null; // TODO
    case 'atbSpeed':
      return null; // TODO
    case 'physicalBlink':
      return 'Phys blink ' + effect.level;
    case 'magicBlink':
      return 'Magic blink ' + effect.level;
    case 'dualBlink':
      return 'PM blink ' + effect.level;
    case 'elementBlink':
      return null; // TODO
    case 'stoneskin':
      return (
        'Negate dmg ' +
        effect.percentHp +
        '%' +
        (effect.element ? ' (' + getElementShortName(effect.element) + ' only)' : '')
      );
    case 'magiciteStoneskin':
      return null; // TODO
    case 'fixedStoneskin':
      return null; // TODO
    case 'damageBarrier':
      return effect.value + '% Dmg barrier ' + effect.attackCount;
    case 'radiantShield':
      // TODO: overflow
      return (
        'Reflect Dmg' +
        (effect.value !== 100 ? ' ' + effect.value + '%' : '') +
        (effect.element ? ' as ' + getElementShortName(effect.element) : '')
      );
    case 'reflect':
      return null; // TODO
    case 'awoken':
      return formatAwoken(effect);
    case 'switchDraw':
      return null; // TODO
    case 'switchDrawStacking':
      return null; // TODO
    case 'elementAttack':
      return signedNumber(effect.value) + '% ' + getElementShortName(effect.element) + ' dmg';
    case 'elementResist':
      return signedNumber(-effect.value) + '% ' + getElementShortName(effect.element) + ' vuln.';
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
      return null; // TODO
    case 'abilityBuildup':
      return null; // TODO
    case 'rankBoost':
      return rankBoostAlias(formatAnyType(effect));
    case 'damageUp':
      // TODO: trigger
      return (
        arrayify(effect.value)
          .map(percentToMultiplier)
          .join('/') +
        'x ' +
        formatAnyType(effect, ' ') +
        'dmg' +
        (effect.vsWeak ? ' vs. weak' : '')
      );
    case 'abilityDouble':
      return null; // TODO
    case 'dualcast':
      return null; // TODO
    case 'noAirTime':
      return 'no air time';
    case 'breakDamageCap':
      return null; // TODO
    case 'damageCap':
      return 'dmg cap +' + toMrPKilo(effect.value);
    case 'hpStock':
      return 'Autoheal ' + toMrPKilo(effect.value);
    case 'regen':
      return null; // TODO
    case 'fixedHpRegen':
      return 'regen ' + toMrPKilo(effect.value) + ' HP per ' + effect.interval + 's';
    case 'poison':
      return null; // TODO
    case 'healUp':
      return null; // TODO
    case 'pain':
      return null; // TODO
    case 'damageTaken':
      return null; // TODO
    case 'barHeal':
      return null; // TODO
    case 'doom':
      return null; // TODO
    case 'doomTimer':
      return null; // TODO
    case 'drainHp':
      return null; // TODO
    case 'counter':
      if (effect.skillType === 'PHY') {
        if (!effect.chance && !effect.counter) {
          return 'Retaliate';
        }
      }
      return null; // TODO
    case 'rowCover':
      return null; // TODO
    case 'triggeredEffect':
      return formatTriggeredEffect(effect, enlirStatus, source);
    case 'gainSb':
      return null; // TODO
    case 'sbGainUp':
      return null; // TODO
    case 'taunt':
      return 'taunt ' + arrayify(effect.skillType).join('/');
    case 'runic':
      return null; // TODO
    case 'immuneAttacks':
      return null; // TODO
    case 'zeroDamage':
      return null; // TODO
    case 'evadeAll':
      return null; // TODO
    case 'multiplyDamage':
      return null; // TODO
    case 'berserk':
      return null; // TODO
    case 'rage':
      return null; // TODO
    case 'abilityBerserk':
      return null; // TODO
    case 'turnDuration':
      return null; // TODO
    case 'removedUnlessStatus':
      return null; // TODO
    case 'onceOnly':
      return null; // TODO
    case 'removedAfterTrigger':
      return null; // TODO
    case 'trackStatusLevel':
      return null; // TODO
    case 'changeStatusLevel':
      return null; // TODO
    case 'setStatusLevel':
      return null; // TODO
    case 'statusLevelBooster':
      return null; // TODO
    case 'burstToggle':
      return null; // TODO
    case 'trackUses':
      return null; // TODO
    case 'burstOnly':
      return null; // TODO
    case 'burstReset':
      return null; // TODO
    case 'statusReset':
      return null; // TODO
    case 'disableAttacks':
      return null; // TODO
    case 'paralyze':
      return null; // TODO
  }
}

/**
 * Sort statuses for nicer display.
 */
function sortStatusEffects(statusEffects: statusTypes.EffectClause[]): statusTypes.EffectClause[] {
  // For example, put Draw Fire's taunt effect before its stat mod, since a
  // stat mod that immediately follows an attack normally applies to the enemy.
  return _.sortBy(statusEffects, i => (i.type === 'taunt' ? 0 : 1));
}

export function describeEnlirStatus(
  status: string,
  enlirStatus?: EnlirStatusWithPlaceholders,
  source?: EnlirSkill,
) {
  if (wellKnownStatuses.has(status)) {
    return status;
  } else if (wellKnownAliases[status]) {
    return wellKnownAliases[status];
  }
  if (!enlirStatus) {
    return status;
  }

  let statusEffects = safeParseStatus(enlirStatus.status, enlirStatus.placeholders);
  if (!statusEffects) {
    return status;
  }

  statusEffects = sortStatusEffects(statusEffects);

  // Simple turn-limited statuses are represented with a numeric suffix.
  let suffix = '';
  if (
    statusEffects.length === 2 &&
    statusEffects[1].type === 'turnDuration' &&
    statusEffects[1].duration.units === 'turns'
  ) {
    const turnCount = statusEffects[1].duration.value;
    suffix = ' ' + turnCount;
    if (statusEffects[1].duration.valueIsUncertain) {
      suffix += '?';
    }
    if (!shouldAbbreviateTurns(statusEffects[0])) {
      suffix += ' turn' + (turnCount === 1 ? '' : 's');
    }
    statusEffects.splice(1, 1);
  }

  return (
    statusEffects
      .map(i => describeStatusEffect(i, enlirStatus.status, source))
      .filter(i => !!i)
      .join(', ') + suffix
  );
}

const getFinisherSkillName = (effect: string) => {
  const m = effect.match(/[Cc]asts (.*?) when removed/);
  return m ? m[1] : null;
};

const getFinisherStatusName = (effect: string) => {
  const m = effect.match(/[Gg]rants (.*?) when removed/);
  return m ? m[1] : null;
};

function describeFinisherSkill(skillName: string, sourceStatusName: string) {
  const skill = getEnlirOtherSkill(skillName, sourceStatusName);
  if (!skill) {
    logger.warn(`Unknown finisher skill ${skill}`);
    return skillName;
  }

  const mrP = convertEnlirSkillToMrP(skill, { showNoMiss: false, includeSbPoints: false });

  return finisherText + formatMrPSkill(mrP, { showTime: false });
}

function describeFinisherStatus(statusName: string): string {
  const status = getEnlirStatusByName(statusName);
  let result = describeEnlirStatus(statusName);

  // Hack: Partially duplicated from convertEnlirSkillToMrP.  We currently
  // only support default durations.
  if (status && status.defaultDuration) {
    result += ' ' + formatDuration({ value: status.defaultDuration, units: 'seconds' });
  }

  return finisherText + result;
}

/**
 * Status effects that are too verbose to fit in a MrP style format or should
 * otherwise be skipped.
 * @param effect
 */
function shouldSkipEffect(effect: string, enlirStatus?: EnlirStatus | null) {
  return (
    // "removed after using" is just for Ace's Top Card.
    // "removed if the user hasn't" describes USB effects that are paired
    // with other USB effects (when one is removed, the other is too) and for
    // leaving Burst Mode.
    effect.startsWith('removed after using ') ||
    effect.startsWith("removed if the user hasn't") ||
    effect.startsWith("Removed if the user doesn't have any") ||
    effect === 'reset upon refreshing Burst Mode' ||
    // Warrior's Hymn, Mage's Hymn, Goddess's Paean, Ode to Victory
    effect.startsWith('Used to determine the effect of ') ||
    // Custom triggers
    effect.startsWith('removed after triggering') ||
    // Burst toggles - we communicate this via a separate flag
    effect.match(/[Aa]ffects certain Burst Commands/) ||
    // Status details
    effect === 'affects targeting' ||
    effect === 'resets ATB when removed' ||
    // Alternate phrasing of "removed after triggering"
    (enlirStatus && effect === 'removes ' + enlirStatus.name)
  );
}

/**
 * Describes a single "status effect" - one fragment of an EnlirStatus effects string
 */
function describeEnlirStatusEffect(
  effect: string,
  enlirStatus?: EnlirStatus | null,
  source?: EnlirSkill,
): string {
  let m: RegExpMatchArray | null;

  if (
    effect.startsWith('removed if ') ||
    effect.startsWith('removed upon ') ||
    effect.match(/^lasts \d+ turns?/)
  ) {
    return '';
  }

  if (enlirStatus) {
    const followUp = parseFollowUpEffect(effect, enlirStatus);
    if (followUp) {
      const sequence = getFollowUpStatusSequence(enlirStatus.name, followUp);
      if (sequence) {
        followUp.statuses = sequence.map(([status, effects]) => ({ statusName: status.name }));
        followUp.customStatusesDescription = describeMergedSequence(sequence);
      }
      return describeFollowUp(followUp, enlirStatus.name);
    }

    const finisherSkillName = getFinisherSkillName(effect);
    if (finisherSkillName) {
      return describeFinisherSkill(finisherSkillName, enlirStatus.name);
    }

    const finisherStatusName = getFinisherStatusName(effect);
    if (finisherStatusName) {
      return describeFinisherStatus(finisherStatusName);
    }
  }

  // Generic status effects
  {
    // If dealing with an effect from a stacking status, like Tifa's
    // Striker Mode's 2x / 4x / 6x cast, then prefer generic numbered effects,
    // on the assumption that higher-level code will want to slash-merge it.
    const preferNumbered = enlirStatus != null && isStackingStatus(enlirStatus);

    const genericEffect = resolveEffectAlias(effect, { preferNumbered });
    if (genericEffect) {
      return genericEffect;
    }
  }

  // Special cases
  if ((m = effect.match(/((?:[A-Z]{3}(?:,? and |, ))*[A-Z]{3}) ([-+]\d+%)/))) {
    // Status effects: e.g., "MAG +30%" from EX: Attack Hand
    // Reorganize stats into, e.g., +30% MAG to match MrP
    const [, stat, amount] = m;
    return amount + ' ' + describeStats(stat.split(andList));
  }

  // Awoken
  if ((m = effect.match(/(.*) (?:abilities|attacks) don't consume uses/))) {
    let result = formatSchoolOrAbilityList(m[1]) + ' inf. hones';
    if (effect.endsWith(enlirRankBoost)) {
      result += ', up to 1.3x dmg @ rank 5';
    }
    return result;
  }

  if (
    (m = effect.match(/[Dd]ualcasts (.*) (?:abilities|attacks)( consuming an extra ability use)?/))
  ) {
    const schoolOrAbility = formatSchoolOrAbilityList(m[1]);
    const extraHones = m[2];
    if (enlirStatus && isAwokenStatus(enlirStatus.name)) {
      // Ability or element should be redundant for AASBs
      return '100% dualcast';
    } else if (extraHones) {
      return doubleAlias(schoolOrAbility);
    } else {
      return `100% dualcast ${schoolOrAbility}`;
    }
  }

  if (
    (m = effect.match(/^(\d+|\?)% chance to dualcast abilities that deal (.*) damage$/)) ||
    (m = effect.match(/^(\d+|\?)% chance to dualcast (.*) abilities$/))
  ) {
    const [, percent, schoolOrElement] = m;
    return `${percent}% dualcast ${formatSchoolOrAbilityList(schoolOrElement)}`;
  }

  if ((m = effect.match(enlirRankBoostRe))) {
    return rankBoostAlias(formatSchoolOrAbilityList(m[1]));
  }
  if ((m = effect.match(enlirRankCastSpeedRe))) {
    return rankCastSpeedAlias(formatSchoolOrAbilityList(m[1]));
  }

  // Stacking ability boost and element boost.
  if (
    (m = effect.match(
      /(.*) (?:abilities|attacks) deal ([0-9/]+)% more damage for each (.*) ability used, up to \+(\d+)%/,
    ))
  ) {
    // MrP formats these as like this:
    // "1.05-1.3x Knight dmg ...maxed @6 Knight used this battle"
    // We instead use the same stacking format we use for OK's p-USB.
    const [, schoolOrAbility, percent, stackingSchoolOrAbility, stackingMax] = m;
    const boostedType = formatSchoolOrAbilityList(schoolOrAbility);
    const sourceType = formatSchoolOrAbilityList(stackingSchoolOrAbility);
    const maxCount = +stackingMax / +percent;
    return (
      `${percentToMultiplier(percent)}x ${boostedType} dmg per ${sourceType}, ` +
      `max ${percentToMultiplier(stackingMax)}x @ ${maxCount} ${sourceType}`
    );
  }

  // Stacking cast speed.
  if ((m = effect.match(/Cast speed x((?:[0-9.]+\/)+[0-9.]+)/))) {
    const castSpeed = m[1].split('/').map(i => toMrPFixed(+i));
    return castSpeed.join('-') + 'x cast';
  }

  // Handle ability boost and element boost.  The second form is only observed
  // with Noctis's non-elemental boosts; it may simply be an inconsistency.
  // Ths overlaps with the statusAlias, but duplicating it here lets us handle
  // school lists, etc.
  if (
    (m = effect.match(/(.*) (?:abilities|attacks) deal ([0-9/]+)% more damage/)) ||
    (m = effect.match(/[Ii]ncreases (.*) damage dealt by ([0-9/]+)%/))
  ) {
    const [, schoolOrAbility, percent] = m;
    const boost = percent
      .split('/')
      .map(parseFloat)
      .map(i => 1 + i / 100)
      .map(toMrPFixed)
      .join('-');
    return boost + 'x ' + formatSchoolOrAbilityList(schoolOrAbility) + ' dmg';
  }

  if ((m = effect.match(/[Ss]ets the damage cap for (.*) attacks to 99999/))) {
    return 'break ' + m[1] + ' dmg cap';
  }

  if ((m = effect.match(/[Rr]estores? (\d+) HP/))) {
    const [, healHp] = m;
    return `heal ${toMrPKilo(+healHp)} HP`;
  }

  if (
    (m = effect.match(
      /[Cc]ast speed x([0-9.]+) plus x([0-9.]+) for each (attack|ability) used for the duration of the status, up to x([0-9.]+)/,
    ))
  ) {
    const [, start, add, attackOrAbility, max] = m;
    const startN = toMrPFixed(+start);
    const addN = toMrPFixed(+add);
    const maxN = toMrPFixed(+max);
    const maxCount = Math.round((+max - +start) / +add);
    const atkDesc = attackOrAbility === 'attack' ? 'atk' : 'abil.';
    const atksDesc = attackOrAbility === 'attack' ? 'atks' : 'abils.';
    return `cast speed ${startN}x, +${addN}x per ${atkDesc}, max ${maxN}x @ ${maxCount} ${atksDesc}`;
  }

  // Cast speed for ability combinations - cast speed for individual ability
  // schools is handled as a simple effect alias.
  if ((m = effect.match(/([Cc]ast speed x[0-9.]+) for (.*?) (?:attacks|abilities)/))) {
    const [, baseEffect, kind] = m;
    const baseAlias = resolveEffectAlias(baseEffect);
    if (baseAlias) {
      return (
        kind
          .split(andOrList)
          .map(getShortName)
          .join('/') +
        ' ' +
        baseAlias
      );
    }
  }

  if (
    (m = effect.match(
      /[Rr]estores HP for (\d+)% of the damage dealt with (.*?) (?:attacks|abilities)/,
    ))
  ) {
    const [, percent, kind] = m;
    return (
      `heal ${percent}% of ` +
      kind
        .split(orList)
        .map(getShortName)
        .join('/') +
      ' dmg'
    );
  }

  if ((m = effect.match(/(\w+ )?[Ss]mart (\w+ )?ether (\S+) when removed/))) {
    const [, type1, type2, amount] = m;
    return finisherText + formatSmartEther(amount, type1 || type2);
  }

  if ((m = effect.match(/[Hh]eals for (\d+)% max HP every ([0-9.]+) seconds/))) {
    const [, percent, howOften] = m;
    return `regen ${percent}% HP per ${howOften}s`;
  }

  // Counter-attacks.
  if (
    (m = effect.match(/(?:(\d+)% chance of countering|[Cc]ounters) enemy (.*) attacks with (.*)/))
  ) {
    const [, percentChance, trigger, skill] = m;
    let triggerDescription = "foe's " + trigger.split(andList).join('/') + ' atk';
    if (percentChance) {
      triggerDescription += ` (${percentChance}%)`;
    }
    return formatTriggeredEffectOld(
      triggerDescription,
      describeFollowUpSkill(skill, undefined, enlirStatus ? enlirStatus.name : undefined),
    );
  }

  // Rage status.  This involves looking up the Other Skills associated with
  // the Rage status's source and filling in their effects.
  if (effect.match(/[Ff]orces a specified action/) && source) {
    return describeRageEffects(source);
  }

  if (shouldSkipEffect(effect, enlirStatus)) {
    return '';
  }

  // Stacking effects
  {
    const options = getSlashOptions(effect);
    if (options) {
      const slashOptions = expandSlashOptions(effect, options);
      return slashMerge(slashOptions.map(i => describeEnlirStatusEffect(i, enlirStatus, source)));
    }
  }

  // Fallback
  return effect;
}

export interface ParsedEnlirStatus {
  description: string;
  isDetail: boolean;
  isExLike: boolean;
  isBurstToggle: boolean;
  isTrance: boolean;
  defaultDuration: number | null;
  isVariableDuration: boolean;
  specialDuration?: string;
}

/**
 * Describes a status's individual effects.  This is not an exact science,
 * but the general idea is that "common" statuses can be listed more or less
 * as is (possibly using our shorter or more explanatory aliases), while rare
 * or character-specific statuses should be broken down and their individual
 * effects listed separately.
 */
function describeEffects(enlirStatus: EnlirStatus, source?: EnlirSkill): string {
  // Allow overrides from status aliases, even here.  (This is used for
  // Haurchefant Cover in particular: because that's really verbose and
  // specialized, we want to be able to say it should always show details, but
  // we also want to be able to use aliases to how those details should
  // actually be shown.)
  {
    const genericStatus = resolveStatusAlias(enlirStatus.name);
    if (genericStatus) {
      return genericStatus;
    }
  }

  return splitStatusEffects(enlirStatus.effects)
    .map(i => describeEnlirStatusEffect(i, enlirStatus, source))
    .filter(i => i !== '')
    .join(', ');
}

function extractLeadingCount(s: string): [number | string, string] | null {
  const m = s.match(/^(\S+) (.*)/);
  if (!m) {
    return null;
  }

  let count: number | string | null = null;
  if (m[1].match(/^[0-9/]+$/)) {
    count = cleanUpSlashedNumbers(m[1]);
  } else {
    count = parseNumberString(m[1]);
  }

  if (count != null) {
    return [count, m[2]];
  } else {
    return null;
  }
}

function extractTrailingCount(s: string): [number | string, string] | null {
  const m = s.match(/^(.*) (\S+)$/);
  if (!m) {
    return null;
  }

  const count = parseNumberOccurrence(m[2]);
  if (count != null) {
    return [count, m[1]];
  } else {
    return null;
  }
}

/**
 * Check for a count on a string.  Handle both leading number strings, like
 * "Twenty-two," and threshold-type values, like "1/2/3".  Also handle trailing
 * counts like "... twice."
 */
export function extractCount(s: string): [number | string | null, string] {
  return extractLeadingCount(s) || extractTrailingCount(s) || [null, s];
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
function expandSlashOptions(s: string, options?: string[]): string[] {
  if (!options) {
    options = getSlashOptions(s) || [];
  }
  return options.map(i => s.replace(slashOptionsRe, i));
}

const describeAutoInterval = (autoInterval: number) => `every ${toMrPFixed(autoInterval)}s`;

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
  if (trigger === 'a critical hit') {
    return 'crit';
  }
  if (trigger === 'elemental weakness') {
    return hitWeaknessTriggerText;
  }
  if (trigger === 'a single-target heal') {
    return 'ally heal';
  }

  // FIXME: Handle cases like Celes SASB where specific commands are referenced

  // Special case: Steiner
  const m = trigger.match(/(.*) dmg from a (.*) attack used by another ally/);
  if (m) {
    let [, damageType, attackType] = m;
    damageType = m[1]
      .split('/')
      .map(getShortName)
      .join('/');
    attackType = attackType.split(orList).join('/');
    if (attackType === 'BLK/WHT/BLU/SUM') {
      attackType = 'mag';
    }
    return `take ${damageType} ${attackType} dmg from ally`;
  }

  trigger = trigger.replace(/ (abilities|ability|attacks|attack)$/, '').replace(/^an? /, '');

  let count: number | string | null;
  [count, trigger] = extractCount(trigger);

  // Turn element alternatives into abbreviations.
  trigger = trigger.replace(slashOptionsRe, i =>
    i
      .split('/')
      .map(getAbbreviation)
      .join('/'),
  );

  // Hack: Effects like 'Fire or Ice Spellblade' are ambiguous: is it
  // '(Fire) || (Ice Spellblade)', or '(Fire || Ice) Spellblade'?
  // Similarly, '1/2/3 +3n Wind' results in '+3n Wind' here - we want to
  // make sure to abbreviate 'wind'.
  trigger = trigger
    .split(orList)
    .map(getShortNameWithSpaces)
    .join('/');

  return (count ? count + ' ' : '') + trigger + (isDamageTrigger ? ' dmg' : '');
}

function describeFollowUpItem(
  { who, duration, durationUnits, rank }: StatusItem,
  description: string,
): string {
  if (who) {
    who = parseWho(who);
  }
  if (who) {
    description = who + ' ' + description;
  }
  if (rank) {
    description += ' @ rank 1-5';
  }

  if (duration && durationUnits) {
    description += ' ' + formatDuration({ value: duration, units: durationUnits });
  }

  return description;
}

function describeFollowUpStatus(item: StatusItem): string {
  const { statusName } = item;
  const status = getEnlirStatusByName(statusName);
  const options = getSlashOptions(statusName);

  let result: string;
  if (!status && options) {
    const statusOptions = expandSlashOptions(statusName, options);
    result = slashMerge(statusOptions.map(i => parseEnlirStatus(i).description));
  } else {
    result = parseEnlirStatus(statusName).description;
  }

  return describeFollowUpItem(item, result);
}

function describeFollowUpEffect(item: StatusItem): string {
  // Instead of handling slash-merging here, describeEnlirStatusEffect does
  // its own custom processing for individual cases.
  return describeFollowUpItem(item, describeEnlirStatusEffect(item.statusName));
}

/**
 * For a follow-up that triggers a skill, describes the skill.
 */
function describeFollowUpSkill(
  skillName: string,
  triggerPrereqStatus?: string,
  sourceStatusName?: string,
): string {
  const skill = sourceStatusName
    ? getEnlirOtherSkill(skillName, sourceStatusName)
    : enlir.otherSkillsByName[skillName];
  if (skill) {
    return formatMrPSkill(
      convertEnlirSkillToMrP(skill, {
        abbreviate: true,
        showNoMiss: false,
        includeSbPoints: false,
        prereqStatus: triggerPrereqStatus,
      }),
      {
        showTime: false,
      },
    );
  }

  const options = getSlashOptions(skillName);
  if (options) {
    // Slash-merging skills is really a hack:
    // - For abilities like Exdeath's Balance of Power or Relm's
    //   Friendly Sketch that have significantly varying effects, the code does
    //   a good job of separating the clauses.
    // - For abilities like Dr. Mog's AASB that have the same number of
    //   effects, some effects can be similar enough to force another one to
    //   merged piecemeal.  Merge effects individually in that case.
    // There really ought to be a better way of handling this...
    const skillOptions = options
      .map(i => skillName.replace(slashOptionsRe, i))
      .map((i: string) => describeFollowUpSkill(i, triggerPrereqStatus, sourceStatusName));
    const skillOptionParts = skillOptions.map(i => i.split(', '));
    const length = getAllSameValue(skillOptionParts.map(i => i.length));
    if (length) {
      return _.times(length, i => slashMerge(skillOptionParts.map(parts => parts[i]))).join(', ');
    } else {
      return slashMerge(skillOptions);
    }
  }

  return skillName;
}

/**
 * When describing follow-up statuses and status effects, remove 'who' clauses
 * that are the same from one item to the next, to avoid being redundant.
 *
 * When processing skills, we instead handle use separate arrays for self,
 * party, and other; we could take a similar approach here.
 */
function removeRedundantWho(item: StatusItem[]): StatusItem[] {
  let lastWho: string | undefined;
  return item.map(i => {
    if (i.who === lastWho) {
      return {
        ...i,
        who: undefined,
      };
    } else {
      lastWho = i.who;
      return i;
    }
  });
}

/**
 * For follow-up statuses, returns a string describing the follow-up (how it's
 * triggered and what it does).
 */
function describeFollowUp(followUp: FollowUpEffect, sourceStatusName: string): string {
  const triggerDescription = followUp.autoInterval
    ? describeAutoInterval(followUp.autoInterval)
    : describeFollowUpTrigger(followUp.trigger!, followUp.isDamageTrigger);

  const description: string[] = [];

  if (followUp.customStatusesDescription) {
    description.push(followUp.customStatusesDescription);
  } else if (followUp.statuses) {
    description.push(
      removeRedundantWho(followUp.statuses)
        .map(describeFollowUpStatus)
        .join(', '),
    );
  }

  if (followUp.effects) {
    description.push(
      removeRedundantWho(followUp.effects)
        .map(describeFollowUpEffect)
        .join(', '),
    );
  }

  if (followUp.skills) {
    let suffix: string = '';
    suffix += followUp.customSkillSuffix ? ' ' + followUp.customSkillSuffix : '';
    suffix += followUp.randomSkills ? ' (random)' : '';
    description.push(
      slashMerge(
        followUp.skills.map((i: string) =>
          describeFollowUpSkill(i, followUp.triggerPrereqStatus, sourceStatusName),
        ),
      ) + suffix,
    );
  }

  let fullDescription = description.join(', ');
  if (followUp.isRankTrigger) {
    fullDescription += ' @ rank 1-5';
  }
  // Append the custom trigger to the end of the description - although we
  // say that text like "(once only)" describes the trigger, the end works
  // better for AASBs like Gladiolus's, where "once only" only applies to
  // the final threshold, and we show thresholds as part of the
  // description.
  if (followUp.customTriggerSuffix) {
    fullDescription += ' (' + followUp.customTriggerSuffix + ')';
  }

  return formatTriggeredEffectOld(triggerDescription, fullDescription, followUp.chance);
}

function isFinisherOnly({ effects }: EnlirStatus): boolean {
  // Hack: If the skill starts with 'Removed ', instead of having ', removed'
  // in the middle, then assume that it consists only of finisher effects.
  return effects.startsWith('Removed ');
}

function getSpecialDuration({ effects }: EnlirStatus): string | undefined {
  let m: RegExpMatchArray | null;
  if (effects.match(/(?:, |^)[Rr]emoved if the user doesn't have any Stoneskin/)) {
    return 'until Neg. Dmg. lost';
  } else if (effects.match(/(?:, |^)[Rr]emoved upon taking damage/)) {
    return 'until damaged';
  } else if (
    effects.match(/(?:, |^)[Rr]emoved if (?:the )?user (?:hasn't|doesn't have) any Physical Blink/)
  ) {
    return 'until Phys blink lost';
  } else if (
    effects.match(/(?:, |^)[Rr]emoved if (?:the )?user (?:hasn't|doesn't have) any Magical Blink/)
  ) {
    return 'until Magic blink lost';
  } else if ((m = effects.match(/, lasts (\d+) turns?(?:$|,)/))) {
    return formatDuration({ value: +m[1], units: 'turns' });
  } else {
    return undefined;
  }
}

const hideUnknownStatusWarning = (status: string) => status.match(/^\d+ SB points$/);

/**
 * Parses a string description of an Enlir status name, returning details about
 * it and how it should be shown.
 */
export function parseEnlirStatus(status: string, source?: EnlirSkill): ParsedEnlirStatus {
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
  let description = describeEnlirStatus(status, enlirStatusWithPlaceholders, source);

  const isEx = isExStatus(status);
  const isAwoken = isAwokenStatus(status);
  const isExLike =
    isEx ||
    isAwoken ||
    (enlirStatus != null &&
      (isFinisherStatus(enlirStatus) ||
        isFollowUpStatus(enlirStatus) ||
        isModeStatus(enlirStatus)));

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

  let specialDuration = enlirStatus ? getSpecialDuration(enlirStatus) : undefined;

  if (enlirStatus && isFinisherOnly(enlirStatus)) {
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
    defaultDuration: enlirStatus && !hideDuration.has(status) ? enlirStatus.defaultDuration : null,
    isVariableDuration: !!enlirStatus && !!enlirStatus.mndModifier,
    specialDuration,
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
    const options = expandSlashOptions(status).map(i => parseEnlirStatus(i, source));
    return makeResult(options);
  } else {
    return parseEnlirStatus(status, source);
  }
}

/**
 * A single status item within a list of skill effects - includes the status
 * name itself and possible additional parameters
 *
 * FIXME: Finish replacing this with new PEG.js code
 */
export interface StatusItem {
  statusName: string;
  chance?: number;
  who?: string;
  duration?: number;
  durationUnits?: common.DurationUnits;
  scalesWithUses?: boolean;
  rank?: boolean; // Are this item's effects rank-based?
  stacking?: boolean;
  condition?: string;
}

const statusItemRe = XRegExp(
  String.raw`
  (?<statusName>.*?)
  (?:\ \((?<chance>\d+)%\))?
  (?<rank>\ at\ rank\ 1/2/3/4/5\ of\ the\ triggering\ ability)?
  (?:\ for\ (?<duration1>\d+\??|\?)\ (?<durationUnits1>second|turn)s?)?
  (?<scalesWithUses1>\ scaling\ with\ (?<scaleWithUsesSkill1>[A-Za-z ]+\ )?uses)?
  (?<who>
    \ to\ the\ user|
    \ to\ the\ target|
    \ to\ all\ allies(?:\ in\ the\ (?:front|back|character's)\ row)?|
    \ to\ the\ lowest\ HP%\ ally|
    \ to\ a\ random\ ally\ without\ status|
    \ to\ a\ random\ ally\ with\ negative\ (?:status\ )?effects
  )?
  (?:\ for\ (?<duration2>\d+\??|\?)\ (?<durationUnits2>second|turn)s?)?
  (?<scalesWithUses2>\ scaling\ with\ (?<scaleWithUsesSkill2>[A-Za-z ]+\ )?uses)?
  (?<ifSuccessful>\ if\ successful)?
  (?:\ if\ the\ user\ has\ (?<prereq>.*))?
  (?:\ if\ (?<females>.*?)\ or\ more\ females\ are\ in\ the\ party)?
  (?:\ if\ (?<characterInParty>.*?)\ (?:is|are)\ in\ the\ party)?
  (?:\ if\ (?<characterAlive>.*?)\ (?:is|are)\ alive)?
  (?<weakness>\ if\ exploiting\ elemental\ weakness)?
  (?:\ at\ (?<status>[A-Z].*))?
  (?<everyTwo>\ every\ two\ uses)?
  (?<ifUndead>\ to\ undeads)?
  ()
  $
  `,
  'x',
);

/**
 * Parses a status text to separate the status name itself from associated
 * parameters.
 *
 * @param statusText The text term (e.g., "Haste" or
 *     "RES and MND +30% to the user for 25 seconds")
 * @param wholeClause  The skill's statuses clause as a whole (e.g., "grants
 *      Magical Blink 1, RES and MND +30% to the user for 25 seconds"
 */
function parseStatusItem(statusText: string, wholeClause: string): StatusItem {
  // Determine target and duration.  This is hard, and I may not have it
  // right.  For example:
  // - "grants Haste and Burst mode to the user" - Haste is "to the user"
  // - "causes Imperil Fire 10% and DEF -50% for 15 seconds" - imperil is
  //   shortened to 15 seconds (I think) - but we handle that via
  //   shareStatusDurations
  // - "grants Magical Blink 1, RES and MND +30% to the user for 25
  //   seconds" - m.blink is to the party, stat boosts are to the user

  const m = XRegExp.exec(statusText, statusItemRe);
  if (!m) {
    return { statusName: statusText };
  }

  // tslint:disable prefer-const
  let {
    statusName,
    chance,
    who,
    duration1,
    duration2,
    durationUnits1,
    durationUnits2,
    rank,
    scalesWithUses1,
    scalesWithUses2,
    scaleWithUsesSkill1,
    scaleWithUsesSkill2,
    prereq,
    weakness,
    characterInParty,
    characterAlive,
    females,
    status,
    everyTwo,
    ifUndead,
    ifSuccessful,
  } = (m as unknown) as XRegExpNamedGroups;
  // tslint:enable prefer-const

  let lookaheadWho: string | undefined;
  if (!who) {
    const lookahead = wholeClause.match(
      /( to the user| to all allies(?:\ in\ the\ (?:front|back|character's)\ row)?)(?! for \d+ (second|turn)s?)/,
    );
    if (lookahead) {
      lookaheadWho = lookahead[1];
    }
  }

  const duration = duration1 || duration2;
  const durationUnits = durationUnits1 || durationUnits2;

  // Check if this scales with uses.  Hack: If it scales with the uses of
  // another skill, then assume that higher-level code will communicate that
  // (e.g., "powers up cmd 2".)
  const scalesWithUses =
    (scalesWithUses1 != null || scalesWithUses2 != null) &&
    scaleWithUsesSkill1 == null &&
    scaleWithUsesSkill2 == null;

  // Handle stacking statuses, like
  // "Warlord Mode 1/2/3/3 if the user has Warlord Mode 0/1/2/3"
  let stacking = false;
  if (
    statusName &&
    prereq &&
    statusName.replace(/[0-9\/]+/, 'X') === prereq.replace(/[0-9\/]+/, 'X')
  ) {
    stacking = true;
    // Enlir lists, e.g., 'Warlord Mode 1/2/3/3' to show that it doesn't stack
    // further.  Remove the redundancy.
    statusName = statusName.replace(/(\d)\/\1/, '$1');
  } else if (prereq) {
    logger.warn(`Unhandled prerequisite ${prereq} for ${statusName}`);
  }

  let condition: string | undefined;
  if (weakness) {
    condition = 'if hits weak';
  } else if (characterInParty) {
    condition = 'if ' + characterInParty + ' in party';
  } else if (characterAlive) {
    condition = 'if ' + characterAlive + ' alive';
  } else if (females) {
    condition = 'if ≥' + females + ' females in party';
  } else if (status) {
    condition = 'at ' + describeEnlirStatus(status);
  } else if (everyTwo) {
    condition = 'per 2 uses';
  } else if (ifUndead) {
    condition = 'if undead';
  } else if (ifSuccessful) {
    condition = 'on success';
  }

  return {
    statusName: statusName!,
    chance: chance ? +chance : undefined,
    who: who || lookaheadWho,
    duration: duration ? +duration : undefined,
    durationUnits: durationUnits ? ((durationUnits + 's') as common.DurationUnits) : undefined,
    scalesWithUses,
    rank: rank != null,
    stacking,
    condition,
  };
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
