#!/usr/bin/env -S npx ts-node

import * as _ from 'lodash';
import * as yargs from 'yargs';

import { enlir, tierOrder } from '../app/data/enlir';
import { parse, SyntaxError } from '../app/data/mrp/skillParser';

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
  })

  .option('soulBreaks', {
    description: 'Show soul breaks',
    default: false,
    boolean: true,
  })
  .option('abilities', {
    description: 'Show abilities',
    default: false,
    boolean: true,
  })
  .option('burst', {
    description: 'Show synchro commands',
    default: false,
    boolean: true,
  })
  .option('brave', {
    description: 'Show brave commands',
    default: false,
    boolean: true,
  })
  .option('synchro', {
    description: 'Show synchro commands',
    default: false,
    boolean: true,
  })
  .option('other', {
    description: "Show 'other' skills",
    default: false,
    boolean: true,
  }).argv;

function processEffects<T extends { name: string; effects: string }>(
  what: keyof typeof argv,
  items: T[],
  getName: (item: T) => string,
): [keyof typeof argv, number, number] {
  let successCount = 0;
  let totalCount = 0;
  for (const i of items) {
    if (argv.filter && !i.name.match(argv.filter)) {
      continue;
    }
    let parseResults: any;
    let parseError: SyntaxError | undefined;
    totalCount++;
    try {
      parseResults = parse(i.effects);
      successCount++;
    } catch (e) {
      if (e.name !== 'SyntaxError') {
        throw e;
      }
      parseError = e;
    }

    if (
      (argv[what] || argv.filter) &&
      ((parseResults && !argv.hideSuccesses) || (parseError && !argv.hideFailures))
    ) {
      console.log(getName(i));
      console.log(i.effects);
      if (parseResults) {
        console.dir(parseResults, { depth: null });
      }
      if (parseError) {
        console.log(' '.repeat(parseError.location.start.offset) + '^');
        console.log(parseError.message);
      }
      console.log();
    }
  }
  return [what, successCount, totalCount];
}

function processSoulBreaks() {
  return processEffects(
    'soulBreaks',
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

const getCommandName = <T extends { character: string; source: string; name: string }>({
  character,
  source,
  name,
}: T) => `${character} - ${source} - ${name}`;

function processBurst() {
  return processEffects(
    'burst',
    _.sortBy(Object.values(enlir.burstCommands), ['character', 'id']),
    getCommandName,
  );
}

function processBrave() {
  return processEffects(
    'brave',
    _.sortBy(Object.values(enlir.braveCommands), ['character', 'id']),
    getCommandName,
  );
}

function processSynchro() {
  return processEffects(
    'synchro',
    _.sortBy(Object.values(enlir.synchroCommands), ['character', 'id']),
    getCommandName,
  );
}

function processOther() {
  return processEffects(
    'other',
    _.sortBy(Object.values(enlir.otherSkills), 'name'),
    other => other.name,
  );
}

const result = [
  processSoulBreaks(),
  processBurst(),
  processBrave(),
  processSynchro(),
  processOther(),
  processAbilities(),
];
let grandTotalSuccessCount = 0;
let grandTotalCount = 0;
for (const [what, successCount, totalCount] of result) {
  console.log(`Processed ${successCount} of ${totalCount} ${what}`);
  grandTotalSuccessCount += successCount;
  grandTotalCount += totalCount;
}
console.log(`Final counts: Processed ${grandTotalSuccessCount} of ${grandTotalCount}`);
