import { arrayify } from '../../utils/typeUtils';
import { EnlirLegendMateria } from '../enlir';
import {
  describeEnlirStatus,
  formatDuration,
  formatTriggeredEffect,
  parseEnlirStatus,
} from './status';
import { formatSchoolOrAbilityList, getShortName } from './types';
import { andList, percentToMultiplier } from './util';

const dmg = (isDamageTrigger: any) => (isDamageTrigger ? ' dmg' : '');

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

const simpleEffectHandlers: HandlerList = [
  [/WHT: group, restores HP \((\d+)\)/, ([healFactor]) => `party h${healFactor}`],
];

const legendMateriaHandlers: HandlerList = [
  // Dualcast!
  [
    [
      /^(\d+)% chance to dualcast abilities that deal (.*) damage$/,
      /^(\d+)% chance to dualcast (.*) abilities$/,
    ],
    ([percent, schoolOrElement]) =>
      `${percent}% dualcast ${formatSchoolOrAbilityList(schoolOrElement)}`,
  ],

  // Damage bonuses
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

  // Healing bonuses
  [
    /^WHT abilities restore (\d+)% more HP$/,
    ([percent]) => {
      const multiplier = percentToMultiplier(+percent);
      return `${multiplier}x WHT healing`;
    },
  ],

  // Starting statuses
  [
    /^Grants (.*) at the beginning of the battle$/,
    ([statuses]) =>
      statuses
        .split(andList)
        .map(i => describeEnlirStatus(i))
        .join(', ') + ' at battle start',
  ],

  // Triggered self statuses
  [
    /^(\d+)% chance to grant (.*) to the user after using an? (.*) ability$/,
    ([percent, status, schoolOrElement]) =>
      formatTriggeredEffect(getShortName(schoolOrElement), describeEnlirStatus(status), +percent),
  ],

  // Single-target white magic bonus effects
  [
    /^(\d+)% chance to grant (.*) to the target after using a single-target White Magic ability that restores HP on an ally$/,
    ([percent, status]) =>
      formatTriggeredEffect('ally W.Mag heal', 'ally ' + describeEnlirStatus(status), +percent),
  ],

  // Triggered simple skills
  [
    /^(\d+)% chance to cast an ability \((.*)\) after (using|dealing damage with) a (.*) (?:ability|attack)$/,
    ([percent, effect, isDamageTrigger, schoolOrAbility]) => {
      const description = resolveWithHandlers(simpleEffectHandlers, effect);
      if (!description) {
        return null;
      }
      return formatTriggeredEffect(
        getShortName(schoolOrAbility) + dmg(isDamageTrigger),
        description,
        +percent,
      );
    },
  ],

  // Triggered status ailments (imperils)
  [
    /^(\d+)% chance to cause (.*) to the target after (using|dealing damage with) a (.*) (?:ability|attack) on an enemy$/,
    ([percent, status, isDamageTrigger, schoolOrAbility]) =>
      formatTriggeredEffect(
        getShortName(schoolOrAbility) + dmg(isDamageTrigger),
        describeEnlirStatus(status),
        +percent,
      ),
  ],

  // Trance effects
  [
    /^(Restores HP for 100% of the user's maximum HP and )?[Gg]rants (.*)(?: for (\d+) seconds)? when HP fall below 20%$/,
    ([isHeal, statusNames, duration]) => {
      const status = statusNames.split(andList).map(i => parseEnlirStatus(i));

      // Process duration from the last status - it's more likely to be interesting.
      const lastStatus = status[status.length - 1];
      if (duration) {
        duration = formatDuration(+duration, 'second');
      } else if (lastStatus.defaultDuration && !lastStatus.isVariableDuration) {
        duration = formatDuration(lastStatus.defaultDuration, 'second');
      }

      const statusDescription =
        status.map(i => i.description).join(', ') + (duration ? ' ' + duration : '');
      return formatTriggeredEffect('<20% HP', (isHeal ? 'heal 100% HP, ' : '') + statusDescription);
    },
  ],
];

export function formatMrPLegendMateria({ effect }: EnlirLegendMateria): string | null {
  return resolveWithHandlers(legendMateriaHandlers, effect);
}
