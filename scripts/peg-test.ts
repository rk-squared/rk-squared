#!/usr/bin/env -S npx ts-node

import * as _ from 'lodash';

import { enlir, tierOrder } from '../app/data/enlir';
import { parse } from '../app/data/mrp/skillParser';

// tslint:disable: no-console

for (const sb of _.sortBy(Object.values(enlir.soulBreaks), [
  i => i.character || '-',
  i => tierOrder[i.tier],
  'id',
])) {
  if (sb.tier === 'RW') {
    continue;
  }

  console.log((sb.character || '-') + ': ' + sb.tier + ': ' + sb.name);
  console.log(sb.effects);
  try {
    console.log(parse(sb.effects));
  } catch (e) {
    console.log(e.message);
  }
  console.log();
}

for (const ability of _.sortBy(Object.values(enlir.abilities), 'name')) {
  console.log(ability.name);
  console.log(ability.effects);
  try {
    console.log(parse(ability.effects));
  } catch (e) {
    console.log(e.message);
  }
  console.log();
}
