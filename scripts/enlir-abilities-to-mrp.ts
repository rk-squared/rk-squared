#!/usr/bin/env npx ts-node

import * as _ from 'lodash';
import * as yargs from 'yargs';

import { enlir, tierOrder } from '../app/data/enlir';
import { describeEnlirSoulBreak, formatMrP } from '../app/data/mrP';
import { getShortName } from '../app/data/mrP/types';

// tslint:disable: no-console

for (const ability of _.sortBy(Object.values(enlir.abilities), [
  i => -i.rarity,
  'school',
  'name',
])) {
  const mrP = describeEnlirSoulBreak(ability);

  const text = formatMrP(mrP);
  console.log(ability.name + ` (${ability.rarity}* ${ability.school}): ` + text);
}
