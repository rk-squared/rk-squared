#!/usr/bin/env -S npx ts-node

import * as _ from 'lodash';
import * as yargs from 'yargs';

import { enlir, soulBreakTierOrder } from '../app/data/enlir';
import { formatBraveCommands } from '../app/data/mrP/brave';
import { convertEnlirSkillToMrP, formatMrPSkill } from '../app/data/mrP/skill';
import { getShortName } from '../app/data/mrP/typeHelpers';
import { logForCli } from '../app/utils/logger';

// tslint:disable: no-console
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

for (const sb of _.sortBy(enlir.allSoulBreaks, [
  i => i.character || '-',
  i => soulBreakTierOrder[i.tier],
  'id',
])) {
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
      console.log('    [' + getShortName(mrP.synchroCondition[i]) + ']');
      console.log('    ' + formatMrPSkill(mrP.synchroCommands[i]));
    }
  }
  console.log();
}

const endTime = process.hrtime(startTime);
console.warn('Finished in %ds %dms', endTime[0], endTime[1] / 1000000);
