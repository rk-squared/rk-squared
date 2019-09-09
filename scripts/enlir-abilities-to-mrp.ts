#!/usr/bin/env npx ts-node

import * as _ from 'lodash';

import { enlir } from '../app/data/enlir';
import { describeEnlirSoulBreak, formatMrP } from '../app/data/mrP';
import { getOrbCosts } from '../app/data/orbDetails';

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

  try {
    const mrP = describeEnlirSoulBreak(ability);

    const text = formatMrP(mrP);
    const costs = getOrbCosts(ability);
    const costText = '(' + costs.map(i => i.cost + ' ' + i.orbType).join(', ') + ')';
    console.log(ability.name + ` (${ability.rarity}* ${ability.school}): ` + text + ' ' + costText);
  } catch (e) {
    console.error(`Failed to process ${ability.name}`);
    console.error(e);
  }
}
