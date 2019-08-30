#!/usr/bin/env npx ts-node

import * as _ from 'lodash';

import { enlir } from '../app/data/enlir';
import { describeEnlirSoulBreak, formatMrP } from '../app/data/mrP';

// tslint:disable: no-console

const onlyAbilities = process.argv.slice(2);

for (const ability of _.sortBy(Object.values(enlir.abilities), [
  i => -i.rarity,
  'school',
  'name',
])) {
  if (onlyAbilities.length && onlyAbilities.indexOf(ability.name) === -1) {
    continue;
  }

  const mrP = describeEnlirSoulBreak(ability);

  const text = formatMrP(mrP);
  console.log(ability.name + ` (${ability.rarity}* ${ability.school}): ` + text);
}
