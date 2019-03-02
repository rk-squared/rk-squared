#!/usr/bin/env npx ts-node

import * as _ from 'lodash';
import * as yargs from 'yargs';

import { enlir, EnlirSoulBreakTier } from '../app/data/enlir';
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

const tierOrder: { [t in EnlirSoulBreakTier]: number } = {
  Default: 0,
  SB: 1,
  SSB: 2,
  BSB: 3,
  Glint: 4,
  'Glint+': 5,
  OSB: 6,
  AOSB: 7,
  USB: 8,
  AASB: 9,
  CSB: 10,
  RW: 100,
  Shared: 101,
};

for (const sb of _.sortBy(Object.values(enlir.soulBreaks), [
  'character',
  i => tierOrder[i.tier],
  'id',
])) {
  if (sb.tier === 'RW') {
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
    console.log('    ' + formatBraveCommands(mrP.braveCommands));
  }
  if (mrP.burstCommands) {
    for (const i of mrP.burstCommands) {
      console.log('    ' + formatMrP(i));
    }
  }
  console.log();
}
