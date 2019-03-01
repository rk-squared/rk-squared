#!/usr/bin/env npx ts-node

import * as _ from 'lodash';
import * as yargs from 'yargs';

import { enlir } from '../app/data/enlir';
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

for (const sb of _.sortBy(Object.values(enlir.soulBreaks), 'character')) {
  if (sb.tier === 'RW') {
    continue;
  }

  const mrP = describeEnlirSoulBreak(sb);

  if (filtered) {
    if ((argv.brave && !mrP.braveCommands) || (argv.burst && !mrP.burstCommands)) {
      continue;
    }
  }

  console.log();
  const text = formatMrP(mrP);
  console.log(sb.character + ': ' + sb.name);
  console.log(text || '???');
  if (mrP.braveCommands) {
    console.log('    ' + formatBraveCommands(mrP.braveCommands));
  }
  if (mrP.burstCommands) {
    for (const i of mrP.burstCommands) {
      console.log('    ' + formatMrP(i));
    }
  }
}
