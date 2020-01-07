/**
 * @file
 * Support for Rage statuses and effects in particular.  Parts of this may fit
 * logically under status.ts, skill.ts, and/or attack.ts, but it's specialized
 * and interrelated, so we'll keep it together.
 */

import * as _ from 'lodash';

import { enlir, EnlirOtherSkill, EnlirSkill } from '../enlir';
import { convertEnlirSkillToMrP, formatMrPSkill, safeParseSkill } from './skill';
import * as skillTypes from './skillTypes';
import { describeChances, enDashJoin } from './util';

export function getRageSkills(source: EnlirSkill | string): EnlirOtherSkill[] {
  const name = typeof source === 'string' ? source : source.name;
  return enlir.otherSkills.filter(
    i => i.sourceType === 'Rage Status' && i.source.startsWith(name + ' ('),
  );
}

export function describeRageEffects(source: EnlirSkill | string) {
  const rageSkills = getRageSkills(source);
  const format = (skill: EnlirSkill) =>
    formatMrPSkill(
      convertEnlirSkillToMrP(skill, {
        abbreviate: true,
        showNoMiss: false,
      }),
    );
  if (rageSkills.length === 0) {
    // Does not appear to actually be used.
    return 'auto repeat';
  } else if (rageSkills.length === 1) {
    return 'auto ' + format(rageSkills[0]);
  } else {
    // Fall back to 0% chance just to avoid special cases...
    const chances = rageSkills.map(i => i.source.match(/\((\d+)%\)$/)).map(i => (i ? +i[1] : 0));
    const result = describeChances(rageSkills.map(format), chances, enDashJoin);
    return 'auto ' + _.filter(result).join(' ');
  }
}

function isPureRage(skill: EnlirSkill, skillEffectsWithoutRage: skillTypes.SkillEffect): boolean {
  if (skillEffectsWithoutRage.length === 1) {
    const effect = skillEffectsWithoutRage[0];
    if (effect.type === 'randomCastOther' && effect.other === skill.name) {
      // This skill's only effect is to randomly cast an ability.  The Rage
      // status's effect would be to randomly cast that same ability.
      return true;
    }
  }

  const rageSkills = getRageSkills(skill);
  if (rageSkills.length === 1) {
    const rageEffects = safeParseSkill(rageSkills[0]);
    if (!rageEffects) {
      return false;
    }

    if (_.isEqual(skillEffectsWithoutRage, rageEffects)) {
      // The Rage status for this skill always does a single skill, and that
      // single skill is identical to this ability.
      return true;
    }
  }

  return false;
}

/**
 * Check whether the given skill is a "pure rage" skill - i.e., one that grants
 * Rage and whose other effects are identical to the actions done while under
 * rage.  We treat those specially by combining them together.  For example,
 *
 * phys 1.5 (NAT), 2 turns: auto phys p1.5 (NAT)
 *
 * becomes
 *
 * 3 turns: phys 1.5 (NAT)
 *
 * @returns Duration and modified skill effects (without rage)
 */
export function checkPureRage(
  skill: EnlirSkill,
  skillEffects: skillTypes.SkillEffect,
): [number, skillTypes.SkillEffect] | undefined {
  const effectIndex = _.findIndex(
    skillEffects,
    i => i.type === 'status' && i.statuses.find(j => j.status === 'Rage') != null,
  );
  if (effectIndex === -1) {
    // Normal case - no Rage status.
    return undefined;
  }
  const effect = skillEffects[effectIndex] as skillTypes.StatusEffect;

  const statusIndex = _.findIndex(effect.statuses, i => i.status === 'Rage');
  const status = effect.statuses[statusIndex];
  if (!status.duration || status.duration.units !== 'turns') {
    // There's a Rage status, but it has no duration.  This should never
    // happen.
    return undefined;
  }

  // See what the effects would look like without the Rage status.
  const effectWithoutRage = _.cloneDeep(effect);
  const skillEffectsWithoutRage = skillEffects.slice();
  effectWithoutRage.statuses.splice(statusIndex, 1);
  if (!effectWithoutRage.statuses.length) {
    skillEffectsWithoutRage.splice(effectIndex, 1);
  } else {
    skillEffectsWithoutRage[effectIndex] = effectWithoutRage;
  }

  if (!isPureRage(skill, skillEffectsWithoutRage)) {
    return undefined;
  }

  // Add one to account for this turn itself.
  return [status.duration.value + 1, skillEffectsWithoutRage];
}
