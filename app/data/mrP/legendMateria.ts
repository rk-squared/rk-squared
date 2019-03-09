import { EnlirLegendMateria } from '../enlir';
import { describeEnlirStatus, formatTriggeredEffect } from './status';
import { getShortName } from './types';
import { andList, percentToMultiplier } from './util';

export function formatMrPLegendMateria({ effect }: EnlirLegendMateria): string {
  let m: RegExpMatchArray | null;
  if (
    (m = effect.match(/^(\d+)% chance to dualcast abilities that deal (\w+) damage$/)) ||
    (m = effect.match(/^(\d+)% chance to dualcast (.*) abilities$/))
  ) {
    const [, percent, schoolOrElement] = m;
    return `${percent}% dualcast ${getShortName(schoolOrElement)}`;
  } else if (
    (m = effect.match(/^Increases (\w+) damage dealt by (\d+)%$/)) ||
    (m = effect.match(/^(\w+) (?:abilities|attacks) deal (\d+)% more damage$/))
  ) {
    const [, schoolOrElement, percent] = m;
    const multiplier = percentToMultiplier(+percent);
    return `${multiplier}x ${getShortName(schoolOrElement)} dmg`;
  } else if ((m = effect.match(/^Grants (.*) at the beginning of the battle$/))) {
    const statuses = m[1].split(andList);
    return statuses.map(i => describeEnlirStatus(i)).join(', ') + ' at battle start';
  } else if ((m = effect.match(/^WHT abilities restore (\d+)% more HP$/))) {
    const [, percent] = m;
    const multiplier = percentToMultiplier(+percent);
    return `${multiplier}x WHT healing`;
  } else if (
    (m = effect.match(/^(\d+)% chance to grant (.*) to the user after using an? (.*) ability$/))
  ) {
    const [, percent, status, schoolOrElement] = m;
    return formatTriggeredEffect(
      `${percent}% of ${getShortName(schoolOrElement)}`,
      describeEnlirStatus(status),
    );
  } else if (
    (m = effect.match(
      /^(\d+)% chance to grant (.*) to the target after using a single-target White Magic ability that restores HP on an ally$/,
    ))
  ) {
    const [, percent, status] = m;
    return formatTriggeredEffect(`${percent}% of ally W.Mag heal`, describeEnlirStatus(status));
  } else {
    return '"' + effect + '"';
  }
}
