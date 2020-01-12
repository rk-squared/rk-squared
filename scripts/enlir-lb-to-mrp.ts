#!/usr/bin/env -S npx ts-node

import * as _ from 'lodash';

import { enlir, limitBreakTierOrder } from '../app/data/enlir';
import { convertEnlirSkillToMrP, formatMrPSkill } from '../app/data/mrP/skill';

// tslint:disable: no-console

const onlyLimitBreaks = process.argv.slice(2);

const startTime = process.hrtime();

for (const lb of _.sortBy(Object.values(enlir.limitBreaks), [
  i => i.character || '-',
  i => limitBreakTierOrder[i.tier],
  'id',
])) {
  if (onlyLimitBreaks.length && onlyLimitBreaks.indexOf(lb.name) === -1) {
    continue;
  }

  const mrP = convertEnlirSkillToMrP(lb);

  const text = formatMrPSkill(mrP);
  console.log((lb.character || '-') + ': ' + lb.tier + ': ' + lb.name);
  console.log(text || '???');
}

const endTime = process.hrtime(startTime);
console.warn('Finished in %ds %dms', endTime[0], endTime[1] / 1000000);
