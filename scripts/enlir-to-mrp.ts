#!/usr/bin/env -S npx ts-node

import * as _ from 'lodash';
import * as yargs from 'yargs';

import { enlir, isLimitBreak, limitBreakTierOrder, soulBreakTierOrder } from '../app/data/enlir';
import { formatBraveCommands } from '../app/data/mrP/brave';
import { convertEnlirSkillToMrP, formatMrPSkill } from '../app/data/mrP/skill';
import { formatSchoolOrAbilityList, getShortName } from '../app/data/mrP/typeHelpers';
import { logForCli } from '../app/utils/logger';

logForCli();

const argv = yargs
  .option('brave', {
    default: false,
    description: 'Only brave commands',
  })
  .option('burst', {
    default: false,
    description: 'Only burst commands',
  }).argv;

const filtered = argv.brave || argv.burst;

const onlySoulBreaks = process.argv.slice(2);

const startTime = process.hrtime();

for (const sb of _.sortBy(
  [...enlir.allSoulBreaks, ...Object.values(enlir.limitBreaks)],
  [
    i => i.character || '-',
    i => (isLimitBreak(i) ? limitBreakTierOrder[i.tier] + 1000 : soulBreakTierOrder[i.tier]),
    'id',
  ],
)) {
  if (sb.tier === 'RW') {
    continue;
  }
  if (onlySoulBreaks.length && onlySoulBreaks.indexOf(sb.name) === -1) {
    continue;
  }

  const mrP = convertEnlirSkillToMrP(sb);

  if (filtered) {
    if ((argv.brave && !mrP.braveCommands) || (argv.burst && !mrP.burstCommands)) {
      continue;
    }
  }

  const text = formatMrPSkill(mrP);
  console.log((sb.character || '-') + ': ' + sb.tier + ': ' + sb.name);
  console.log(text || '???');
  if (mrP.braveCommands) {
    console.log(
      '    [' +
        getShortName(mrP.braveCommands[0].school || '?') +
        '], +1 on ' +
        (mrP.braveCondition || []).map(getShortName).join(', '),
    );
    console.log('    ' + formatBraveCommands(mrP.braveCommands));
  }
  if (mrP.burstCommands) {
    for (const i of mrP.burstCommands) {
      console.log('    ' + formatMrPSkill(i));
    }
  }
  if (mrP.synchroCondition && mrP.synchroCommands) {
    for (let i = 0; i < mrP.synchroCommands.length; i++) {
      const detail = mrP.synchroCommands[i].commandDetail
        ? ', ' + mrP.synchroCommands[i].commandDetail
        : '';
      console.log('    [' + formatSchoolOrAbilityList(mrP.synchroCondition[i]) + ']' + detail);
      console.log('    ' + formatMrPSkill(mrP.synchroCommands[i]));
    }
  }
  if (mrP.guardianCommands) {
    for (const i of mrP.guardianCommands) {
      console.log('    ' + formatMrPSkill(i));
    }
  }
  console.log();
}

const endTime = process.hrtime(startTime);
console.warn('Finished in %ds %dms', endTime[0], endTime[1] / 1000000);
