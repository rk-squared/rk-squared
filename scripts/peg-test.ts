#!/usr/bin/env -S npx ts-node

import * as _ from 'lodash';

import { enlir, tierOrder } from '../app/data/enlir';
import { parse } from '../app/data/mrp/skillParser';

// tslint:disable: no-console

function processEffects<T extends { effects: string }>(
  what: string,
  items: T[],
  getName: (item: T) => string,
) {
  let successCount = 0;
  let totalCount = 0;
  for (const i of items) {
    console.log(getName(i));
    console.log(i.effects);
    totalCount++;
    try {
      console.dir(parse(i.effects), { depth: null });
      successCount++;
    } catch (e) {
      console.log(e.message);
    }
    console.log();
  }
  return [what, successCount, totalCount];
}

function processSoulBreaks() {
  return processEffects(
    'soul breaks',
    _.sortBy(Object.values(enlir.soulBreaks), [
      i => i.character || '-',
      i => tierOrder[i.tier],
      'id',
    ]).filter(sb => sb.tier !== 'RW'),
    sb => (sb.character || '-') + ': ' + sb.tier + ': ' + sb.name,
  );
}

function processAbilities() {
  return processEffects(
    'abilities',
    _.sortBy(Object.values(enlir.abilities), 'name'),
    ability => ability.name,
  );
}

const result = [processSoulBreaks(), processAbilities()];
for (const [what, successCount, totalCount] of result) {
  console.log(`Processed ${successCount} of ${totalCount} ${what}`);
}
