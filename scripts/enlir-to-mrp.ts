#!/usr/bin/env npx ts-node
import { enlir } from '../app/data/enlir';
import { describeEnlirSoulBreak, formatMrP } from '../app/data/mrP';

import * as _ from 'lodash';

for (const sb of _.sortBy(Object.values(enlir.soulBreaks), 'character')) {
  if (sb.tier === 'RW') {
    continue;
  }
  console.log(sb.character + ': ' + sb.name);
  const mrP = describeEnlirSoulBreak(sb);
  let text = formatMrP(mrP);
  console.log(text || '???');
}
