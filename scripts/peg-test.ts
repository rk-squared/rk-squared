#!/usr/bin/env -S npx ts-node

import * as _ from 'lodash';
import * as yargs from 'yargs';

import { enlir, tierOrder } from '../app/data/enlir';
import { parse } from '../app/data/mrp/skillParser';

// tslint:disable: no-console

const argv = yargs
  .strict()
  .option('filter', {
    description: 'Filter for name',
    type: 'string',
  })
  .option('hideSuccesses', {
    description: 'Hide successful parses',
    default: false,
    boolean: true,
  })
  .option('hideFailures', {
    description: 'Hide failed parses',
    default: false,
    boolean: true,
  }).argv;

function processEffects<T extends { name: string; effects: string }>(
  what: string,
  items: T[],
  getName: (item: T) => string,
) {
  let successCount = 0;
  let totalCount = 0;
  for (const i of items) {
    if (argv.filter && !i.name.match(argv.filter)) {
      continue;
    }
    let parseResults: any;
    let parseError: string = '';
    totalCount++;
    try {
      parseResults = parse(i.effects);
      successCount++;
    } catch (e) {
      parseError = e.message;
    }

    if ((parseResults && !argv.hideSuccesses) || (parseError && !argv.hideFailures)) {
      console.log(getName(i));
      console.log(i.effects);
      if (parseResults) {
        console.dir(parseResults, { depth: null });
      }
      if (parseError) {
        console.log(parseError);
      }
      console.log();
    }
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
