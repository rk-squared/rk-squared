#!/usr/bin/env npx ts-node

import * as _ from 'lodash';
import * as yargs from 'yargs';

import { enlir, tierOrder } from '../app/data/enlir';
import { describeEnlirSoulBreak, formatMrP } from '../app/data/mrP';
import { formatBraveCommands } from '../app/data/mrP/brave';

// tslint:disable: no-console

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

for (const sb of _.sortBy(Object.values(enlir.soulBreaks), [
  'character',
  i => tierOrder[i.tier],
  'id',
])) {
  if (sb.tier === 'RW') {
    continue;
  }
  if (onlySoulBreaks.length && onlySoulBreaks.indexOf(sb.name) === -1) {
    continue;
  }

  const mrP = describeEnlirSoulBreak(sb);

  if (filtered) {
    if ((argv.brave && !mrP.braveCommands) || (argv.burst && !mrP.burstCommands)) {
      continue;
    }
  }

  const text = formatMrP(mrP);
  console.log(sb.character + ': ' + sb.tier + ': ' + sb.name);
  console.log(text || '???');
  if (mrP.braveCommands) {
    // console.log('    [' + getSchoolShortName(mrP.braveCommands[0].school) + '], +1 on ' + mrP.braveCondition.map(getShortName).join(', ');
    console.log('    ' + formatBraveCommands(mrP.braveCommands));
  }
  if (mrP.burstCommands) {
    for (const i of mrP.burstCommands) {
      console.log('    ' + formatMrP(i));
    }
  }
  console.log();
}
