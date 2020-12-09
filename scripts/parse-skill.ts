#!/usr/bin/env -S npx ts-node

import * as _ from 'lodash';
import * as process from 'process';
import * as yargs from 'yargs';

import { enlir, EnlirSkill, getEffects, soulBreakTierOrder } from '../app/data/enlir';
import { convertEnlirSkillToMrP, formatMrPSkill } from '../app/data/mrp/skill';
import { parse, SyntaxError } from '../app/data/mrp/skillParser';
import { SkillEffect } from '../app/data/mrP/skillTypes';

const argv = yargs
  .strict()

  .option('json', {
    description: 'Output as JSON',
    default: false,
    boolean: true,
  })

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

  .option('all', {
    description: 'Show all categories',
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
  })
  .option('limitBreaks', {
    description: 'Show limit breaks',
    default: false,
    boolean: true,
  }).argv;

const jsonOutput: any = {};

function processEffects<T extends EnlirSkill>(
  what: keyof typeof argv,
  items: T[],
  getName: (item: T) => string,
): [keyof typeof argv, number, number] {
  function shouldShow(parseResults: SkillEffect | undefined, parseError: SyntaxError | undefined) {
    return (
      (argv[what] || argv.filter || argv.all) &&
      ((parseResults && !argv.hideSuccesses) || (parseError && !argv.hideFailures))
    );
  }

  function showText(
    item: T,
    parseResults: SkillEffect | undefined,
    parseError: SyntaxError | undefined,
  ) {
    console.log(getName(item));
    console.log(getEffects(item));
    if (parseResults) {
      console.dir(parseResults, { depth: null });
      const mrP = convertEnlirSkillToMrP(item);
      const text = formatMrPSkill(mrP);
      console.log(text);
    }
    if (parseError) {
      console.log(' '.repeat(parseError.location.start.offset) + '^');
      console.log(parseError.message);
    }
    console.log();
  }

  function showJson(
    item: T,
    parseResults: SkillEffect | undefined,
    parseError: SyntaxError | undefined,
  ) {
    jsonOutput[what] = jsonOutput[what] || [];
    const mrPText = parseResults ? formatMrPSkill(convertEnlirSkillToMrP(item)) : undefined;
    jsonOutput[what].push({
      ...item,
      detail: parseResults,
      detailError: parseError,
      mrP: mrPText,
    });
  }

  let successCount = 0;
  let totalCount = 0;
  for (const i of items) {
    if (argv.filter && !i.name.match(argv.filter)) {
      continue;
    }
    let parseResults: SkillEffect | undefined;
    let parseError: SyntaxError | undefined;
    totalCount++;
    try {
      parseResults = parse(i.effects);
      successCount++;
    } catch (e) {
      if (e.name !== 'SyntaxError') {
        console.log(getName(i));
        console.log(getEffects(i));
        throw e;
      }
      parseError = e;
    }

    if (shouldShow(parseResults, parseError)) {
      (argv.json ? showJson : showText)(i, parseResults, parseError);
    }
  }
  return [what, successCount, totalCount];
}

function processSoulBreaks() {
  return processEffects(
    'soulBreaks',
    _.sortBy(enlir.allSoulBreaks, [
      i => i.character || '-',
      i => soulBreakTierOrder[i.tier],
      'id',
    ]).filter(sb => sb.tier !== 'RW'),
    sb => (sb.character || '-') + ': ' + sb.tier + ': ' + sb.name,
  );
}

function processAbilities() {
  return processEffects(
    'abilities',
    _.sortBy(_.values(enlir.abilities), 'name'),
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
    _.sortBy(_.flatten(_.values(enlir.burstCommands)), ['character', 'id']),
    getCommandName,
  );
}

function processBrave() {
  return processEffects(
    'brave',
    _.sortBy(_.flatten(_.values(enlir.braveCommands)), ['character', 'id']),
    getCommandName,
  );
}

function processSynchro() {
  return processEffects(
    'synchro',
    _.sortBy(_.flatten(_.values(enlir.synchroCommands)), ['character', 'id']),
    getCommandName,
  );
}

function processOther() {
  return processEffects(
    'other',
    _.sortBy(_.values(enlir.otherSkills), 'name'),
    other => other.name,
  );
}

function processLimitBreaks() {
  return processEffects(
    'limitBreaks',
    _.sortBy(_.values(enlir.limitBreaks), ['character', 'id']),
    lb => (lb.character || '-') + ': ' + lb.tier + ': ' + lb.name,
  );
}

export function main() {
  const result = [
    processSoulBreaks(),
    processBurst(),
    processBrave(),
    processSynchro(),
    processOther(),
    processAbilities(),
    processLimitBreaks(),
  ];
  if (argv.json) {
    console.log(JSON.stringify(jsonOutput, null, 2));
  }
  let grandTotalSuccessCount = 0;
  let grandTotalCount = 0;
  for (const [what, successCount, totalCount] of result) {
    process.stderr.write(`Processed ${successCount} of ${totalCount} ${what}\n`);
    grandTotalSuccessCount += successCount;
    grandTotalCount += totalCount;
  }
  const grandTotalFailedCount = grandTotalCount - grandTotalSuccessCount;
  process.stderr.write(
    `Final counts: Processed ${grandTotalSuccessCount} of ${grandTotalCount}, failed to process ${grandTotalFailedCount}\n`,
  );
}

if (require.main === module) {
  main();
}
