#!/usr/bin/env npx ts-node
import { enlir } from '../app/data/enlir';
import { describeEnlirSoulBreak } from '../app/data/mrP';

import _ from 'lodash';

for (const sb of Object.values(enlir.soulBreaks)) {
  console.log(sb.character + ': ' + sb.name);
  const mrP = describeEnlirSoulBreak(sb);
  console.log((mrP && mrP.damage) || '???');
}
