import * as _ from 'lodash';

import { MrPSoulBreak } from '.';
import { logger } from '../../utils/logger';
import { MAX_BRAVE_LEVEL } from './types';
import { enDashJoin, slashMerge } from './util';

function formatBraveLevel(level: number): string {
  if (level === 0) {
    return '';
  }
  return ' at brv.' + (level === 3 ? level : `${level}+`);
}

export function formatBraveCommands(mrP: MrPSoulBreak[]): string {
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

  // Check for heals.
  const isHeal = (s: string) => s.match(/\bh\d/) != null;
  const heals = mrP.map(i => i.other && i.other.split(/, /).find(isHeal));
  const healCount = _.filter(heals).length;
  let combinedHeal = '';
  if (healCount !== 0 && healCount !== MAX_BRAVE_LEVEL + 1) {
    logger.warn('Unexpected healing for given braves');
  } else if (healCount === MAX_BRAVE_LEVEL + 1) {
    combinedHeal = heals.join(enDashJoin);
  }

  // Check for effects.
  const effects = mrP.map(i =>
    i.other
      ? i.other
          .split(/, /)
          .filter(s => !isHeal(s))
          .join(', ')
      : '',
  );
  let cumulativeEffects = '';
  if (_.some(effects, i => i !== '')) {
    const effectLevel = effects.findIndex(i => i !== '');
    cumulativeEffects =
      slashMerge(effects.slice(effectLevel), { forceEnDash: true }) + formatBraveLevel(effectLevel);
  }

  return (
    (mrP[0].instant ? 'instant ' : '') +
    _.filter([damage, combinedHeal, cumulativeEffects]).join(', ')
  );
}
