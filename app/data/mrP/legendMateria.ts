import * as _ from 'lodash';

import { describeEnlirSoulBreak, formatMrP } from '.';
import { arrayify } from '../../utils/typeUtils';
import {
  EnlirElement,
  EnlirFormula,
  EnlirLegendMateria,
  EnlirSkillType,
  getEnlirOtherSkill,
} from '../enlir';
import { describeDamage, describeDamageType, formatThreshold } from './attack';
import {
  describeEnlirStatus,
  describeStats,
  formatDuration,
  formatTriggeredEffect,
  hitWeaknessTriggerText,
  parseEnlirStatus,
} from './status';
import { formatSmartEther, sbPointsAlias } from './statusAlias';
import {
  appendElement,
  damageTypeAbbreviation,
  formatSchoolOrAbilityList,
  getElementAbbreviation,
  getShortName,
} from './types';
import { andList, percentToMultiplier, toMrPKilo } from './util';

const tranceTriggerText = '<20% HP';
const dmg = (isDamageTrigger: string | null) =>
  isDamageTrigger && isDamageTrigger.match('dealing damage with') ? ' dmg' : '';
const whenDescription = (when: string | null) => (when ? ` if using ${when}` : '');

function describeBattleStart(statuses: string) {
  return (
    statuses
      .split(andList)
      .map(i => describeEnlirStatus(i))
      .join(', ') + ' at battle start'
  );
}

const hitOrAbilityAbbrev: _.Dictionary<string> = {
  hit: 'hit',
  ability: 'abil.',
  attack: 'atk',
};

function describeBuildUp(
  stat: string,
  bonus: string,
  hitOrAbility: string,
  types: string[],
  max: string,
) {
  let type = types.map(formatSchoolOrAbilityList).join(' ');
  if (hitOrAbilityAbbrev[hitOrAbility]) {
    type += ' ' + hitOrAbilityAbbrev[hitOrAbility];
  }
  return `+${bonus}% ${stat} (max +${max}%) per ${type}`;
}

type HandlerList = Array<[RegExp | RegExp[], (parts: string[], allText: string) => string | null]>;

function resolveWithHandlers(handlers: HandlerList, item: string): string | null {
  for (const [re, formatter] of handlers) {
    for (const i of arrayify(re)) {
      const m = item.match(i);
      if (m) {
        return formatter(m.slice(1), m[0]);
      }
    }
  }

  return null;
}

const skillEffectHandlers: HandlerList = [
  [/^smart ether (\d+) to the user$/, ([amount]) => formatSmartEther(amount)],
  [
    /^(?:restores )?(\d+) HP to (?:an ally|the lowest HP% ally)$/,
    ([fixedHp]) => `ally heal ${toMrPKilo(+fixedHp)} HP`,
  ],
  [
    /^((?:[A-Z]{3}\/)*[A-Z]{3}) -(\d+|\?)%$/,
    ([stats, percent]) => `AoE -${percent}% ` + describeStats(stats.split('/')),
  ],
];

const simpleSkillHandlers: HandlerList = [
  // Healing
  [/^WHT: group, restores HP \((\d+|\?)\)$/, ([healFactor]) => `party h${healFactor}`],
  [
    /^NAT: (single|group), restores HP for (\d+)% of the target's maximum HP$/,
    ([who, healPercent]) => {
      const whoDescription = who === 'single' ? 'ally' : 'party';
      return `${whoDescription} heal ${healPercent}% HP`;
    },
  ],

  // Attacks
  [
    /^(PHY|BLK|WHT|PHY)(?:\/(NIN))?: (single|random|group), (?:(\d+)x )?([0-9\.]+|\?) (ranged )?(physical|magical|hybrid)(?: ([^,]+))?(, .*)?$/,
    ([
      type,
      hybridType,
      attackType,
      numAttacks,
      attackMultiplier,
      isRanged,
      formula,
      elements,
      addedEffects,
    ]) => {
      const damageType = describeDamageType(formula as EnlirFormula, type as EnlirSkillType);

      let hybridDamage: string | undefined;
      if (hybridType) {
        const hybridDamageType = describeDamageType(
          formula as EnlirFormula,
          hybridType as EnlirSkillType,
        );
        hybridDamage =
          damageTypeAbbreviation(hybridDamageType) +
          describeDamage(parseFloat(attackMultiplier), numAttacks ? +numAttacks : 1);
      }

      const elementList = elements ? (elements.split(/\//) as EnlirElement[]) : [];
      let damage =
        (attackType === 'group' ? 'AoE ' : '') +
        damageTypeAbbreviation(damageType) +
        describeDamage(parseFloat(attackMultiplier), numAttacks ? +numAttacks : 1) +
        (hybridDamage ? ' or ' + hybridDamage : '') +
        // Use getElementAbbreviation to match soul break follow-ups.
        // getElementShortName might be better for 1- or 2- element skills.
        appendElement(elementList, getElementAbbreviation);
      damage += isRanged ? ' rngd' : '';

      const effects = !addedEffects
        ? []
        : addedEffects
            .split(/, /)
            .filter(i => i !== '')
            .map(i => resolveWithHandlers(skillEffectHandlers, i));
      if (_.some(effects, i => i == null)) {
        return null;
      }

      return damage + (effects.length ? ', ' + effects.join(', ') : '');
    },
  ],

  // Statuses
  [
    /^NAT: group, causes (.*) for (\d+|\?) seconds$/,
    ([status, duration]) => {
      return (
        'AoE ' +
        status
          .split(andList)
          .map(i => describeEnlirStatus(i))
          .join(', ') +
        ' ' +
        duration +
        's'
      );
    },
  ],
  [
    /^NAT: group, ((?:[A-Z]{3}\/)*[A-Z]{3}) -(\d+|\?)%$/,
    ([stats, percent]) => `AoE -${percent}% ` + describeStats(stats.split('/')),
  ],
];

const legendMateriaHandlers: HandlerList = [
  // Dualcast!
  [
    [
      /^(\d+\??|\?)% chance to dualcast abilities that deal (.*) damage$/,
      /^(\d+\??|\?)% chance to dualcast (.*) abilities$/,
    ],
    ([percent, schoolOrElement]) =>
      `${percent}% dualcast ${formatSchoolOrAbilityList(schoolOrElement)}`,
  ],

  // Triplecast!!!
  [
    [
      /^(\d+\??|\?)% chance to dualcast abilities that deal (.*) damage twice$/,
      /^(\d+\??|\?)% chance to dualcast (.*) abilities twice$/,
    ],
    ([percent, schoolOrElement]) =>
      `${percent}% triplecast ${formatSchoolOrAbilityList(schoolOrElement)}`,
  ],

  // Damage bonuses
  [
    [
      /^Increases (\w+) damage dealt by (\d+\??|\?)%$/,
      /^(.*) (?:abilities|attacks) deal (\d+\??|\?)% more damage(?: when equipping (.*))?$/,
    ],
    ([schoolOrElement, percent, when]) => {
      const multiplier = percentToMultiplier(percent);
      return `${multiplier}x ${getShortName(schoolOrElement)} dmg` + whenDescription(when);
    },
  ],

  // Healing bonuses
  [
    /^WHT abilities restore (\d+)% more HP$/,
    ([percent]) => {
      const multiplier = percentToMultiplier(percent);
      return `${multiplier}x WHT healing`;
    },
  ],

  // Stat boosts
  [
    /^((?:[A-Z]{3}(?:, |,? and ))*[A-Z]{3}) (\+ ?(?:\d+|\?))% when equipping (.*)$/,
    ([stats, percent, when]) => {
      const combinedStats = describeStats(stats.match(/[A-Z]{3}/g)!);
      percent = percent.replace(' ', '') + '%';
      return percent + ' ' + combinedStats + whenDescription(when);
    },
  ],

  // Build-ups
  [
    /([A-Z]{3}) \+(\d+|\?)% for each hit dealt with (.*) (?:abilities|attacks)(?: that deal (.*) damage)?, up to \+?(\d+|\?)%/,
    ([stat, bonus, type1, type2, max]) =>
      describeBuildUp(stat, bonus, 'hit', _.filter([type1, type2]), max),
  ],
  [
    // "that deal damage" should never be used for this regex, but we leave it to keep groups consistent
    /([A-Z]{3}) \+(\d+|\?)% for each (.*) (ability|attack) used(?: that deal (.*) damage)?, up to \+?(\d+|\?)%/,
    ([stat, bonus, type1, hitOrAbility, type2, max]) =>
      describeBuildUp(stat, bonus, hitOrAbility, _.filter([type1, type2]), max),
  ],
  [
    /([A-Z]{3}) \+(\d+)% for each hit taken by damaging attacks, up to \+(\d+)%/,
    ([stat, bonus, max]) => `+${bonus}% ${stat} (max +${max}%) per hit taken`,
  ],

  // Conditional bonuses
  [
    /^Increases damage dealt by ((?:\d+\/)+\d+)% if ((?:\d+\/)+\d+) of the target's stats are lowered$/,
    ([bonus, statBreakCount]) => {
      const bonusDescription = bonus.split('/').join('-');
      return `+${bonusDescription}% dmg` + formatThreshold(statBreakCount, 'stats lowered');
    },
  ],

  // Starting statuses
  [/^Grants (.*) at the beginning of the battle$/, ([statuses]) => describeBattleStart(statuses)],

  // Unique variations of starting statuses.
  [
    /^Grants (.*) at the beginning of the battle, grants (.*) to the user when Reraise is triggered$/,
    ([statuses, reraiseStatus]) =>
      describeBattleStart(statuses) +
      ', ' +
      formatTriggeredEffect('Reraise', describeEnlirStatus(reraiseStatus)),
  ],
  [
    /^Grants (.*) at the beginning of the battle, begins the round with full ATB gauge$/,
    ([statuses]) => describeBattleStart(statuses) + ', full ATB at round start',
  ],

  // Triggered self statuses
  [
    /^(?:(\d+|\?)% chance (?:of|to grant)|[Gg]rants) (.*?)(?: for (\d+) seconds)? to the user after (?:using an? (.*) (?:ability|attack)|(dealing a critical hit)|(taking damage from an enemy))$/,
    ([percent, status, duration, schoolOrElement, critical, takeDamage]) => {
      // TODO: Consolidate trigger logic with status.ts?
      const trigger = schoolOrElement
        ? formatSchoolOrAbilityList(schoolOrElement)
        : critical
        ? 'crit'
        : 'take dmg';
      return formatTriggeredEffect(
        trigger,
        describeEnlirStatus(status) + (duration ? ' ' + duration + 's' : ''),
        percent,
      );
    },
  ],

  // Status recovery
  [
    /^(\d+)% chance to remove (.*) and (.*) to the user after being afflicted with .*$/,
    ([percentChance, statuses1, statuses2]) =>
      `${percentChance}% for auto-cure ${[...statuses1.split(', '), statuses2].join('/')}`,
  ],

  // Single-target white magic bonus effects
  [
    /^(\d+|\?)% chance to grant (.*) to the target after using a single-target White Magic ability that restores HP on an ally$/,
    ([percent, status]) =>
      formatTriggeredEffect('ally W.Mag heal', 'ally ' + describeEnlirStatus(status), percent),
  ],
  [
    /^(\d+|\?)% chance to remove negative effects to the target after using a single-target White Magic ability that restores HP on an ally$/,
    ([percent, status]) => formatTriggeredEffect('ally W.Mag heal', 'ally Esuna'),
  ],

  // Triggered simple skills and triggered named skills
  [
    /^(\d+|\?)% chance to cast (?:an ability \((.*)\)|(.*)) after (?:(using|dealing damage with) a (.*) (?:ability|attack)|(taking damage from an enemy))$/,
    ([percent, effect, skillName, isDamageTrigger, schoolOrAbility, takeDamage]) => {
      let description: string | null = null;
      if (effect) {
        description = resolveWithHandlers(simpleSkillHandlers, effect);
      } else {
        const otherSkill = getEnlirOtherSkill(skillName, 'Legend Materia');
        if (otherSkill) {
          description = formatMrP(
            describeEnlirSoulBreak(otherSkill, {
              abbreviate: true,
              showNoMiss: false,
              includeSbPoints: false,
              // Simple skills don't include schools, so, to be consistent,
              // we'll omit them for named schools too.
              includeSchool: false,
            }),
            {
              showTime: false,
            },
          );
        }
      }
      if (!description) {
        return null;
      }
      const trigger = schoolOrAbility
        ? getShortName(schoolOrAbility) + dmg(isDamageTrigger)
        : 'take dmg';
      return formatTriggeredEffect(trigger, description, percent);
    },
  ],

  // Counter-attacks
  [
    /(\d+|\?)% chance to counter (?:enemy )?(.*) attacks with an ability \((.*)\)$/,
    ([percent, attackType, effect]) => {
      const description = resolveWithHandlers(simpleSkillHandlers, effect);
      if (!description) {
        return null;
      }
      return formatTriggeredEffect(`foe's ${attackType} atk`, description, percent);
    },
  ],

  // Triggered status ailments (imperils)
  [
    /^(\d+|\?)% chance to cause (.*) to the target after (using|dealing damage with) a (.*) (?:ability|attack) on an enemy(?: when equipping (.*))?$/,
    ([percent, status, isDamageTrigger, schoolOrAbility, when]) => {
      const trigger = getShortName(schoolOrAbility) + dmg(isDamageTrigger) + whenDescription(when);
      return formatTriggeredEffect(trigger, describeEnlirStatus(status), percent);
    },
  ],

  // Trance effects
  [
    /^(Restores HP for 100% of the user's maximum HP(?:, grants (\d+|\?) SB points)? and )?[Gg]rants (.*?)(?: for (\d+) seconds)? when HP fall below 20%$/,
    ([isHeal, bonusSb, statusNames, duration]) => {
      const status = statusNames.split(andList).map(i => parseEnlirStatus(i));

      // Process duration from the last status - it's more likely to be interesting.
      const lastStatus = status[status.length - 1];
      if (duration) {
        duration = formatDuration(+duration, 'second');
      } else if (lastStatus.defaultDuration && !lastStatus.isVariableDuration) {
        duration = formatDuration(lastStatus.defaultDuration, 'second');
      }

      let statusDescription =
        status.map(i => (i.isTrance ? 'Trance: ' : '') + i.description).join(', ') +
        (duration ? ' ' + duration : '');
      if (bonusSb) {
        statusDescription = sbPointsAlias(bonusSb) + ', ' + statusDescription;
      }
      if (isHeal) {
        statusDescription = 'heal 100% HP, ' + statusDescription;
      }
      return formatTriggeredEffect(tranceTriggerText, statusDescription);
    },
  ],
  // Josef's unique LM2.  We ought to parse this using the same logic that we
  // do for the main function, but that's too much work...
  [
    /^Causes (.*), restores HP to all allies for (\d+|\?)% max HP and grants (.*) to all allies when HP fall below 20%$/,
    ([selfStatus, healPercent, partyStatus]) => {
      const selfStatusDescription = selfStatus
        .split(andList)
        .map(i => describeEnlirStatus(i))
        .join(', ');
      const partyStatusDescription = partyStatus
        .split(andList)
        .map(i => describeEnlirStatus(i))
        .join(', ');
      return formatTriggeredEffect(
        tranceTriggerText,
        `self ${selfStatusDescription}, party heal ${healPercent}% HP, ${partyStatusDescription}`,
      );
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
  [
    /^(\d+)% chance to reduce damage taken by (\d+)% when equipping (.*)$/,
    ([percentChance, percentDamage, when]) =>
      `${percentChance}% for -${percentDamage}% dmg taken${whenDescription(when)}`,
  ],

  // Drain HP
  [
    /^(\d+|\?)% chance of restoring HP to the user for (\d+|\?)% of the damage dealt with single-target (.*) attacks$/,
    ([percentChance, healPercent, type]) =>
      formatTriggeredEffect(
        `single-target ${formatSchoolOrAbilityList(type)}`,
        `heal ${healPercent}% of dmg`,
        percentChance,
      ),
  ],

  // Stat buffs and debuffs
  [
    /^Increases the duration of (.*) by (.*)%$/,
    ([what, percent]) => `${percentToMultiplier(percent)}x ${what} duration`,
  ],

  // Unique effects
  [
    /^Exploiting elemental weakness grants (\d+|\?)% more Soul Break points \(additive with the default 50% bonus\)$/,
    ([percent]) => formatTriggeredEffect(hitWeaknessTriggerText, `+${percent}% SB gauge`),
  ],
  [
    /^(\d+|\?)% chance to increase Gil gained at the end of battle by (\d+|\?)% when equipping (.*)$/,
    ([percentChance, percentBonus, when]) =>
      `${percentBonus}% for bonus ${percentBonus}% Gil${whenDescription(when)}`,
  ],
  [
    /^Increases base ([A-Z]{3}) by (\d+|\?)% base ([A-Z]{3})$/,
    ([statDest, percent, statSource]) => `add ${percent}% of ${statSource} to ${statDest}`,
  ],
];

export function describeMrPLegendMateria({ effect }: EnlirLegendMateria): string | null {
  const isUncertain = effect.endsWith('?');
  const result = resolveWithHandlers(legendMateriaHandlers, effect.replace(/\?$/, ''));
  if (result && isUncertain) {
    return result + '?';
  } else {
    return result;
  }
}
