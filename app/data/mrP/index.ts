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

function appendGroup(outGroup: string[], inGroup: string[], description?: string) {
  if (inGroup.length) {
    outGroup.push((description ? description + ' ' : '') + inGroup.join(', '));
  }
}

function formatDamageType(damageType: MrPDamageType, abbreviate: boolean): string {
  return abbreviate ? damageTypeAbbreviation(damageType) : damageType + ' ';
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

function describeEnlirAttack(
  skill: EnlirSkill,
  attack: ParsedEnlirAttack,
  opt: DescribeOptions,
): [string, StatusInfliction[]] {
  let damage = '';
  const statusInfliction: StatusInfliction[] = [];

  if (attack.status && attack.statusChance) {
    const { description, defaultDuration } = parseEnlirStatus(attack.status, skill);
    const duration = attack.statusDuration || defaultDuration;
    // Semi-hack: Attack statuses are usually or always imperils, and text
    // like '35% +10% fire vuln.' looks weird.  Like MrP, we insert a 'for'
    // to make it a bit clearer.
    statusInfliction.push({
      description: 'for ' + description + (duration ? ` ${duration}s` : ''),
      chance: attack.statusChance,
      chanceDescription: attack.statusChance.join('/') + '%',
    });
  }

  // Hack: In case a "followed by" attack left a trailing comma that we ended
  // up not needing.
  damage = damage.replace(/,$/, '');
  return [damage, statusInfliction];
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

  // Random effects.  In practice, these are always pure damage, so list as
  // damage.
  if ((m = sb.effects.match(/Randomly casts (.*)/))) {
    const skillsAndChances = _.unzip(
      m[1]
        .split(orList)
        .map(i => i.match(/^(.*?)(?: \((\d+)%\))?$/))
        .map((i: RegExpMatchArray) => [i[1], i[2] ? +i[2] : 1]),
    ) as [string[], number[]];

    let skills = skillsAndChances[0];

    // Resolve skill effects, if it looks like it won't be too verbose.
    if (skills.length <= 3) {
      const skillOpt = { abbreviate: true, includeSchool: false };
      skills = skillsAndChances[0].map(i => {
        const thisSkill = enlir.abilitiesByName[i];
        if (thisSkill) {
          return i + ' (' + formatMrP(describeEnlirSoulBreak(thisSkill, skillOpt)) + ')';
        } else {
          return i;
        }
      });
    }
    damage = _.filter(describeChances(skills, skillsAndChances[1], ' / ')).join(' ');
  }

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
