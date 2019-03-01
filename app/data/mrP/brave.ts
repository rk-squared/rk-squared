import * as _ from 'lodash';

import { MrPSoulBreak } from '.';
import { logger } from '../../utils/logger';
import { enDashJoin, slashMerge } from './util';

export const MAX_BRAVE_LEVEL = 3;

function formatBraveLevel(level: number): string {
  if (level === 0) {
    return '';
  }
  return ' at brv.' + (level === 3 ? level : `${level}+`);
}

const isHeal = (s: string) => s.match(/\bh\d/) != null;

function getBraveDamage(mrP: MrPSoulBreak[]): string {
  let damageParts = mrP.map(i => i.damage || '');
  const overstrike = damageParts.map(i => i.match('overstrike') != null);

  // Separate the 'm' and 'p' damage markers, and remove "overstrike," since
  // we'll handle that separately.
  damageParts = damageParts.map(i =>
    i.replace(/\b([mp])(\d)/g, '$1 $2').replace(' overstrike', ''),
  );

  // Handle damage.
  let damage = slashMerge(damageParts, { forceEnDash: true });

  // Put the 'm' and 'p' back.
  damage = damage.replace(/\b([mp]) (\d+)/g, '$1$2');

  // Add overstrike level.
  const overstrikeLevel = overstrike.indexOf(true);
  if (damage && overstrikeLevel !== -1) {
    damage += ', overstrike' + formatBraveLevel(overstrikeLevel);
  }

  return damage;
}

function getBraveHeals(mrP: MrPSoulBreak[]): string {
  const heals = mrP.map(i => i.other && i.other.split(/, /).find(isHeal));
  const healCount = _.filter(heals).length;
  if (healCount === 0) {
    return '';
  } else if (healCount === MAX_BRAVE_LEVEL + 1) {
    return heals.join(enDashJoin);
  } else {
    logger.warn('Unexpected healing for given braves');
    return '';
  }
}

function getBraveEffects(mrP: MrPSoulBreak[]): string {
  // Array of arrays, indexed by brave level then effect number
  const effects = mrP.map(i => (i.other ? i.other.split(/, /).filter(s => !isHeal(s)) : []));

  if (!_.some(effects, i => i.length)) {
    return '';
  }

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
      slashMerge(effects.slice(effectLevel).map(e => e[effectIndex]), { forceEnDash: true }),
    );
  }

  const mergedEffects: Array<string | undefined> = combinedEffects.map(
    (e, i) => e && e.join(' & ') + formatBraveLevel(i),
  );

  return _.filter(mergedEffects).join(', ');
}

export function formatBraveCommands(mrP: MrPSoulBreak[]): string {
  const damage = getBraveDamage(mrP);
  const heal = getBraveHeals(mrP);
  const effects = getBraveEffects(mrP);

  return (mrP[0].instant ? 'instant ' : '') + _.filter([damage, heal, effects]).join(', ');
}
