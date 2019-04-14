import * as _ from 'lodash';
import * as XRegExp from 'xregexp';

import { logger } from '../../utils/logger';
import {
  enlir,
  EnlirOtherSkill,
  EnlirSkill,
  EnlirStatus,
  getEnlirOtherSkill,
  getEnlirStatusByName,
} from '../enlir';
import { describeEnlirSoulBreak, formatMrP } from './index';
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
  splitNumbered,
} from './statusAlias';
import {
  formatSchoolOrAbilityList,
  getAbbreviation,
  getShortName,
  getShortNameWithSpaces,
  XRegExpNamedGroups,
} from './types';
import {
  andJoin,
  andList,
  cleanUpSlashedNumbers,
  describeChances,
  enDashJoin,
  lowerCaseFirst,
  orList,
  parseNumberString,
  percentToMultiplier,
  slashMerge,
  toMrPFixed,
  toMrPKilo,
} from './util';

const finisherText = 'Finisher: ';
export const hitWeaknessTriggerText = 'hit weak';
export const formatTriggeredEffect = (
  trigger: string,
  description: string,
  percent?: string | number,
) => '(' + trigger + ' ⤇ ' + (percent ? `${percent}% for ` : '') + description + ')';

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
    // "SB points" are not a real status, so we handle them separately.
    !status.match(/^\d+ (?:SB|Soul Break) points/) &&
    // This is an informational note rather than a real status.
    status !== 'damages undeads' &&
    // Revival is handled separately, in part so we can special-case the HP%.
    // Again, the current status code could perhaps consolidate.
    !(status.startsWith('KO ') && removes)
  );
}

export function describeStats(stats: string[]): string {
  return stats.join('/').replace(/^ATK\/DEF\/MAG\/RES/, 'A/D/M/R');
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
 * removed due to enemy action.  Hide Stun because it's effectively instant.
 */
const hideDuration = new Set(['Astra', 'Stun']);

const isExStatus = (status: string) => status.startsWith('EX: ');
const isAwokenStatus = (status: string) =>
  status.startsWith('Awoken ') && status !== 'Awoken Scholar Critical Chance';

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
  customTriggerSuffix?: string;
  triggerPrereqStatus?: string;
  customSkillSuffix?: string;

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
  (?:(?<chance>\d+)%\ chance\ to\ )?
  (?<allEffects>.*)\ #
  (?:after\ #
    (?<triggerType>using|dealing\ damage\ with|dealing|exploiting|taking\ (?<takeDamageTrigger>.*?)\ damage)\ #
    (?<trigger>.*?)
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
  if ((m = allEffects.match(/[Gg]rants (.*?)(?:(?:,| and) (?:randomly )?casts|$)/))) {
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

const isFinisherStatus = ({ effects }: EnlirStatus) => !!getFinisherSkillName(effects);
const isFollowUpStatus = ({ effects }: EnlirStatus) => !!parseFollowUpEffect(effects);

/**
 * "Mode" statuses are, typically, character-specific trances or EX-like
 * statuses provided by a single Ultra or Awakening soul break.
 */
const isModeStatus = ({ name, codedName, effects }: EnlirStatus) =>
  (!!codedName.match(/_MODE/) && codedName !== 'BRAVE_MODE') ||
  (name.endsWith(' Mode') && name !== 'Brave Mode' && name !== 'Burst Mode') ||
  // Specialized counter-attacks
  (codedName.startsWith('COUNTER_AIMING') && name !== 'Retaliate' && name !== 'High Retaliate') ||
  // Rage statuses
  effects.match(/[Ff]orces a specified action/) != null ||
  // Special cases - treat as a mode to give it more room for its description.
  name === 'Haurchefant Cover';

/**
 * Various usual statuses for which we want to force showing individual
 * effects.
 */
function forceEffects({ name, codedName }: EnlirStatus) {
  return (
    codedName.startsWith('ABSORB_HP_') ||
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
  (codedName.startsWith('CUSTOM_PARAM_') && !effects.match(/, lasts for \d+ turn/)) ||
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

export function getRageSkills(source: EnlirSkill): EnlirOtherSkill[] {
  return enlir.otherSkills.filter(
    i => i.sourceType === 'Rage Status' && i.source.startsWith(source.name + ' ('),
  );
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

  // Special cases - schools, and schools + numbers
  if ((m = status.match(/(.+?) (?:Extended )?\+(\d+)% Boost\b(?: (\d+))?/))) {
    const [, type, percent, turns] = m;
    const multiplier = percentToMultiplier(percent);
    if (type === 'Weakness') {
      return `${multiplier}x dmg vs weak` + formatTurns(turns);
    } else {
      return `${multiplier}x ${formatSchoolOrAbilityList(type)} dmg` + formatTurns(turns);
    }
  }
  if ((m = status.match(/(.*) Gauge \+(\d+)% Booster(?: (\d+))?/))) {
    const [, type, percent, turns] = m;
    const multiplier = percentToMultiplier(percent);
    return `${multiplier}x SB gauge from ${formatSchoolOrAbilityList(type)}` + formatTurns(turns);
  }
  if ((m = status.match(/(.*) Double/))) {
    return doubleAlias(formatSchoolOrAbilityList(m[1]));
  }

  // Status effects: e.g., "MAG +30%" from EX: Attack Hand.  Reorganize stats
  // into, e.g., +30% MAG to match MMP
  const statMod = statusAsStatMod(status, enlirStatus);
  if (statMod) {
    let result = statMod.amount + ' ' + describeStats(statMod.stat);
    if (status.match(/for Next Damaging Action/)) {
      result += ' for next atk';
    }
    return result;
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

  // Fallback
  return status;
}

const getFinisherSkillName = (effect: string) => {
  const m = effect.match(/[Cc]asts (.*?) when removed/);
  return m ? m[1] : null;
};

function describeFinisher(skillName: string, sourceStatusName: string) {
  const skill = getEnlirOtherSkill(skillName, sourceStatusName);
  if (!skill) {
    logger.warn(`Unknown finisher skill ${skill}`);
    return skillName;
  }

  const mrP = describeEnlirSoulBreak(skill, { showNoMiss: false, includeSbPoints: false });

  return finisherText + formatMrP(mrP, { showTime: false });
}

/**
 * Status effects that are too verbose to fit in a MrP style format or should
 * otherwise be skipped.
 * @param effect
 */
function shouldSkipEffect(effect: string) {
  return (
    // "removed after using" is just for Ace's Top Card.
    // "removed if the user hasn't" describes USB effects that are paired
    // with other USB effects (when one is removed, the other is too) and for
    // leaving Burst Mode.
    effect.startsWith('removed after using ') ||
    effect.startsWith("removed if the user hasn't") ||
    effect === 'reset upon refreshing Burst Mode' ||
    // Custom triggers
    effect.startsWith('removed after triggering') ||
    // Burst toggles - we communicate this via a separate flag
    effect.match(/[Aa]ffects certain Burst Commands/) ||
    // Status details
    effect === 'affects targeting' ||
    effect === 'resets ATB when removed'
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
      return describeFinisher(finisherSkillName, enlirStatus.name);
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
    return rankBoostAlias(m[1]);
  }
  if ((m = effect.match(enlirRankCastSpeedRe))) {
    return rankCastSpeedAlias(m[1]);
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
    return formatTriggeredEffect(
      triggerDescription,
      describeFollowUpSkill(skill, undefined, enlirStatus ? enlirStatus.name : undefined),
    );
  }

  // Rage status.  This involves looking up the Other Skills associated with
  // the Rage status's source and filling in their effects.
  if (effect.match(/[Ff]orces a specified action/) && source) {
    const rageSkills = getRageSkills(source);
    const format = (skill: EnlirSkill) =>
      formatMrP(
        describeEnlirSoulBreak(skill, {
          abbreviate: true,
          showNoMiss: false,
        }),
      );
    if (rageSkills.length === 0) {
      // Does not appear to actually be used.
      return 'auto repeat';
    } else if (rageSkills.length === 1) {
      return 'auto ' + format(rageSkills[0]);
    } else {
      // Fall back to 0% chance just to avoid special cases...
      const chances = rageSkills.map(i => i.source.match(/\((\d+)%\)$/)).map(i => (i ? +i[1] : 0));
      const result = describeChances(rageSkills.map(format), chances, enDashJoin);
      return 'auto ' + _.filter(result).join(' ');
    }
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
    return hitWeaknessTriggerText;
  }
  if (trigger === 'a single-target heal') {
    return 'ally heal';
  }

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
    description += ' ' + formatDuration(duration, durationUnits);
  }

  return description;
}

function describeFollowUpStatus(item: StatusItem): string {
  const { statusName } = item;
  const status = getEnlirStatusByName(statusName);
  const options = getSlashOptions(statusName);

  let result: string;
  if (!status && options) {
    const statusOptions = options.map(i => statusName.replace(slashOptionsRe, i));
    result = slashMerge(statusOptions.map((i: string) => describeEnlirStatus(i, status)));
  } else {
    result = describeEnlirStatus(statusName, status);
  }

  return describeFollowUpItem(item, result);
}

function describeFollowUpEffect(item: StatusItem): string {
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
    return formatMrP(
      describeEnlirSoulBreak(skill, {
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
    const skillOptions = options.map(i => skillName.replace(slashOptionsRe, i));
    return slashMerge(
      skillOptions.map((i: string) =>
        describeFollowUpSkill(i, triggerPrereqStatus, sourceStatusName),
      ),
    );
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

  return formatTriggeredEffect(
    triggerDescription,
    description.join(', ') +
      // Append the custom trigger to the end of the description - although we
      // say that text like "(once only)" describes the trigger, the end works
      // better for AASBs like Gladiolus's, where "once only" only applies to
      // the final threshold, and we show thresholds as part of the
      // description.
      (followUp.customTriggerSuffix ? ' (' + followUp.customTriggerSuffix + ')' : ''),
    followUp.chance,
  );
}

function getSpecialDuration({ effects }: EnlirStatus): string | undefined {
  let m: RegExpMatchArray | null;
  if (effects.match(/, removed if the user doesn't have any Stoneskin/)) {
    return 'until Neg. Dmg. lost';
  } else if (effects.match(/, removed upon taking damage/)) {
    return 'until damaged';
  } else if ((m = effects.match(/, lasts (\d+) turns?(?:$|,)/))) {
    return formatDuration(+m[1], 'turn');
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
    description = describeEffects(enlirStatus, source);
    if (isEx) {
      description = 'EX: ' + description;
    }
    if (isAwoken) {
      description = status + ': ' + description;
    }
  }

  return {
    description,
    isExLike,
    isDetail: isExLike || (enlirStatus != null && forceDetail(enlirStatus)),
    isBurstToggle: burstToggle,
    isTrance: enlirStatus != null && isTranceStatus(enlirStatus),
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
 */
export interface StatusItem {
  statusName: string;
  chance?: number;
  who?: string;
  duration?: number;
  durationUnits?: string; // "second" or "turn"
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
  (?:\ if\ the\ user\ has\ (?<prereq>.*))?
  (?:\ if\ (?<characterInParty>.*?)\ (?:is|are)\ in\ the\ party)?
  (?<weakness>\ if\ exploiting\ elemental\ weakness)?
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
  }

  return {
    statusName: statusName!,
    chance: chance ? +chance : undefined,
    who: who || lookaheadWho,
    duration: duration ? +duration : undefined,
    durationUnits: durationUnits || undefined,
    scalesWithUses,
    rank: rank != null,
    stacking,
    condition,
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
  if (isExStatus(status) || isAwokenStatus(status)) {
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
