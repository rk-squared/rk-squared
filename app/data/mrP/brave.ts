import * as _ from 'lodash';

import { logger } from '../../utils/logger';
import { MrPSkill } from './skill';
import { enDashJoin, slashMerge } from './util';

export const MAX_BRAVE_LEVEL = 3;

function formatBraveMinLevel(level: number): string {
  if (level === 0) {
    return '';
  }
  return ' at brv.' + (level === 3 ? level : `${level}+`);
}

function formatBraveLevelRange(from: number, to: number): string {
  if (from === -1 && to === -1) {
    return '';
  } else if (from === 0 && to === MAX_BRAVE_LEVEL) {
    return '';
  } else if (from === to) {
    return ' at brv.' + from;
  } else if (to === MAX_BRAVE_LEVEL) {
    return formatBraveMinLevel(from);
  } else if (from === 0) {
    return ' up to brv.' + to;
  } else {
    return ' at brv.' + from + '-' + to;
  }
}

const isHeal = (s: string) => s.match(/\bh\d/) != null;

/**
 * Brave AASBs grant instacast at brave level 0 to make the second double-cast
 * brave command more useful.  We treat this case specially instead of letting
 * our generic effect-merging code handle it.
 *
 * More generically, if the brave level 0 effect occurs nowhere else, extract
 * it.
 */
function extractBrave0Effects(effects: string[][]): string | undefined {
  const effect = effects[0][effects[0].length - 1];
  const found = effects[0].indexOf(effect);
  if (found === -1) {
    return undefined;
  }
  if (_.some(effects.slice(1), i => i.indexOf(effect) !== -1)) {
    return undefined;
  }
  effects[0].splice(found);
  return effect;
}

function filterBraveLevels(allParts: string[]) {
  const firstLevel = _.findIndex(allParts);
  const lastLevel = _.findLastIndex(allParts);
  return {
    parts:
      firstLevel === -1
        ? []
        : allParts.slice(firstLevel, lastLevel === -1 ? undefined : lastLevel + 1),
    firstLevel,
    lastLevel,
  };
}

function getBraveDamage(mrP: MrPSkill[]): string {
  // tslint:disable-next-line prefer-const
  let { parts, firstLevel, lastLevel } = filterBraveLevels(mrP.map(i => i.damage || ''));
  const overstrike = parts.map(i => i.match('overstrike') != null);

  // Separate the 'm' and 'p' damage markers, and remove "overstrike," since
  // we'll handle that separately.
  parts = parts.map(i => i.replace(/\b([mp])(\d)/g, '$1 $2').replace(' overstrike', ''));

  // Handle damage.
  let damage = slashMerge(parts, { join: enDashJoin });

  // Put the 'm' and 'p' back.
  damage = damage.replace(/\b([mp]) (\d+)/g, '$1$2');
  damage += formatBraveLevelRange(firstLevel, lastLevel);

  // Add overstrike level.
  const overstrikeLevel = overstrike.indexOf(true);
  if (damage && overstrikeLevel !== -1) {
    damage += ', overstrike' + formatBraveMinLevel(firstLevel + overstrikeLevel);
  }

  return damage;
}

function getBraveHeals(mrP: MrPSkill[]): string {
  const heals = mrP.map(i => i.other && i.other.split(/, /).find(isHeal));
  const healCount = _.filter(heals).length;
  if (healCount === 0) {
    return '';
  } else if (healCount === MAX_BRAVE_LEVEL + 1) {
    return heals.join(enDashJoin);
  } else {
    // If this ever becomes an issue, we can re-implement this function using
    // filterBraveLevels.
    logger.warn('Unexpected healing for given braves');
    return '';
  }
}

function getBraveEffects(mrP: MrPSkill[]): string {
  // Array of arrays, indexed by brave level then effect number
  const effects = mrP.map(i => (i.other ? i.other.split(/, /).filter(s => !isHeal(s)) : []));

  if (!_.some(effects, i => i.length)) {
    return '';
  }

  const brave0Effect = extractBrave0Effects(effects);

  // Array of merged effects, indexed by effect level then effect index.  This
  // assumes that effects mostly match up from one brave level to the next and
  // will make for ugly results otherwise.
  //
  // We don't *have* to split up effects like this, but it helps slash merging;
  // otherwise, if we have two effects, one which varies a lot and one which
  // is constant, slashMerge may try to forcibly merging the parts, instead of
  // using fallback for the varying effect and just merging the constant.
  const combinedEffects: string[][] = [];
  for (let effectIndex = 0; ; effectIndex++) {
    const effectLevel = effects.findIndex(
      e => e[effectIndex] != null && e[effectIndex].length !== 0,
    );
    if (effectLevel === -1) {
      break;
    }

    combinedEffects[effectLevel] = combinedEffects[effectLevel] || [];
    combinedEffects[effectLevel].push(
      slashMerge(effects.slice(effectLevel).map(e => e[effectIndex] || ''), { join: enDashJoin }),
    );
  }

  const mergedEffects: Array<string | undefined> = combinedEffects.map(
    (e, i) => e && e.join(' & ') + formatBraveMinLevel(i),
  );

  if (brave0Effect) {
    mergedEffects.splice(0, 0, brave0Effect + formatBraveLevelRange(0, 0));
  }

  return _.filter(mergedEffects).join(', ');
}

export function formatBraveCommands(mrP: MrPSkill[]): string {
  const damage = getBraveDamage(mrP);
  const heal = getBraveHeals(mrP);
  const effects = getBraveEffects(mrP);

  return (mrP[0].instant ? 'instant ' : '') + _.filter([damage, heal, effects]).join(', ');
}
