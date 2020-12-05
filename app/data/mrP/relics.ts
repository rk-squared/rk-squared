import * as XRegExp from 'xregexp';

import { formatSchoolOrAbilityList, XRegExpNamedGroups } from './typeHelpers';
import { andList } from './util';

const level: { [s: string]: number } = {
  minor: 1,
  moderate: 2,
  ['mod.']: 2,
  major: 3,
};

const statusAlias: { [s: string]: string } = {
  'Instant KO': 'KO',
};

const formatLevel = (s: string) => '+'.repeat(level[s] || 1);
const formatStatus = (s: string) => statusAlias[s] || s;

const effectRe = XRegExp(
  String.raw`
  (?<realmSynergy>RS:\ )?
  (?:
    (?<gysahl>[Cc]hance\ to\ increase\ Gysahl\ Greens\ by\ \d+%)|
    HP\ \+(?<hp>\d+)|

    (?<elementResistWithStatus>.*?)\ resistance,
      \ (?<statusResistWithElement>.*?)\ immunity\ \((?<elementStatusResistAmount>[a-z.]+)\)|

    (?<statusResist>.*?)\ immunity\ \((?<statusResistAmount>[a-z.]+)\)|
    [Cc]hance\ to\ cause\ (?<inflictStatus>.*?)(?:\ \(\d+%\))?|
    (?<elementResist>.*?)\ resistance\ \((?<elementResistAmount>[a-z.]+)\)|
    (?<elementDamage>.*?)\ damage\ \+20%|
    (?<elementWeak>.*?)\ weakness
  )
  (?:$|,\ )
  `,
  'x',
);

const formatStatusResist = (status: string, lvl: string) =>
  formatLevel(lvl) +
  status
    .split(andList)
    .map(formatStatus)
    .join('/') +
  ' res';

const formatElementResist = (element: string, lvl: string) =>
  formatLevel(lvl) + formatSchoolOrAbilityList(element) + ' res';

const formatElementWeakness = (element: string) => formatSchoolOrAbilityList(element) + ' weak';

export function describeRelicEffect(effect: string | null): string | null {
  if (!effect) {
    return null;
  }

  const result: string[] = [];
  XRegExp.forEach(effect, effectRe, match => {
    const m = (match as any) as XRegExpNamedGroups;
    let thisPart = '';
    if (m.realmSynergy) {
      thisPart = 'RS ';
    }

    if (m.statusResist) {
      thisPart += formatStatusResist(m.statusResist, m.statusResistAmount);
    } else if (m.inflictStatus) {
      thisPart += '% ' + formatStatus(m.inflictStatus);
    } else if (m.elementDamage) {
      thisPart += '+' + formatSchoolOrAbilityList(m.elementDamage) + ' dmg';
    } else if (m.elementResist) {
      thisPart += formatElementResist(m.elementResist, m.elementResistAmount);
    } else if (m.elementResistWithStatus) {
      thisPart +=
        formatElementResist(m.elementResistWithStatus, m.elementStatusResistAmount) +
        ', ' +
        formatStatusResist(m.statusResistWithElement, m.elementStatusResistAmount);
    } else if (m.elementWeak) {
      thisPart += formatElementWeakness(m.elementWeak);
    } else if (m.hp) {
      thisPart += `HP +${m.hp}`;
    } else if (m.gysahl) {
      thisPart += '% Gysahl';
    }

    result.push(thisPart);
  });
  return result.join(', ');
}
