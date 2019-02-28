#!/usr/bin/env npx ts-node
import { enlir } from '../app/data/enlir';
import { describeEnlirSoulBreak, formatMrP } from '../app/data/mrP';

import * as _ from 'lodash';

// tslint:disable: no-console

for (const sb of _.sortBy(Object.values(enlir.soulBreaks), 'character')) {
  if (sb.tier === 'RW') {
    continue;
  }
  const mrP = describeEnlirSoulBreak(sb);
  const text = formatMrP(mrP);
  console.log(sb.character + ': ' + sb.name);
  console.log(text || '???');
  if (mrP.braveCommands) {
    for (const i of mrP.braveCommands) {
      console.log('    ' + formatMrP(i));
    }
  }
  if (mrP.burstCommands) {
    for (const i of mrP.burstCommands) {
      console.log('    ' + formatMrP(i));
    }
  }
}
