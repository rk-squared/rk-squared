import * as _ from 'lodash';
import * as XRegExp from 'xregexp';

import { isAllSame } from '../../utils/typeUtils';
import {
  enlir,
  EnlirBurstCommand,
  EnlirElement,
  EnlirSchool,
  EnlirSkill,
  EnlirSynchroCommand,
  getNormalSBPoints,
  isAbility,
  isBraveCommand,
  isBraveSoulBreak,
  isBurstSoulBreak,
  isEnlirElement,
  isGlint,
  isSoulBreak,
  isSynchroSoulBreak,
} from '../enlir';
import { ParsedEnlirAttack, parseEnlirAttack } from './attack';
import { splitSkillStatuses } from './split';
import {
  checkForAndStatuses,
  describeStats,
  formatDuration,
  getRageSkills,
  includeStatus,
  parseEnlirStatus,
  parseEnlirStatusWithSlashes,
  parseStatusItem,
  shareStatusDurations,
  slashMergeElementStatuses,
  sortStatus,
  StatusItem,
} from './status';
import {
  formatRandomEther,
  formatSmartEther,
  resolveStatusAlias,
  sbPointsAlias,
} from './statusAlias';
import {
  appendElement,
  damageTypeAbbreviation,
  getElementAbbreviation,
  getElementShortName,
  getSchoolShortName,
  getShortName,
  MrPDamageType,
  XRegExpNamedGroups,
} from './typeHelpers';
import {
  countMatches,
  describeChances,
  formatUseCount,
  orList,
  parseNumberOccurrence,
  toMrPFixed,
  toMrPKilo,
} from './util';

export interface MrPSoulBreak {
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

  burstCommands?: MrPSoulBreak[];
  braveCondition?: Array<EnlirElement | EnlirSchool>;
  braveCommands?: MrPSoulBreak[];
  synchroCommands?: MrPSoulBreak[];
  synchroCondition?: Array<EnlirElement | EnlirSchool>;
}

interface DescribeOptions {
  abbreviate: boolean;
  abbreviateDamageType: boolean;
  showNoMiss: boolean;
  includeSchool: boolean;
  includeSbPoints: boolean;

  prereqStatus: string | undefined;
  burstCommands: EnlirBurstCommand[] | undefined;
  synchroCommands: EnlirSynchroCommand[] | undefined;
}

// FIXME: Rename to indicate broader usage (not just soul breaks now) and move out of index?
export function describeEnlirSoulBreak(
  sb: EnlirSkill,
  options: Partial<DescribeOptions> = {},
): MrPSoulBreak {
  const opt: DescribeOptions = {
    abbreviate: false,
    abbreviateDamageType: false,
    showNoMiss: true,
    includeSchool: true,
    includeSbPoints: true,
    prereqStatus: undefined,
    burstCommands: undefined,
    synchroCommands: undefined,
    ...options,
  };

  let m: RegExpMatchArray | null;
  let damage = '';

  const statusInfliction: StatusInfliction[] = [];

  // The components of MrPSoulBreak.other, as lists.  We break them up like
  // this so that we can sort general items (e.g., elemental infuse), then
  // self statuses, then party statuses, then "details" (e.g., EX modes).
  //
  // We may start returning these as is so callers can deal with them.
  let burstToggle: boolean | undefined;
  const other: string[] = [];
  const aoeOther: string[] = [];
  const selfOther: string[] = [];
  const sameRowOther: string[] = [];
  const partyOther: string[] = [];
  const detailOther: string[] = [];

  // Hack / special case: Rage skills whose rage effects match the main effect.
  let isPureRage = false;
  let rageTurns: number | undefined;
  if (
    (m = sb.effects.match(/^Casts a random (.*) attack, grants Rage to the user for (\d+) turns?/))
  ) {
    const [, rageSkill, turns] = m;
    if (rageSkill === sb.name) {
      isPureRage = true;
      rageTurns = +turns;
    }
  } else if ((m = sb.effects.match(/^(.*), grants Rage to the user for (\d+) turns?/))) {
    const [, effects, turns] = m;
    const rageSkills = getRageSkills(sb);
    if (rageSkills.length === 1 && rageSkills[0].effects === effects) {
      isPureRage = true;
      rageTurns = +turns;
    }
  }
  if (isPureRage && rageTurns) {
    const rageStatus = parseEnlirStatus('Rage', sb);
    const description = formatDuration(rageTurns + 1, 'turn') + ': ' + rageStatus.description;

    // Hack: We're taking advantage of our knowledge of which rage skills exist
    // here - only Gau's BSB's cmd2 is non-damaging.
    const isNonDamage = 'school' in sb && sb.school === 'Special';
    if (isNonDamage) {
      other.push(description);
    } else {
      damage = description;
    }
  }

  if (
    opt.burstCommands &&
    _.some(opt.burstCommands, i =>
      i.effects.match(new RegExp(' (scaling|scal\\.) with ' + _.escapeRegExp(sb.name) + ' uses')),
    )
  ) {
    // Hack: In practice, it's always command 1 that does the powering up.
    other.push('powers up cmd 2');
  }
  if (opt.synchroCommands) {
    const powerUp = _.findIndex(
      opt.synchroCommands,
      i =>
        !!i.effects.match(
          new RegExp(' (scaling|scal\\.) with ' + _.escapeRegExp(sb.name) + ' uses'),
        ),
    );
    if (powerUp !== -1) {
      other.push(`powers up cmd ${powerUp + 1}`);
    }
  }

  const result: MrPSoulBreak = {
    damage: damage || undefined,
    other: other.length ? other.join(', ') : undefined,
  };

  return result;
}
