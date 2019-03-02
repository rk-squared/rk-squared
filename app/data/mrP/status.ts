import * as _ from 'lodash';
import * as XRegExp from 'xregexp';

import { logger } from '../../utils/logger';
import { enlir, EnlirSkill, EnlirStatus, getEnlirStatusByName } from '../enlir';
import { describeEnlirSoulBreak, formatMrP } from './index';
import { splitStatusEffects } from './split';
import {
  effectAlias,
  enlirRankBoost,
  enlirRankBoostRe,
  resolveEffectAlias,
  resolveNumbered,
  resolveStatusAlias,
  splitNumbered,
} from './statusAlias';
import {
  formatMediumList,
  formatSchoolOrAbilityList,
  getAbbreviation,
  getMiddleName,
  getShortName,
  XRegExpNamedGroups,
} from './types';
import {
  andList,
  cleanUpSlashedNumbers,
  lowerCaseFirst,
  numberWithCommas,
  orList,
  parseNumberString,
  slashMerge,
  toMrPFixed,
  toMrPKilo,
} from './util';

/**
 * Status effects which should be omitted from the regular status list
 */
export function includeStatus(status: string, { removes } = { removes: false }): boolean {
  return (
    // En-Element is listed separately by our functions, following MrP's
    // example.
    !status.startsWith('Attach ') &&
    // Smart Ether and "reset" aren't real statuses.
    !status.match(/\b[Ss]mart\b.*\bether\b/) &&
    status !== 'reset' &&
    // Esuna and Dispel are handled separately - although the current, more
    // powerful status code could perhaps consolidate them.
    status !== 'positive effects' &&
    status !== 'negative effects' &&
    status !== 'positive status effects' &&
    status !== 'negative status effects' &&
    // This is an informational note rather than a real status.
    status !== 'damages undeads' &&
    // Revival is handled separately, in part so we can special-case the HP%.
    // Again, the current status code could perhaps consolidate.
    !(status.startsWith('KO ') && removes)
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

function parseWho(text: string): [string, string | undefined] {
  const m = text.match(
    /^(.*?)( to the user| to all allies(?: in the (?:front|back|character's) row)?)?$/,
  );
  const [, remainder, who] = m!;
  if (!who) {
    return [remainder, who];
  }
  return [
    remainder,
    who.match('user')
      ? undefined // No need to spell out "self" for, e.g., "hi fastcast 1"
      : who.match('front')
      ? 'front row'
      : who.match('back')
      ? 'back row'
      : who.match("character's")
      ? 'same row'
      : 'party',
  ];
}

/**
 * Hide durations for some statuses, like Astra, because that's typically
 * removed due to enemy action.  Hide Stun because it's effectively instant.
 */
const hideDuration = new Set(['Astra', 'Stun']);

const isExStatus = (status: string) => status.startsWith('EX: ');
const isAwakenStatus = (status: string) => status.startsWith('Awaken ');

interface FollowUpEffect {
  /**
   * Follow-up statuses granted.
   */
  statuses: string[] | undefined;

  /**
   * Follow-up skills that are cast.  Array support is currently only used for
   * Ace's Firaga BOM follow-up.
   */
  skills: string[] | undefined;

  /**
   * Follow-up individual status effects granted.
   */
  effects: string[] | undefined;

  /**
   * Who text for granted statuses and status effects
   */
  statusWho: string | undefined;

  randomSkills: boolean;
  customStatusesDescription?: string;

  trigger: string | null;
  isDamageTrigger: boolean;
  customTriggerSuffix?: string;
  triggerPrereqStatus?: string;

  /**
   * Auto interval, in seconds.  Either this or trigger is non-null.
   */
  autoInterval: number | null;
}

function checkCustomTrigger(enlirStatus?: EnlirStatus | null): string | undefined {
  if (enlirStatus && enlirStatus.effects.endsWith('removed after triggering')) {
    return 'once only';
  } else {
    return undefined;
  }
}

const followUpRe = XRegExp(
  String.raw`
  (?<allEffects>.*)\ #
  (?:after\ #
    (?<triggerType>using|dealing\ damage\ with|dealing|exploiting)\ #
    (?<trigger>.*?)
  |
    every\ (?<autoInterval>[0-9.]+)\ seconds
  )
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
  const { allEffects, triggerType, trigger, autoInterval } = match;

  let skills: string[] | undefined;
  let effects: string[] | undefined;
  let statuses: string[] | undefined;
  let statusWho: string | undefined;

  let randomSkills = false;
  let m: RegExpMatchArray | null;
  if ((m = allEffects.match(/([Rr]andomly )?[Cc]asts (.*?)(?:(?:,| and) grants|$)/))) {
    randomSkills = m[1] != null;
    skills = m[2].split(' / ');
  }
  if ((m = allEffects.match(/[Gg]rants (.*?)(?:(?:,| and) (?:randomly )?casts|$)/))) {
    let rawStatuses: string;
    [rawStatuses, statusWho] = parseWho(m[1]);
    statuses = rawStatuses.split(andList);
  }
  if (!skills && !statuses) {
    let rawEffects: string;
    [rawEffects, statusWho] = parseWho(allEffects);
    effects = rawEffects.split(andList);
  }

  // Hack: Auto-cast skills are currently only actual skills.  Make sure we
  // don't try to process regen, sap, etc.
  if (autoInterval && !skills) {
    return null;
  }

  return {
    skills,
    statuses,
    effects,
    statusWho,
    randomSkills,
    trigger,
    isDamageTrigger: triggerType === 'dealing damage with',
    customTriggerSuffix: checkCustomTrigger(enlirStatus),
    triggerPrereqStatus: match.triggerPrereqStatus || undefined,
    autoInterval: autoInterval ? parseFloat(autoInterval) : null,
  };
}

const isSameTrigger = (a: FollowUpEffect, b: FollowUpEffect) =>
  a.trigger === b.trigger && a.isDamageTrigger === b.isDamageTrigger;

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
    const thisStatusFollowUp = parseFollowUpEffect(thisStatus.effects);
    if (!thisStatusFollowUp) {
      break;
    }
    if (!isSameTrigger(followUp, thisStatusFollowUp)) {
      break;
    }
    // To be thorough, we'd also verify that the triggered name matches,
    // instead of assuming that they all follow the numbered sequence.

    const thisEffects = splitStatusEffects(thisStatus.effects).filter(
      i => !shouldSkipEffect(i) && !parseFollowUpEffect(i),
    );

    result.push([thisStatus, thisEffects]);
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

const isFinisherStatus = ({ effects }: EnlirStatus) => !!getFinisherSkillName(effects);
const isFollowUpStatus = ({ effects }: EnlirStatus) => !!parseFollowUpEffect(effects);

/**
 * "Mode" statuses are, typically, character-specific trances or EX-like
 * statuses provided by a single Ultra or Awakening soul break.
 */
const isModeStatus = ({ name, codedName }: EnlirStatus) =>
  (!!codedName.match(/_MODE/) && codedName !== 'BRAVE_MODE') ||
  (name.endsWith(' Mode') && name !== 'Brave Mode' && name !== 'Burst Mode');

/**
 * Various statuses for which we want to force showing individual effects.
 */
function forceEffects({ codedName }: EnlirStatus) {
  return codedName.startsWith('ABSORB_HP_');
}

/**
 * Various statuses which are specialized, verbose, and always self, so we show
 * them as "detail" instead of "self."
 */
function forceDetail({ name }: EnlirStatus) {
  return (
    name === 'Rage' ||
    name === 'Runic' ||
    name === 'High Runic' ||
    name === 'Sentinel' ||
    name === 'Unyielding Fist'
  );
}

function isBurstToggle({ effects }: EnlirStatus) {
  return effects.match(/affects certain burst commands/i) != null;
}

/**
 * Custom stat mods - Bushido, Dark Bargain, etc.  Omit turn-limited effects
 * here; it's easier to special case those within describeEnlirStatus than to
 * make describeEffects smart enough to handle them.
 */
const isCustomStatMod = ({ codedName, effects }: EnlirStatus) =>
  codedName.startsWith('CUSTOM_PARAM_') && !effects.match(/, lasts for \d+ turn/);

const percentToMultiplier = (percent: number) => 1 + percent / 100;

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

  if (enlirStatus && enlirStatus.codedName.startsWith('CUSTOM_')) {
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

/**
 * Describes a "well-known" or common Enlir status name.
 *
 * One-off statuses instead need to be looked up and their effects processed
 * via describeEnlirStatusEffect.
 */
export function describeEnlirStatus(
  status: string,
  enlirStatus?: EnlirStatus,
  source?: EnlirSkill,
) {
  let m: RegExpMatchArray | null;

  // Generic statuses
  {
    const genericStatus = resolveStatusAlias(status);
    if (genericStatus) {
      return genericStatus;
    }
  }

  // More special cases - schools + numbers
  if ((m = status.match(/(.+?) (?:Extended )?\+(\d+)% Boost\b(?: (\d+))?/))) {
    const [, type, percent, turns] = m;
    const multiplier = toMrPFixed(percentToMultiplier(+percent));
    if (type === 'Weakness') {
      return `${multiplier}x dmg vs weak` + formatTurns(turns);
    } else {
      return `${multiplier}x ${formatMediumList(type)} dmg` + formatTurns(turns);
    }
  }
  if ((m = status.match(/(.*) Gauge \+(\d+)% Booster(?: (\d+))?/))) {
    const [, type, percent, turns] = m;
    const multiplier = toMrPFixed(percentToMultiplier(+percent));
    return `${multiplier}x SB gauge from ${formatMediumList(type)}` + formatTurns(turns);
  }

  // Special cases - numbers that require processing, so they can't easily
  // merge with enlirStatusAliasWithNumbers
  if ((m = status.match(/HP Stock \((\d+)\)/))) {
    return 'Autoheal ' + toMrPKilo(+m[1]);
  } else if ((m = status.match(/Damage Cap (\d+)/))) {
    const [, cap] = m;
    return `dmg cap=${numberWithCommas(+cap)}`;
  } else if ((m = status.match(/Status Chance ([+-]\d+)%/))) {
    const [, percent] = m;
    const multiplier = toMrPFixed(percentToMultiplier(+percent));
    return `${multiplier}x status chance`;
  }

  // Status effects: e.g., "MAG +30%" from EX: Attack Hand.  Reorganize stats
  // into, e.g., +30% MAG to match MMP
  const statMod = statusAsStatMod(status, enlirStatus);
  if (statMod) {
    return statMod.amount + ' ' + describeStats(statMod.stat);
  }

  // Turn-limited versions of generic statuses.  Some turn-limited versions,
  // like 'hi fastcast 2', are common enough that they're separately listed
  // under enlirStatusAliasWithNumbers and omit the 'turn' text.
  if ((m = status.match(/(.*) (\d)$/))) {
    const [, baseStatus, turns] = m;
    const genericStatus = resolveStatusAlias(baseStatus);
    if (genericStatus) {
      return genericStatus + formatTurns(turns);
    }
  }

  if (status === 'Rage' && source) {
    const rageSkills = _.values(enlir.otherSkillsByName).filter(
      i => i.sourceType === 'Rage Status' && i.source.startsWith(source.name + ' ('),
    );
    const format = (skill: EnlirSkill) =>
      'auto ' +
      formatMrP(
        describeEnlirSoulBreak(skill, {
          abbreviate: true,
          showNoMiss: false,
        }),
      );
    if (rageSkills.length === 0) {
      return 'auto repeat';
    } else if (rageSkills.length === 1) {
      return format(rageSkills[0]);
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

  const mrP = describeEnlirSoulBreak(skill, { showNoMiss: false });

  return 'Finisher: ' + formatMrP(mrP, { showTime: false });
}

/**
 * Status effects that are too verbose to fit in a MrP style format.
 * @param effect
 */
function shouldSkipEffect(effect: string) {
  // "removed after using" is just for Ace's Top Card.
  // "removed if the user hasn't" describes USB effects that are paired
  // with other USB effects - when one is removed, the other is too.
  return (
    effect.startsWith('removed after using ') ||
    effect.startsWith("removed if the user hasn't") ||
    // Custom triggers
    effect.startsWith('removed after triggering')
  );
}

/**
 * Describes a single "status effect" - one fragment of an EnlirStatus effects string
 */
function describeEnlirStatusEffect(effect: string, enlirStatus?: EnlirStatus | null): string {
  let m: RegExpMatchArray | null;

  if (effect.startsWith('removed if')) {
    return '';
  }

  if (enlirStatus) {
    const followUp = parseFollowUpEffect(effect, enlirStatus);
    if (followUp) {
      const sequence = getFollowUpStatusSequence(enlirStatus.name, followUp);
      if (sequence) {
        followUp.statuses = sequence.map(([status, effects]) => status.name);
        followUp.customStatusesDescription = describeMergedSequence(sequence);
      }
      return describeFollowUp(followUp);
    }

    const finisherSkillName = getFinisherSkillName(effect);
    if (finisherSkillName) {
      return describeFinisher(finisherSkillName);
    }
  }

  // Generic status effects
  {
    const genericEffect = resolveEffectAlias(effect);
    if (genericEffect) {
      return genericEffect;
    }
  }

  // Special cases
  if ((m = effect.match(/((?:[A-Z]{3}(?:,? and |, ))*[A-Z]{3}) ([-+]\d+%)/))) {
    // Status effects: e.g., "MAG +30%" from EX: Attack Hand
    // Reorganize stats into, e.g., +30% MAG to match MrP
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

  if ((m = effect.match(/[Dd]ualcasts (.*) (?:abilities|attacks)/))) {
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

  // Handle ability boost and element boost.  The second form is only observed
  // with Noctis's non-elemental boosts; it may simply be an inconsistency.
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
    return boost + 'x ' + getMiddleName(schoolOrAbility) + ' dmg';
  }

  if ((m = effect.match(/[Ss]ets the damage cap for (.*) attacks to 99999/))) {
    return 'break ' + m[1] + ' dmg cap';
  }

  if ((m = effect.match(/[Rr]estores (\d+) HP/))) {
    const [, healHp] = m;
    return `heal ${toMrPKilo(+healHp)} HP`;
  }

  if (
    (m = effect.match(
      /[Cc]ast speed x([0-9.]+) plus x([0-9.]+) for each attack used for the duration of the status, up to x([0-9.]+)/,
    ))
  ) {
    const [, start, add, max] = m;
    const startN = toMrPFixed(+start);
    const addN = toMrPFixed(+add);
    const maxN = toMrPFixed(+max);
    const maxCount = Math.round((+max - +start) / +add);
    return `cast speed ${startN}x, +${addN}x per atk, max ${maxN}x @ ${maxCount} atks`;
  }

  // Cast speed for ability combinations - cast speed for individual ability
  // schools is handled as a simple effect alias.
  if ((m = effect.match(/([Cc]ast speed x[0-9.]+) for (.*?) (?:attacks|abilities)/))) {
    const [, baseEffect, kind] = m;
    const baseAlias = resolveEffectAlias(baseEffect);
    if (baseAlias) {
      return (
        kind
          .split(orList)
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

  if (shouldSkipEffect(effect)) {
    return '';
  }

  // Fallback
  return effect;
}

export interface ParsedEnlirStatus {
  description: string;
  isDetail: boolean;
  isExLike: boolean;
  isBurstToggle: boolean;
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
function describeEffects(enlirStatus: EnlirStatus): string {
  return splitStatusEffects(enlirStatus.effects)
    .map(i => describeEnlirStatusEffect(i, enlirStatus))
    .filter(i => i !== '')
    .join(', ');
}

/**
 * Check for a leading count on a string.  Handle both number strings, like
 * "Twenty-two," and threshold-type values, like "1/2/3".
 */
function extractCount(s: string): [number | string | null, string] {
  const m = s.match(/^(\S+) (.*)/);
  if (!m) {
    return [null, s];
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
    return [null, s];
  }
}

const slashOptionsRe = /(?:\w+\/)+\w+/;
function getSlashOptions(s: string): string[] | null {
  const m = s.match(slashOptionsRe);
  return m ? m[0].split('/') : null;
}
function expandSlashOptions(s: string): string[] {
  const options = getSlashOptions(s) || [];
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
    return 'hit weak';
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

  trigger = trigger
    .split(orList)
    .map(getShortName)
    .join('/');

  return (count ? count + ' ' : '') + trigger + (isDamageTrigger ? ' dmg' : '');
}

function describeFollowUpStatus(statusName: string): string {
  const status = getEnlirStatusByName(statusName);
  const options = getSlashOptions(statusName);
  if (!status && options) {
    const statusOptions = options.map(i => statusName.replace(slashOptionsRe, i));
    return slashMerge(statusOptions.map((i: string) => describeEnlirStatus(i, status)));
  }

  return describeEnlirStatus(statusName, status);
}

/**
 * For a follow-up that triggers a skill, describes the skill.
 */
function describeFollowUpSkill(skillName: string, triggerPrereqStatus?: string): string {
  const skill = enlir.otherSkillsByName[skillName];
  if (skill) {
    return formatMrP(
      describeEnlirSoulBreak(skill, {
        abbreviate: true,
        showNoMiss: false,
        prereqStatus: triggerPrereqStatus,
      }),
      {
        showTime: false,
      },
    );
  }

  const options = getSlashOptions(skillName);
  if (options) {
    const skillOptions = options.map(i => skillName.replace(slashOptionsRe, i));
    return slashMerge(
      skillOptions.map((i: string) => describeFollowUpSkill(i, triggerPrereqStatus)),
    );
  }

  return skillName;
}

/**
 * For follow-up statuses, returns a string describing the follow-up (how it's
 * triggered and what it does).
 */
function describeFollowUp(followUp: FollowUpEffect): string {
  let triggerDescription = followUp.autoInterval
    ? describeAutoInterval(followUp.autoInterval)
    : describeFollowUpTrigger(followUp.trigger!, followUp.isDamageTrigger);
  if (followUp.customTriggerSuffix) {
    triggerDescription += ' (' + followUp.customTriggerSuffix + ')';
  }

  const who = followUp.statusWho ? followUp.statusWho + ' ' : '';

  const description: string[] = [];

  if (followUp.customStatusesDescription) {
    description.push(followUp.customStatusesDescription);
  } else if (followUp.statuses) {
    description.push(who + followUp.statuses.map(describeFollowUpStatus).join(', '));
  }

  if (followUp.effects) {
    description.push(
      who + followUp.effects.map((i: string) => describeEnlirStatusEffect(i)).join(', '),
    );
  }

  if (followUp.skills) {
    description.push(
      followUp.skills
        .map((i: string) => describeFollowUpSkill(i, followUp.triggerPrereqStatus))
        .join(' – ') + (followUp.randomSkills ? ' (random)' : ''),
    );
  }

  return '(' + triggerDescription + ' ⤇ ' + description.join(', ') + ')';
}

function getSpecialDuration(enlirStatus: EnlirStatus): string | undefined {
  if (enlirStatus.effects.match(/, removed if the user doesn't have any Stoneskin/)) {
    return 'until Neg. Dmg. lost';
  } else {
    return undefined;
  }
}

/**
 * Parses a string description of an Enlir status name, returning details about
 * it and how it should be shown.
 */
export function parseEnlirStatus(status: string, source?: EnlirSkill): ParsedEnlirStatus {
  const enlirStatus = getEnlirStatusByName(status);
  if (!enlirStatus) {
    logger.warn(`Unknown status: ${status}`);
  }
  let description = describeEnlirStatus(status, enlirStatus, source);

  const isEx = isExStatus(status);
  const isAwaken = isAwakenStatus(status);
  const isExLike =
    isEx ||
    isAwaken ||
    (enlirStatus != null &&
      (isFinisherStatus(enlirStatus) ||
        isFollowUpStatus(enlirStatus) ||
        isModeStatus(enlirStatus)));

  if (enlirStatus && (isExLike || isCustomStatMod(enlirStatus) || forceEffects(enlirStatus))) {
    description = describeEffects(enlirStatus);
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
    isDetail: isExLike || (enlirStatus != null && forceDetail(enlirStatus)),
    isBurstToggle: enlirStatus != null && isBurstToggle(enlirStatus),
    defaultDuration: enlirStatus && !hideDuration.has(status) ? enlirStatus.defaultDuration : null,
    isVariableDuration: !!enlirStatus && !!enlirStatus.mndModifier,
    specialDuration: enlirStatus ? getSpecialDuration(enlirStatus) : undefined,
  };
}

interface ParsedEnlirStatusWithSlashes extends ParsedEnlirStatus {
  optionCount?: number;
}

export function parseEnlirStatusWithSlashes(
  status: string,
  source?: EnlirSkill,
): ParsedEnlirStatusWithSlashes {
  const enlirStatus = getEnlirStatusByName(status);
  if (status.match('/') && !enlirStatus) {
    const options = expandSlashOptions(status).map((i: string) => parseEnlirStatus(i, source));
    return {
      // Assume that most parameters are the same across options.
      ...options[0],

      description: slashMerge(options.map(i => i.description)),

      optionCount: options.length,
    };
  } else {
    return parseEnlirStatus(status, source);
  }
}

/**
 * A single status item within a list of skill effects - includes the status
 * name itself and possible additional parameters
 */
export interface StatusItem {
  statusName: string;
  chance?: number;
  who?: string;
  duration?: number;
  durationUnits?: string; // "second" or "turn"
  scalesWithUses?: boolean;
}

const statusItemRe = XRegExp(
  String.raw`
  (?<statusName>.*?)
  (?:\ \((?<chance>\d+)%\))?
  (?<scalesWithUses1>\ scaling\ with\ (?<scaleWithUsesSkill1>[A-Za-z ]+\ )?uses)?
  (?<who>
    \ to\ the\ user|
    \ to\ all\ allies|
    \ to\ the\ lowest\ HP%\ ally|
    \ to\ a\ random\ ally\ with\ negative\ (?:status\ )?effects
  )?
  (?:\ for\ (?<duration>\d+|\?)\ (?<durationUnits>second|turn)s?)?
  (?<scalesWithUses2>\ scaling\ with\ (?<scaleWithUsesSkill2>[A-Za-z ]+\ )?uses)?
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
export function parseStatusItem(statusText: string, wholeClause: string): StatusItem {
  // Determine target and duration.  This is hard, and I may not have it
  // right.  For example:
  // - "grants Haste and Burst mode to the user" - Haste is "to the user"
  // - "causes Imperil Fire 10% and DEF -50% for 15 seconds" - imperil is
  //   standard 25 seconds (I think)
  // - "grants Magical Blink 1, RES and MND +30% to the user for 25
  //   seconds" - m.blink is to the party, stat boosts are to the user

  const m = XRegExp.exec(statusText, statusItemRe);
  if (!m) {
    return { statusName: statusText };
  }

  const {
    statusName,
    chance,
    who,
    duration,
    durationUnits,
    scalesWithUses1,
    scalesWithUses2,
    scaleWithUsesSkill1,
    scaleWithUsesSkill2,
  } = (m as unknown) as XRegExpNamedGroups;

  let lookaheadWho: string | undefined;
  if (!who) {
    const lookahead = wholeClause.match(
      /( to the user| to all allies)(?! for \d+ (second|turn)s?)/,
    );
    if (lookahead) {
      lookaheadWho = lookahead[1];
    }
  }

  // Check if this scales with uses.  Hack: If it scales with the uses of
  // another skill, then assume that higher-level code will communicate that
  // (e.g., "powers up cmd 2".)
  const scalesWithUses =
    (scalesWithUses1 != null || scalesWithUses2 != null) &&
    scaleWithUsesSkill1 == null &&
    scaleWithUsesSkill2 == null;

  return {
    statusName: statusName!,
    chance: chance ? +chance : undefined,
    who: who || lookaheadWho,
    duration: duration ? +duration : undefined,
    durationUnits: durationUnits || undefined,
    scalesWithUses,
  };
}

export function formatDuration(duration: number, durationUnits: string) {
  if (durationUnits === 'second') {
    return duration + 's';
  } else if (duration === 1) {
    return '1 turn';
  } else {
    return duration + ' turns';
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

const getSortOrder = (status: string) => {
  if (isExStatus(status) || isAwakenStatus(status)) {
    return 999;
  } else {
    return statusSortOrder[status] || 0;
  }
};

export function sortStatus(a: StatusItem, b: StatusItem): number {
  return getSortOrder(a.statusName) - getSortOrder(b.statusName);
}

/**
 * Reducer function for handling statuses like "Beast and Father."  If a status
 * like that is split into two items, this function handles recognizing it as
 * one status and re-merging it.
 */
export function checkForAndStatuses(accumulator: StatusItem[], currentValue: StatusItem) {
  if (accumulator.length) {
    const thisAndThat =
      accumulator[accumulator.length - 1].statusName + ' and ' + currentValue.statusName;
    if (enlir.statusByName[thisAndThat]) {
      accumulator[accumulator.length - 1].statusName = thisAndThat;
      return accumulator;
    }
  }

  accumulator.push(currentValue);
  return accumulator;
}
