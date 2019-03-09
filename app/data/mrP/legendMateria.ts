import { arrayify } from '../../utils/typeUtils';
import { EnlirLegendMateria } from '../enlir';
import { describeEnlirStatus, formatTriggeredEffect } from './status';
import { getShortName } from './types';
import { andList, percentToMultiplier } from './util';

type HandlerList = Array<[RegExp | RegExp[], (parts: string[]) => string | null]>;

function resolveWithHandlers(handlers: HandlerList, item: string): string | null {
  for (const [re, formatter] of handlers) {
    for (const i of arrayify(re)) {
      const m = item.match(i);
      if (m) {
        return formatter(m.slice(1));
      }
    }
  }

  return null;
}

const legendMateriaHandlers: HandlerList = [
  [
    [
      /^(\d+)% chance to dualcast abilities that deal (\w+) damage$/,
      /^(\d+)% chance to dualcast (.*) abilities$/,
    ],
    ([percent, schoolOrElement]) => `${percent}% dualcast ${getShortName(schoolOrElement)}`,
  ],

  [
    [
      /^Increases (\w+) damage dealt by (\d+)%$/,
      /^(\w+) (?:abilities|attacks) deal (\d+)% more damage$/,
    ],
    ([schoolOrElement, percent]) => {
      const multiplier = percentToMultiplier(+percent);
      return `${multiplier}x ${getShortName(schoolOrElement)} dmg`;
    },
  ],

  [
    /^Grants (.*) at the beginning of the battle$/,
    ([statuses]) =>
      statuses
        .split(andList)
        .map(i => describeEnlirStatus(i))
        .join(', ') + ' at battle start',
  ],

  [
    /^WHT abilities restore (\d+)% more HP$/,
    ([percent]) => {
      const multiplier = percentToMultiplier(+percent);
      return `${multiplier}x WHT healing`;
    },
  ],

  [
    /^(\d+)% chance to grant (.*) to the user after using an? (.*) ability$/,
    ([percent, status, schoolOrElement]) =>
      formatTriggeredEffect(getShortName(schoolOrElement), describeEnlirStatus(status), +percent),
  ],

  [
    /^(\d+)% chance to grant (.*) to the target after using a single-target White Magic ability that restores HP on an ally$/,
    ([percent, status]) =>
      formatTriggeredEffect('ally W.Mag heal', 'ally ' + describeEnlirStatus(status), +percent),
  ],

  [
    /^(\d+)% chance to cast an ability \((.*)\) after (using|dealing damage with) a (.*) (?:ability|attack)$/,
    ([percent, effect, isDamageTrigger, schoolOrAbility]) =>
      formatTriggeredEffect(
        getShortName(schoolOrAbility) + (isDamageTrigger ? ' dmg' : ''),
        effect,
        +percent,
      ),
  ],
];

export function formatMrPLegendMateria({ effect }: EnlirLegendMateria): string | null {
  return resolveWithHandlers(legendMateriaHandlers, effect);
}
