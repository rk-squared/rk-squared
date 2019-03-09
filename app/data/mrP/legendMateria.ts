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

const dmg = (isDamageTrigger: string | null) =>
  isDamageTrigger && isDamageTrigger.match('dealing damage with') ? ' dmg' : '';

function describeBattleStart(statuses: string) {
  return (
    statuses
      .split(andList)
      .map(i => describeEnlirStatus(i))
      .join(', ') + ' at battle start'
  );
}

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
  [/^WHT: group, restores HP \((\d+)\)$/, ([healFactor]) => `party h${healFactor}`],
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
      /^(.*) (?:abilities|attacks) deal (\d+)% more damage(?: when equipping a (.*))?$/,
    ],
    ([schoolOrElement, percent, when]) => {
      const multiplier = percentToMultiplier(+percent);
      const whenDescription = when ? ` if using a ${when}` : '';
      return `${multiplier}x ${getShortName(schoolOrElement)} dmg` + whenDescription;
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

  // Build-ups
  [
    /([A-Z]{3}) \+(\d+)% for each hit dealt with (.*) (?:abilities|attacks), up to \+(\d+)%/,
    ([stat, bonus, schoolOrAbility, max]) =>
      `+${bonus}% ${stat} (max +${max}%) per ${formatSchoolOrAbilityList(schoolOrAbility)}`,
  ],
  [
    /([A-Z]{3}) \+(\d+)% for each hit taken by damaging attacks, up to \+(\d+)%/,
    ([stat, bonus, max]) => `+${bonus}% ${stat} (max +${max}%) per hit taken`,
  ],

  // Starting statuses
  [/^Grants (.*) at the beginning of the battle$/, ([statuses]) => describeBattleStart(statuses)],

  // Aphmau is weird.
  [
    /^Grants (.*) at the beginning of the battle, grants (.*) to the user when Reraise is triggered$/,
    ([statuses, reraiseStatus]) =>
      describeBattleStart(statuses) +
      ', ' +
      formatTriggeredEffect('Reraise', describeEnlirStatus(reraiseStatus)),
  ],

  // Triggered self statuses
  [
    /^(\d+)% chance (?:of|to grant) (.*?)(?: for (\d+) seconds)? to the user after (?:using an? (.*) (?:ability|attack)|(dealing a critical hit))$/,
    ([percent, status, duration, schoolOrElement, critical]) => {
      // TODO: Consolidate trigger logic with status.ts?
      const trigger = schoolOrElement ? getShortName(schoolOrElement) : 'crit';
      return formatTriggeredEffect(
        trigger,
        describeEnlirStatus(status) + (duration ? ' ' + duration + 's' : ''),
        +percent,
      );
    },
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
    /^(Restores HP for 100% of the user's maximum HP and )?[Gg]rants (.*?)(?: for (\d+) seconds)? when HP fall below 20%$/,
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
        status.map(i => (i.isTrance ? 'Trance: ' : '') + i.description).join(', ') +
        (duration ? ' ' + duration : '');
      return formatTriggeredEffect('<20% HP', (isHeal ? 'heal 100% HP, ' : '') + statusDescription);
    },
  ],

  // Damage reduction and cover
  [
    /^Reduces damage taken by (.*) attacks by (\d+)%$/,
    ([element, percent]) => `-${percent}% ${formatSchoolOrAbilityList(element)} dmg taken`,
  ],
  [
    /^(\d+)% chance to cover PHY attacks that target allies, reducing damage taken by (\d+)%$/,
    ([percentChance, percentDamage]) =>
      `${percentChance}% cover PHY w/ -${percentDamage}% dmg taken`,
  ],

  // Stat buffs and debuffs
  [
    /^Increases the duration of (.*) by (.*)%$/,
    ([what, percent]) => `${percentToMultiplier(+percent)}x ${what} duration`,
  ],
];

export function formatMrPLegendMateria({ effect }: EnlirLegendMateria): string | null {
  return resolveWithHandlers(legendMateriaHandlers, effect);
}
