import * as _ from 'lodash';

import { logException, logger } from '../../utils/logger';
import { arrayify, assertNever, isAllSame } from '../../utils/typeUtils';
import {
  enlir,
  EnlirElement,
  EnlirSchool,
  EnlirSkill,
  EnlirTarget,
  getEffects,
  getEnlirArcaneDyadLevel,
  getEnlirArcaneDyadTracker,
  getNormalSBPoints,
  isAbility,
  isBraveCommand,
  isBraveSoulBreak,
  isBurstCommand,
  isBurstSoulBreak,
  isEnlirElement,
  isGlint,
  isSoulBreak,
  isSynchroCommand,
  isSynchroSoulBreak,
  isPart1SoulBreak,
  isPart2SoulBreak,
  isLimitBreak,
  isArcaneDyad,
  stringifySkill,
} from '../enlir';
import {
  describeAttack,
  describeFixedAttack,
  describeGravityAttack,
  describeHpAttack,
  describeRandomFixedAttack,
  formatAttackStatusChance,
  formatRandomCastAbility,
  formatRandomCastOther,
} from './attack';
import * as common from './commonTypes';
import {
  appendCondition,
  describeCondition,
  excludeCondition,
  findCondition,
  visitCondition,
} from './condition';
import { checkPureRage } from './rage';
import * as skillParser from './skillParser';
import * as skillTypes from './skillTypes';
import {
  appendComplexStatusDescription,
  formatDuration,
  isComplexStatusList,
  isTranceStatus,
  mergeSimilarStatuses,
  ParsedEnlirStatusWithSlashes,
  parseEnlirStatus,
  parseEnlirStatusItem,
  resolveStatuses,
  sortStatus,
} from './status';
import {
  formatDispelOrEsuna,
  formatHealPercent,
  formatRandomEther,
  formatSmartEther,
  formatSpecialStatusItem,
  formatStatusLevel,
  sbPointsAlias,
} from './statusAlias';
import {
  appendPerUses,
  DescribeOptions,
  formatWho,
  getDescribeOptionsWithDefaults,
  getElementShortName,
} from './typeHelpers';
import {
  fixedNumberOrUnknown,
  formatNumberSlashList,
  formatUseCount,
  numberOrUnknown,
  stringSlashList,
  toMrPFixed,
  toMrPKilo,
} from './util';

// Support for "simple skills" - inline skill effects from legend materia that
// don't have a full EnlirSkill object.
export type SimpleSkill = 'simple';

function preprocessSkill(
  skill: skillTypes.SkillEffect,
  source: EnlirSkill,
): skillTypes.SkillEffect {
  for (const i of skill) {
    if (i.type === 'status') {
      i.statuses = mergeSimilarStatuses(resolveStatuses(i.statuses, source), i.condition);
    }
    if ('condition' in i && i.condition && i.condition.type === 'statusList') {
      i.condition.status = mergeSimilarStatuses(
        resolveStatuses(arrayify(i.condition.status), source),
      );
    }
  }
  return skill;
}

export function safeParseSkill(skill: EnlirSkill): skillTypes.SkillEffect | null {
  try {
    return preprocessSkill(skillParser.parse(getEffects(skill)), skill);
  } catch (e) {
    logger.error(`Failed to parse ${skill.name}:`);
    logException(e);
    if (e.name === 'SyntaxError') {
      return [{type: 'fallback'}];
    }
    throw e;
  }
}

function findFirstEffect<T extends skillTypes.EffectClause>(
  skillEffects: skillTypes.SkillEffect,
  type: T['type'],
): T | undefined {
  for (const i of skillEffects) {
    if (i.type === type) {
      return i as T;
    }
  }
  return undefined;
}

function describeChain({ chainType, fieldBonus, max }: skillTypes.Chain): string {
  let chain = (isEnlirElement(chainType) ? getElementShortName(chainType) : chainType) + ' chain';
  chain += ' ' + toMrPFixed(1 + +fieldBonus / 100) + 'x';
  chain += ` (max ${max})`;
  return chain;
}

export function describeDrainHp({ healPercent, condition }: skillTypes.DrainHp): string {
  return `heal ${numberOrUnknown(healPercent)}% of dmg` + appendCondition(condition);
}

export function describeHeal(
  skill: EnlirSkill | SimpleSkill,
  { amount, condition, overrideSkillType, perUses }: skillTypes.Heal,
): string {
  let heal: string;
  let count: number | number[] | undefined;
  if ('healFactor' in amount) {
    heal = 'h' + formatNumberSlashList(amount.healFactor);
    count = amount.healFactor;
  } else {
    heal = 'heal ' + formatNumberSlashList(amount.fixedHp, i => toMrPKilo(i, true));
    count = amount.fixedHp;
  }
  const skillType = overrideSkillType || (skill !== 'simple' && skill.type) || undefined;
  if ('healFactor' in amount && skillType === 'NAT') {
    heal += ' (NAT)';
  }
  heal += appendCondition(condition, count);
  heal += appendPerUses(perUses);
  return heal;
}

export function describeMimic(
  skill: EnlirSkill | undefined,
  { chance, count }: skillTypes.Mimic,
): string {
  let description = 'Mimic';

  // For brave commands in particular, we'll want to compare with other
  // numbers, so always include the count.
  count = count || 1;
  if (count > 1 || (skill && isBraveCommand(skill))) {
    description += ` ${count || 1}x`;
  }

  if (chance) {
    description = `${chance}% chance of ` + description;
  }

  return description;
}

export function describeRecoilHp({
  damagePercent,
  maxOrCurrent,
  condition,
}: skillTypes.RecoilHp): string {
  return (
    `lose ${formatNumberSlashList(damagePercent)}% ${maxOrCurrent} HP` + appendCondition(condition)
  );
}

export function describeRecoilSetHp({ hp, condition }: skillTypes.RecoilSetHp): string {
  return `HP to ${hp}` + appendCondition(condition);
}

export function describeFixedRecoilHp({ value }: skillTypes.FixedRecoilHp): string {
  // Omit skillType; it seems unnecessary.
  return `lose ${value} HP`;
}

function findOtherSkill(skill: EnlirSkill, otherSkills: EnlirSkill[] | undefined) {
  if (!otherSkills) {
    return null;
  }
  const index = _.findIndex(otherSkills, i => i !== skill);
  if (index !== -1) {
    return {
      skill: otherSkills[index],
      index,
    };
  }
  return null;
}

function scalesWithSkill(skill: EnlirSkill): (condition: skillTypes.Condition) => boolean {
  return (condition: skillTypes.Condition) =>
    condition.type === 'scaleWithSkillUses' && condition.skill === skill.name;
}

/**
 * Checks if this skill powers up its paired skill (cmd 1/2 if this is cmd 2/1
 * of a burst soul break or synchro soul break).  We represent that a bit
 * differently - instead of saying that cmd 2 scales with cmd 1, we say that
 * cmd 1 powers up cmd 2.  (We do this partly because that's what MrP did and
 * partly because cmd 1 tends to be shorter.)
 */
function checkPowersUp(skill: EnlirSkill, opt: DescribeOptions): string | null {
  const paired =
    findOtherSkill(skill, opt.burstCommands) || findOtherSkill(skill, opt.synchroCommands);
  if (!paired) {
    return null;
  }

  const pairedEffects = safeParseSkill(paired.skill);
  if (!pairedEffects) {
    return null;
  }

  if (findCondition(pairedEffects, scalesWithSkill(skill))) {
    return `powers up cmd ${paired.index + 1}`;
  } else {
    return null;
  }
}

/**
 * See checkPowersUp.  This also handles the case where one command is affected
 * by a non-standard status from the other command. (The "Unbound Fury" status
 * used by some monk characters' bursts is the main or only example.)
 */
function checkPoweredUpBy(
  skill: EnlirSkill,
  effects: skillTypes.SkillEffect,
  opt: DescribeOptions,
) {
  // Find the paired command
  const paired =
    findOtherSkill(skill, opt.burstCommands) || findOtherSkill(skill, opt.synchroCommands);
  if (!paired) {
    return;
  }

  // Remove all references to this skill scaling with the paired command; let
  // checkPowersUp handle that instead.
  excludeCondition(effects, scalesWithSkill(paired.skill));

  const pairedEffects = safeParseSkill(paired.skill);
  if (!pairedEffects) {
    return;
  }

  // Check if this skill scales with itself and if we can reasonably omit the
  // skill name.
  visitCondition((condition: skillTypes.Condition) => {
    if (condition.type === 'afterUseCount' && condition.skill === skill.name) {
      return [
        {
          ...condition,
          skill: undefined,
        },
        true,
      ];
    } else {
      return [null, true];
    }
  }, effects);

  // Check if this skill scales with a nonstandard status granted by the paired
  // command.  Don't do this for SASBs; those are better handled as status
  // levels.
  if (!isSynchroCommand(skill)) {
    let pairedStatus: string | undefined;
    for (const i of pairedEffects) {
      if (i.type === 'status' && i.who === 'self') {
        for (const j of i.statuses) {
          if (j.status.type === 'standardStatus') {
            pairedStatus = j.status.name;
            break;
          }
        }
        if (pairedStatus) {
          break;
        }
      }
    }
    if (!pairedStatus) {
      return;
    }
    visitCondition((condition: skillTypes.Condition) => {
      if (
        condition.type === 'status' &&
        condition.status === pairedStatus &&
        condition.who === 'self'
      ) {
        return [{ ...condition, status: `cmd ${paired.index + 1} status` }, false];
      } else {
        return [null, true];
      }
    }, effects);
  }
}

function checkSbPoints(skill: EnlirSkill, effects: skillTypes.SkillEffect, opt: DescribeOptions) {
  if ('sb' in skill && skill.sb != null) {
    if (opt.includeSbPoints && skill.sb === 0) {
      // If we weren't asked to suppress SB points (which we do for follow-ups
      // and finishers, since those don't generate gauge), then call out
      // anything that doesn't generate gauge.
      return 'no SB pts';
    } else if (skill.sb >= 120) {
      // If this skill grants an abnormally high number of SB points, show it.
      // We set a flat rate of 120 (to include Tyro's Hero Ability) instead of
      // trying to track what's normal at each rarity level.
      return sbPointsAlias(skill.sb);
    } else if (isAbility(skill) && skill.sb < getNormalSBPoints(skill)) {
      // Special case: Exclude abilities like Lightning Jab that have a normal
      // default cast time but "fast" tier SB generation because they
      // manipulate cast time.
      if (!effects.find(i => i.type === 'castTime' || i.type === 'castTimePerUse')) {
        return 'low SB pts';
      }
    }
  }

  return null;
}

function checkAttackStatus(skill: EnlirSkill, { status }: skillTypes.Attack, other: OtherDetail) {
  if (!status) {
    return;
  }
  const { description, defaultDuration } = parseEnlirStatus(status.status, skill);
  const duration =
    status.duration || (defaultDuration ? { value: defaultDuration, units: 'seconds' } : undefined);
  // Semi-hack: Attack statuses are usually or always imperils, and text
  // like '35% +10% fire vuln.' looks weird.  Like MrP, we insert a 'for'
  // to make it a bit clearer.
  other.statusInfliction.push({
    description: 'for ' + description + (duration ? ' ' + formatDuration(duration) : ''),
    chance: status.chance,
    chanceDescription: formatNumberSlashList(status.chance) + '%',
  });
}

function checkTime(skill: EnlirSkill, result: MrPSkill) {
  if (skill.time != null) {
    const time = skill.time;
    if (time <= 0.01) {
      result.instant = true;
    } else if (time < 1.2 || (isSoulBreak(skill) && time <= 1.25)) {
      result.fast = true;
    } else if (time >= 3.75 || (!isSoulBreak(skill) && time > 2)) {
      result.slow = true;
    }
  }
}

function checkBurstCommands(skill: EnlirSkill, result: MrPSkill) {
  if (
    isSoulBreak(skill) &&
    isBurstSoulBreak(skill) &&
    skill.character &&
    enlir.burstCommandsByCharacter[skill.character] &&
    enlir.burstCommandsByCharacter[skill.character][skill.name]
  ) {
    const burstCommands = enlir.burstCommandsByCharacter[skill.character][skill.name];
    result.burstCommands = burstCommands.map(i =>
      convertEnlirSkillToMrP(i, { abbreviate: true, includeSchool: false, burstCommands }),
    );
  }
}

function checkBraveCommands(skill: EnlirSkill, result: MrPSkill) {
  if (
    isSoulBreak(skill) &&
    isBraveSoulBreak(skill) &&
    skill.character &&
    enlir.braveCommandsByCharacter[skill.character] &&
    enlir.braveCommandsByCharacter[skill.character][skill.name]
  ) {
    const braveCommands = enlir.braveCommandsByCharacter[skill.character][skill.name];
    result.braveCondition = braveCommands[0].braveCondition;
    result.braveCommands = braveCommands.map(i =>
      convertEnlirSkillToMrP(i, { abbreviate: true, includeSchool: false }),
    );
  }
}

function checkSynchroCommands(skill: EnlirSkill, result: MrPSkill) {
  if (
    isSoulBreak(skill) &&
    isSynchroSoulBreak(skill) &&
    skill.character &&
    enlir.synchroCommandsByCharacter[skill.character] &&
    enlir.synchroCommandsByCharacter[skill.character][skill.name]
  ) {
    const synchroCommands = enlir.synchroCommandsByCharacter[skill.character][skill.name];
    result.synchroCondition = synchroCommands.map(i => i.synchroCondition);
    result.synchroCommands = synchroCommands.map(i =>
      convertEnlirSkillToMrP(i, { abbreviate: true, includeSchool: false, synchroCommands }),
    );
  }
}

function checkGuardianCommands(skill: EnlirSkill, result: MrPSkill) {
  if (
    isLimitBreak(skill) &&
    skill.tier === 'LBGS' &&
    skill.character &&
    enlir.guardianCommandsByCharacter[skill.character] &&
    enlir.guardianCommandsByCharacter[skill.character][skill.name]
  ) {
    const guardianCommands = enlir.guardianCommandsByCharacter[skill.character][skill.name];
    result.guardianCommands = guardianCommands.map(i =>
      convertEnlirSkillToMrP(i, { abbreviate: true, includeSchool: false, includeSbPoints: false }),
    );
  }
}

/**
 * For burst and synchro commands that have multiple variants, like Ignis or
 * Alphinaud, this identifies the particular version.
 */
export function getCommandDetail(skillName: string) {
  let m = skillName.match(/\((.*)\)$/);
  if (!m) {
    return undefined;
  }
  const detail = m[1];

  if (detail === 'S') {
    return 'if ON';
  }

  let status = enlir.statusByName[detail];
  if (status && isTranceStatus(status)) {
    return 'Trance';
  }

  if (detail.startsWith('No ')) {
    status = enlir.statusByName[detail.replace(/^No /, '')];
    if (status && isTranceStatus(status)) {
      return 'no Trance';
    }
  }

  m =
    detail.match(/^([0-9/+]+) [A-Z][A-Za-z .]+$/) || detail.match(/^[A-Z][A-Za-z .]+ ([0-9/+]+)$/);
  if (m) {
    return m[1] + ' status lvl';
  }

  return undefined;
}

function shouldIncludeStatus(skill: EnlirSkill | SimpleSkill, effect: skillTypes.StatusEffect) {
  const isBurst = skill !== 'simple' && isSoulBreak(skill) && isBurstSoulBreak(skill);
  return ({ status, chance }: common.StatusWithPercent): boolean => {
    if (status.type !== 'standardStatus') {
      return true;
    }

    // Enlir lists Burst Mode and Haste for all BSBs and lists Brave Mode for all
    // all Brave Ultra Soul Breaks, but MrP's format doesn't.
    if (
      status.name === 'Brave Mode' ||
      status.name === 'Burst Mode' ||
      status.name === 'Synchro Mode'
    ) {
      return false;
    }
    if (
      isBurst &&
      status.name === 'Haste' &&
      (effect.who === 'self' || (!effect.who && skill !== 'simple' && skill.target === 'Self'))
    ) {
      // All burst soul breaks provide Haste, so listing it is redundant.
      return false;
    }

    // noinspection RedundantIfStatementJS
    if (status.name === 'Instant KO' && effect.ifUndead && chance === 100) {
      // Raise effects cause instant KO to undead, but that's fairly niche; omit.
      return false;
    }

    return true;
  };
}

/**
 * Checks for stacking statuses, like "Warlord Mode 1/2/3/3 if the user has
 * Warlord Mode 0/1/2/3"
 */
function checkStacking(
  effect: skillTypes.StatusEffect,
  status: common.StatusWithPercent,
): [common.StatusItem, boolean] {
  if (
    status.status.type !== 'standardStatus' ||
    !effect.condition ||
    effect.condition.type !== 'status'
  ) {
    return [status.status, false];
  }

  // Enlir lists, e.g., 'Warlord Mode 1/2/3/3' to show that it doesn't stack
  // further.  Remove the redundancy.  We used to have logic here to remove that
  // redundancy, but it fits poorly with the new resolveStatuses /
  // mergeSimilarStatuses code, and it's not worth the complexity.
  const prereq = effect.condition.status;
  const isStacking =
    typeof prereq === 'string' &&
    status.status.name.replace(/[0-9/]+/, 'X') === prereq.replace(/[0-9/]+/, 'X');

  return [status.status, isStacking];
}

function formatStatusDescription(
  parsed: ParsedEnlirStatusWithSlashes,
  verb: common.StatusVerb | undefined,
  duration?: common.Duration,
  condition?: common.Condition,
  stacking = false,
) {
  const {
    isExLike,
    isTrance,
    defaultDuration,
    isVariableDuration,
    isBurstToggle,
    optionCount,
  } = parsed;
  let description = parsed.description;

  // Special duration, including handling for a burst toggle with effects of
  // its own.
  const specialDuration = isBurstToggle ? 'until OFF' : parsed.specialDuration;

  if (isTrance) {
    // For Garnet's Period Thunder - assume that at trance removal is part of a
    // larger soul break that's already manipulating trances, so abbreviate it.
    if (verb === 'removes') {
      description = 'Trance';
    } else {
      description = 'Trance: ' + description;
    }
  }
  if (stacking) {
    description = 'stacking ' + description;
  }

  if (condition && !stacking) {
    const options = optionCount ? _.times(optionCount, i => i + 1) : undefined;
    description += appendCondition(condition, options);
  }

  if (verb !== 'removes') {
    if (!duration && defaultDuration) {
      duration = { value: defaultDuration, units: 'seconds' };
    }

    if ((duration || specialDuration) && !isVariableDuration) {
      const durationText = specialDuration || formatDuration(duration!);
      if (isExLike) {
        description = durationText + ': ' + description;
      } else {
        description = description + ' ' + durationText;
      }
    }
  }

  return description;
}

/**
 * Process a status, and return whether this is a burst toggle.
 */
export function processSkillStatus(
  sourceSkill: EnlirSkill | SimpleSkill,
  skillEffects: skillTypes.SkillEffect,
  effect: skillTypes.StatusEffect,
  other: OtherDetail,
  summonName?: string,
): boolean | undefined {
  // Confuse Shell doesn't remove Confuse - this is a special case, skip.
  if (effect.verb === "doesn't remove") {
    return;
  }

  let burstToggle: boolean | undefined = undefined;

  const skill = sourceSkill === 'simple' ? undefined : sourceSkill;
  const removes = effect.verb === 'removes';
  const statuses = effect.statuses
    .filter(shouldIncludeStatus(sourceSkill, effect))
    .sort(sortStatus);
  let { who, condition, perUses, ifSuccessful, toCharacter } = effect;

  if (
    toCharacter &&
    condition &&
    condition.type === 'characterAlive' &&
    (!condition.character || condition.character === toCharacter)
  ) {
    condition = undefined;
  }

  // Complex combinations of statuses, like "[A1] and [B1]/[A2] and [B2]/[A3]
  // and [B3] and [C] if 1/2/3", need special handling.
  let complex = '';
  let complexCount = 0;
  const isComplex = isComplexStatusList(statuses);
  if (isComplex) {
    complexCount = statuses.filter(i => i.conj === '/').length + 1;
  }

  let lastItem: string[] | undefined;
  statuses.forEach((thisStatus, thisStatusIndex) => {
    // Special case: "Retaliate and High Retaliate" are common enough that
    // we simplify them by omitting "High Retaliate."
    if (
      effect.who === 'self' &&
      removes &&
      thisStatus.status.type === 'standardStatus' &&
      thisStatus.status.name === 'High Retaliate' &&
      thisStatusIndex > 0
    ) {
      const prevStatus = statuses[thisStatusIndex - 1];
      if (prevStatus.status.type === 'standardStatus' && prevStatus.status.name === 'Retaliate') {
        return;
      }
    }

    const [status, stacking] = checkStacking(effect, thisStatus);

    // If this is the last status, then append details of the whole status
    // effect.
    const isLast = thisStatusIndex + 1 === statuses.length;

    // Special case: Since every ADSB clears its associated mode, omit that.
    if (who === 'self' && removes && skill && isSoulBreak(skill) && isArcaneDyad(skill) && isPart2SoulBreak(skill)) {
      return;
    }

    // Similar to ADSB, the second DASB trigger removes the first, so ignore it.
    if (status.type === 'standardStatus' && removes && status.name.startsWith("Dual Awoken")) {
      return;
    }
    
    if (status.type !== 'standardStatus') {
      // Status levels are always self.
      other.push(
        sourceSkill,
        status.type === 'statusLevel' ? 'self' : who,
        formatSpecialStatusItem(status, removes ? 0 : undefined),
      );
      return;
    }

    // Special case: Omit / simplify some ADSB details, and handle others via
    // describeTrueArcaneCondition.
    if (skill && isSoulBreak(skill) && isArcaneDyad(skill) && isPart1SoulBreak(skill)) {
      const tracker = getEnlirArcaneDyadTracker(skill);
      const level = getEnlirArcaneDyadLevel(skill);
      if ((tracker && tracker.id === status.id) || (level && level.id === status.id)) {
        return;
      }
    }

    if (skill && 'source' in skill && skill.source === status.name && removes) {
      // TODO: Some inconsistency here between "(once only)", "removes status", and "once only"
      // See, e.g., Enna Kros vs. Cloud vs. Cyan AASBs.
      const onceOnly =
        effect.condition && effect.condition.type === 'afterUseCount'
          ? formatUseCount(effect.condition.useCount) + 'x only'
          : 'once only';
      if (other.self.length) {
        other.self.push(onceOnly);
      } else {
        other.normal.push(onceOnly);
      }
      return;
    }

    const parsed = parseEnlirStatusItem(status, skill);
    const { isDetail, isBurstToggle } = parsed;

    if (isBurstToggle) {
      burstToggle = effect.verb !== 'removes';
      if (parsed.description === '') {
        return;
      }
      // Special case: A burst toggle with an effect of its own.  If we're
      // switching it ON, show it with a custom duration.  If switching OFF,
      // show nothing.
      if (!burstToggle) {
        return;
      }
    }

    if (parsed.description === '') {
      return;
    }

    let description = formatStatusDescription(
      parsed,
      effect.verb,
      thisStatus.duration,
      isLast && !isComplex ? condition : undefined,
      stacking,
    );

    // Status removal.  In practice, only a few White Magic abilities hit
    // this; the rest are special cased (Esuna, burst toggles, etc.).
    //
    // Hack: Text like "removes negative effects, +100% DEF" is actually
    // a removes then grants.  There are no occurrences of "removes A, B" in
    // the spreadsheet, so we can key off of the status index to handle that.
    if (removes && thisStatusIndex === 0) {
      description = (parsed.statusLevel ? 'reset ' : 'remove ') + description;
      if (parsed.statusLevel) {
        who = 'self';
      }
    }

    if (isLast) {
      description += appendPerUses(perUses);
      if (ifSuccessful) {
        description += ' on success';
      }
    }

    if (toCharacter && toCharacter !== summonName) {
      description =
        (who ? formatWho(who) + '/' : '') + stringSlashList(toCharacter) + ' ' + description;
    }

    if (isComplex) {
      complex += appendComplexStatusDescription(
        thisStatus,
        description,
        thisStatusIndex,
        statuses.length,
      );
    } else if (thisStatus.conj === 'or') {
      if (!lastItem || !lastItem.length) {
        logger.warn('Got an "or" status with no valid previous item');
        other.push(sourceSkill, who, description);
      } else {
        lastItem[lastItem.length - 1] += ' or ' + description;
      }
    } else if (toCharacter) {
      lastItem = other.push(
        sourceSkill,
        toCharacter === summonName ? 'summonCharacter' : 'namedCharacter',
        description,
      );
    } else if (thisStatus.chance && who !== 'self') {
      const chanceDescription = formatAttackStatusChance(
        thisStatus.chance,
        findFirstEffect<skillTypes.Attack>(skillEffects, 'attack'),
      );
      other.statusInfliction.push({ description, chance: thisStatus.chance, chanceDescription });
      lastItem = undefined;
    } else if (description.match(/^\w+ infuse/)) {
      other.infuse.push(description);
      lastItem = other.infuse;
    } else if (isDetail && !parsed.statusLevel) {
      // (Always?) has implied 'self'
      other.detail.push(description);
      lastItem = other.detail;
    } else {
      lastItem = other.push(sourceSkill, who, description);
    }
  });

  if (complex) {
    const options = _.times(complexCount, i => i);
    other.push(sourceSkill, who, complex + appendCondition(condition, options));
  }

  return burstToggle;
}

/**
 * Process a set of randomly chosen statuses.  This is a much simpler version
 * of processSkillStatus.
 */
function processRandomStatus(
  skill: EnlirSkill,
  effect: skillTypes.RandomStatusEffect,
  other: OtherDetail,
) {
  const choices = effect.statuses.map(
    ({ status, chance }) =>
      arrayify(status)
        .map(s => {
          if (s.type === 'standardStatus') {
            const parsed = parseEnlirStatus(s.name, skill);
            return formatStatusDescription(parsed, effect.verb);
          } else if (s.type === 'smartEther') {
            return formatSmartEther(s.amount, s.school);
          } else {
            return formatStatusLevel(s.name, s.value, s.set, s.max);
          }
        })
        .join(' & ') + ` (${chance}%)`,
  );
  other.push(skill, effect.who, choices.join(' or '));
}

/**
 * Process a set of randomly chosen skills.  This is a much simpler version
 * of convertEnlirSkillToMrP.
 */
function processRandomSkill(
  skill: EnlirSkill,
  effect: skillTypes.RandomSkillEffect,
  other: OtherDetail,
) {
  const choices = effect.effects
    .map(({ effect: i, chance }) => {
      let description = '';
      switch (i.type) {
        case 'heal':
          description = describeHeal(skill, i);
          break;
      }
      return description + ` (${chance}%)`;
    })
    .join(' or ');
  other.misc.push(choices);
}

interface StatusInfliction {
  description: string;
  chance: number | number[];
  chanceDescription: string;
}

interface OtherDetailOptions {
  /**
   * If true, then normal/default single targets are shown as "ally".  This is
   * useful for, e.g., healing effects: they're rarely targeted at enemies, and
   * party healing soul breaks are so common that it's worth spelling out when
   * they only target one ally.
   */
  defaultToAlly?: boolean;
}

/**
 * The components of MrPSkill.other, as lists.  We break them up like
 * this so that we can sort general items (e.g., elemental infuse), then
 * self statuses, then party statuses, then "details" (e.g., EX modes).
 */
export class OtherDetail {
  normal: string[] = [];
  statusInfliction: StatusInfliction[] = [];
  aoe: string[] = [];
  infuse: string[] = []; // Following MrP, self en-element is listed separately.
  // TODO: Turn most of these into an object indexed by Who
  self: string[] = [];
  sameRow: string[] = [];
  frontRow: string[] = [];
  backRow: string[] = [];
  party: string[] = [];
  ally: string[] = [];
  misc: string[] = [];
  detail: string[] = [];
  namedCharacter: string[] = [];
  summonCharacter: string[] = [];

  push(
    skill: EnlirSkill | SimpleSkill,
    who: common.Who | common.Who[] | undefined,
    description: string,
    options: OtherDetailOptions = {},
  ) {
    if (Array.isArray(who)) {
      this.namedCharacter.push(formatWho(who) + ' ' + description);
      return this.namedCharacter;
    } else {
      const part = this.getPart(skill, who, options);
      part.push(description);
      return part;
    }
  }

  combine(implicitlyTargetsEnemies: boolean, allowImplicitSelf: boolean): string | undefined {
    let result: string[];
    if (
      allowImplicitSelf &&
      !this.normal.length &&
      !this.statusInfliction.length &&
      !this.aoe.length &&
      !this.sameRow.length &&
      !this.frontRow.length &&
      !this.backRow.length &&
      !this.party.length &&
      !this.ally.length &&
      !this.detail.length
    ) {
      // If, for example, it's a glint with only self effects, then "self" is
      // redundant.
      //
      // But - as an additional hack / special case, infuses still get "self".
      // TODO: Clean this up? I'm not sure it makes sense to have these special cases just because MrP did.
      if (this.infuse.length) {
        result = [...this.infuse, ...this.makeGroup(this.self, 'self'), ...this.misc];
      } else {
        result = [...this.infuse, ...this.self, ...this.misc];
      }
    } else {
      result = [
        ...this.formatStatusInfliction(),
        ...this.normal,
        ...this.makeGroup(this.aoe, implicitlyTargetsEnemies ? undefined : 'AoE'),

        ...this.infuse,

        // Hack: Same row is currently only used for Desch AASB, where it fits
        // naturally before partyOther.
        ...this.makeGroup(this.sameRow, 'same row'),

        // Front and back row are currently unused.
        ...this.makeGroup(this.frontRow, 'front row'),
        ...this.makeGroup(this.backRow, 'back row'),

        ...this.makeGroup(this.ally, 'ally'),
        ...this.makeGroup(this.namedCharacter),
        ...this.makeGroup(this.party, 'party'),
        ...this.makeGroup(this.self, 'self'),
        ...this.misc,
        ...this.makeGroup(this.detail),
        // Don't include this.summonCharacter; that's handled separately
      ];
    }
    return result.length ? result.join(', ') : undefined;
  }

  private getPart(
    skill: EnlirSkill | SimpleSkill,
    who: skillTypes.Who | undefined,
    options: OtherDetailOptions,
  ): string[] {
    return who
      ? this.getWhoPart(who)
      : skill === 'simple'
      ? this.normal
      : this.getTargetPart(skill.target, options);
  }

  private getTargetPart(target: EnlirTarget | null, options: OtherDetailOptions): string[] {
    switch (target) {
      case 'All enemies':
        return this.aoe;
      case 'Random enemies':
      case 'Random enemy':
      case null:
        return this.normal;
      case 'Self':
        return this.self;
      case 'All allies':
        return this.party;
      case 'Single enemy':
        return this.normal;
      case 'Single ally':
        // As 'Single' and 'Single target', but for the particular case where
        // we already have ally entries, combine them.
        return options.defaultToAlly || this.ally.length ? this.ally : this.normal;
      case 'Single target':
      case 'Single':
        return options.defaultToAlly ? this.ally : this.normal;
      case 'Ally with status':
      case 'Another ally':
      case 'Lowest HP% ally':
      case 'Random ally':
        return this.ally;
    }
  }

  private getWhoPart(who: skillTypes.Who): string[] {
    switch (who) {
      case 'self':
        return this.self;
      case 'target':
        return this.normal;
      case 'enemies':
        return this.aoe;
      case 'sameRow':
        return this.sameRow;
      case 'frontRow':
        return this.frontRow;
      case 'backRow':
        return this.backRow;
      case 'party':
        return this.party;
      case 'ally':
      case 'lowestHpAlly':
      case 'allyWithoutStatus':
      case 'allyWithNegativeStatus':
      case 'allyWithKO':
        return this.ally;
      case 'namedCharacter':
        return this.namedCharacter;
      case 'summonCharacter':
        return this.summonCharacter;
    }
  }

  // noinspection JSMethodCanBeStatic
  private makeGroup(inGroup: string[], description?: string) {
    if (inGroup.length) {
      return [(description ? description + ' ' : '') + inGroup.join(', ')];
    } else {
      return [];
    }
  }

  private formatStatusInfliction(): string[] {
    if (!this.statusInfliction.length) {
      return [];
    } else if (isAllSame(this.statusInfliction, i => i.chance)) {
      return [
        this.statusInfliction[0].chanceDescription +
          ' ' +
          this.statusInfliction.map(i => i.description).join('/'),
      ];
    } else {
      return this.statusInfliction.map(i => i.chanceDescription + ' ' + i.description);
    }
  }
}

export interface MrPSkill {
  // Time markers.  We could simply pass the time value itself, but this lets
  // us pull out how it's displayed.
  instant?: boolean;
  fast?: boolean;
  slow?: boolean;

  chain?: string;
  damage?: string;
  other?: string;
  school?: EnlirSchool;
  schoolDetails?: EnlirSchool[];

  /**
   * If set, this indicates whether this is a burst command that toggles the
   * burst status ON or OFF.
   */
  burstToggle?: boolean;

  /**
   * For burst and synchro commands that have multiple variants, like Ignis or
   * Alphinaud, this identifies the particular version.
   */
  commandDetail?: string;

  burstCommands?: MrPSkill[];
  braveCondition?: Array<EnlirElement | EnlirSchool>;
  braveCommands?: MrPSkill[];
  synchroCommands?: MrPSkill[];
  synchroCondition?: Array<EnlirElement | EnlirSchool | 'Any'>[];
  guardianCommands?: MrPSkill[];
}

export function convertEnlirSkillToMrP(
  skill: EnlirSkill,
  options: Partial<DescribeOptions> = {},
): MrPSkill {
  const opt = getDescribeOptionsWithDefaults(options);

  const result: MrPSkill = {};
  const damage: string[] = [];
  let chain: string | undefined;

  let burstToggle: boolean | undefined;

  let summon: string | undefined;
  let summonName: string | undefined;

  // The components of MrPSkill.other, as lists.  We break them up like
  // this so that we can sort general items (e.g., elemental infuse), then
  // self statuses, then party statuses, then "details" (e.g., EX modes).
  //
  // We may start returning these as is so callers can deal with them.
  const other = new OtherDetail();

  let skillEffects = safeParseSkill(skill);
  if (!skillEffects) {
    return result;
  }

  const rageDurationAndEffects = checkPureRage(skill, skillEffects);
  if (rageDurationAndEffects) {
    skillEffects = rageDurationAndEffects[1];
  }
  checkPoweredUpBy(skill, skillEffects, opt);

  for (const effect of skillEffects) {
    switch (effect.type) {
      case 'fixedAttack':
        damage.push(describeFixedAttack(skill, effect, opt));
        break;
      case 'attack':
        damage.push(describeAttack(skill, effect, opt));
        checkAttackStatus(skill, effect, other);
        break;
      case 'randomFixedAttack':
        damage.push(describeRandomFixedAttack(effect));
        break;
      case 'drainHp':
        other.self.push(describeDrainHp(effect));
        break;
      case 'recoilHp':
        other.self.push(describeRecoilHp(effect));
        break;
      case 'recoilSetHp':
        other.self.push(describeRecoilSetHp(effect));
        break;
      case 'fixedRecoilHp':
        other.push(skill, effect.who, describeFixedRecoilHp(effect));
        break;
      case 'gravityAttack':
        damage.push(describeGravityAttack(effect));
        break;
      case 'hpAttack':
        damage.push(describeHpAttack(effect));
        break;
      case 'revive':
        other.push(skill, effect.who, `revive @ ${effect.percentHp}% HP`);
        break;
      case 'heal':
        other.push(skill, effect.who, describeHeal(skill, effect), {
          // Because medica soul breaks are so common, we'll call out when a SB
          // only heals one person.
          defaultToAlly: isSoulBreak(skill),
        });
        break;
      case 'healPercent':
        other.push(skill, effect.who, formatHealPercent(effect), {
          // See comments under 'heal'
          defaultToAlly: isSoulBreak(skill),
        });
        break;
      case 'damagesUndead':
        // Omit - too detailed to include in this output
        break;
      case 'dispelOrEsuna':
        other.push(skill, effect.who, formatDispelOrEsuna(effect));
        break;
      case 'randomEther':
        other.push(
          skill,
          effect.who,
          formatRandomEther(effect.amount) + appendPerUses(effect.perUses),
        );
        break;
      case 'smartEther':
        other.push(
          skill,
          effect.who,
          formatSmartEther(effect.amount, effect.school) + appendPerUses(effect.perUses),
        );
        break;
      case 'randomCastAbility':
        damage.push(formatRandomCastAbility(effect));
        break;
      case 'randomCastOther': {
        const formattedEffect = formatRandomCastOther(effect.other);
        // Hack: We're taking advantage of our knowledge of which rage skills exist
        // here - only Gau's BSB's cmd2 is non-damaging.
        const isNonDamage = 'school' in skill && skill.school === 'Special';
        if (isNonDamage) {
          other.normal.push(formattedEffect);
        } else {
          damage.push(formattedEffect);
        }
        break;
      }
      case 'chain':
        chain = describeChain(effect);
        break;
      case 'mimic':
        other.normal.push(describeMimic(skill, effect));
        break;
      case 'summon':
        summon = 'summon ' + effect.name + ' ' + formatDuration(effect.duration);
        summonName = effect.name;
        break;
      case 'status': {
        const thisBurstToggle = processSkillStatus(skill, skillEffects, effect, other, summonName);
        if (thisBurstToggle != null) {
          burstToggle = thisBurstToggle;
        }
        break;
      }
      case 'randomStatus':
        processRandomStatus(skill, effect, other);
        break;
      case 'setStatusLevel':
        other.self.push(formatStatusLevel(effect.status, effect.value, true));
        break;
      case 'entrust': {
        const max = effect.max || 'all';
        other.normal.push(`donate ${max} SB pts to target`);
        break;
      }
      case 'gainSB':
        other.push(skill, effect.who, sbPointsAlias(effect.points), { defaultToAlly: true });
        break;
      case 'gainSBOnSuccess':
        other.push(skill, effect.who, sbPointsAlias(effect.points) + ' on success', {
          defaultToAlly: true,
        });
        break;
      case 'resetIfKO':
      case 'resistViaKO':
        // Omit - too detailed to include in this output
        break;
      case 'reset':
        other.misc.push('reset count');
        break;
      case 'castTime':
        other.misc.push(
          'cast time ' +
            formatNumberSlashList(effect.castTime, i => fixedNumberOrUnknown(i, 3)) +
            's ' +
            describeCondition(effect.condition, effect.castTime),
        );
        break;
      case 'castTimePerUse':
        other.misc.push('cast time ' + effect.castTimePerUse + 's per use');
        break;
      case 'randomSkillEffect':
        processRandomSkill(skill, effect, other);
        break;
      case 'fallback':
        other.misc.push(stringifySkill(skill));
        break;      
      default:
        return assertNever(effect);
    }
  }

  if (summon) {
    other.misc.push(
      summon + (other.summonCharacter.length ? ' w/ ' + other.summonCharacter.join(', ') : ''),
    );
  }

  {
    const powersUpEffect = checkPowersUp(skill, opt);
    if (powersUpEffect) {
      other.misc.push(powersUpEffect);
    }
  }
  {
    const sbPointsEffect = checkSbPoints(skill, skillEffects, opt);
    if (sbPointsEffect) {
      other.misc.splice(0, 0, sbPointsEffect);
    }
  }

  result.damage = damage.join(', then ') || undefined;

  {
    const implicitlyTargetsEnemies = damage.length !== 0;
    const allowImplicitSelf = isSoulBreak(skill) && isGlint(skill) && !damage.length;
    result.other = other.combine(implicitlyTargetsEnemies, allowImplicitSelf);
  }

  if (rageDurationAndEffects) {
    const turns = `${rageDurationAndEffects[0]} turns: `;
    if (result.damage) {
      result.damage = turns + result.damage;
    } else {
      result.other = turns + result.other;
    }
  }

  if (chain) {
    result.chain = chain;
  }
  if ('school' in skill) {
    result.school = skill.school;
  }
  if ('schoolDetails' in skill) {
    result.schoolDetails = skill.schoolDetails;
  }
  if (burstToggle != null) {
    result.burstToggle = burstToggle;
  }

  checkTime(skill, result);
  checkBurstCommands(skill, result);
  checkBraveCommands(skill, result);
  checkSynchroCommands(skill, result);
  checkGuardianCommands(skill, result);

  if (
    (isBurstCommand(skill) && enlir.burstCommands[skill.id].length > 1) ||
    (isSynchroCommand(skill) && enlir.synchroCommands[skill.id].length > 1)
  ) {
    result.commandDetail = getCommandDetail(skill.name);
  }

  return result;
}

interface FormatOptions {
  showTime: boolean;
}

function describeMrPTime({ instant, fast, slow }: MrPSkill): string | null {
  if (instant) {
    return 'instant';
  } else if (fast) {
    return 'fast';
  } else if (slow) {
    return 'slow';
  } else {
    return null;
  }
}

export function formatMrPSkill(mrP: MrPSkill, options: Partial<FormatOptions> = {}): string {
  const opt: FormatOptions = {
    showTime: true,
    ...options,
  };

  const burstToggleText = mrP.burstToggle == null ? '' : mrP.burstToggle ? 'ON' : 'OFF';
  let text = _.filter([burstToggleText, mrP.chain, mrP.damage, mrP.other]).join(', ');
  if (text && opt.showTime) {
    const time = describeMrPTime(mrP);
    text = (time ? time + ' ' : '') + text;
  }
  return text;
}

// TODO: Handle element '?' - it's not a valid EnlirElement and so is rejected by our schemas, even thought it can appear in the data
// TODO: Use × for times; make Unicode selectable?
// TODO: Fix remaining inconsistencies between slash and hyphen - most current code favors hyphen, but slashMerge and some status code still uses slashes
// Maybe the ideal would be to pick hyphen vs. slash based on what it's describing?
