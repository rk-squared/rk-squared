#!/usr/bin/env -S npx ts-node

import * as _ from 'lodash';
import * as process from 'process';
import * as yargs from 'yargs';

import { enlir, EnlirStatus } from '../app/data/enlir';
import { parseEnlirStatus } from '../app/data/mrP/status';
import { parse, SyntaxError } from '../app/data/mrp/statusParser';
import { StatusEffect } from '../app/data/mrP/statusTypes';

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
  }).argv;

const jsonOutput: any[] = [];

// Skip internal, bookkeeping, or otherwise special statuses.
const skipStatuses = new Set<string>([
  'Defend',
  'General Set Status',
  'General Remove Status',
  'General Set Status While Synchro',
  'General Value v2',
  'Status Level in Synchro Mode',
  'Increase Status Level',
  'Decrease Status Level',
  'Set Status Level',
  'Attach Element',
  'Max Attach Element Level',
  'KO',
  'Doom',
  'Remove',
  'Invisible',
  'Stun',
  // Description in Enlir is "Can't act" - that may be an error, or it may be internal only
  'Reraise',
]);

function shouldAlwaysSkip(status: EnlirStatus) {
  // Skip Nightmare statuses; these often have unique mechanics that aren't
  // relevant for characters.
  return skipStatuses.has(status.name) || status.name.startsWith('Nightmare ');
}

function processStatuses(): [number, number] {
  const items = enlir.statusByName;
  function shouldShow(parseResults: StatusEffect | undefined, parseError: SyntaxError | undefined) {
    return (parseResults && !argv.hideSuccesses) || (parseError && !argv.hideFailures);
  }

  function showText(
    item: EnlirStatus,
    parseResults: StatusEffect | undefined,
    parseError: SyntaxError | undefined,
  ) {
    console.log(item.id + ' - ' + item.name);
    console.log(item.effects);
    if (parseResults) {
      console.dir(parseResults, { depth: null });
      console.dir(parseEnlirStatus(item.name), { depth: null });
    }
    if (parseError) {
      console.log(' '.repeat(parseError.location.start.offset) + '^');
      console.log(parseError.message);
    }
    console.log();
  }

  function showJson(
    item: EnlirStatus,
    parseResults: StatusEffect | undefined,
    parseError: SyntaxError | undefined,
  ) {
    const mrPText = parseResults ? '' /*formatMrPSkill(convertEnlirSkillToMrP(item))*/ : undefined;
    jsonOutput.push({
      ...item,
      detail: parseResults,
      detailError: parseError,
      mrP: mrPText,
    });
  }

  let successCount = 0;
  let totalCount = 0;
  _.forEach(items, i => {
    if (
      shouldAlwaysSkip(i) ||
      (argv.filter && !i.name.match(argv.filter) && i.id.toString() !== argv.filter)
    ) {
      return;
    }
    let parseResults: StatusEffect | undefined;
    let parseError: SyntaxError | undefined;
    totalCount++;
    try {
      parseResults = parse(i.effects);
      successCount++;
    } catch (e) {
      if (e.name !== 'SyntaxError') {
        console.log(i.name);
        console.log(i.effects);
        throw e;
      }
      parseError = e;
    }

    if (shouldShow(parseResults, parseError)) {
      (argv.json ? showJson : showText)(i, parseResults, parseError);
    }
  });
  return [successCount, totalCount];
}

const result = [processStatuses()];
if (argv.json) {
  console.log(JSON.stringify(jsonOutput, null, 2));
}
let grandTotalSuccessCount = 0;
let grandTotalCount = 0;
for (const [successCount, totalCount] of result) {
  process.stderr.write(`Processed ${successCount} of ${totalCount}\n`);
  grandTotalSuccessCount += successCount;
  grandTotalCount += totalCount;
}
const grandTotalFailedCount = grandTotalCount - grandTotalSuccessCount;
process.stderr.write(
  `Final counts: Processed ${grandTotalSuccessCount} of ${grandTotalCount}, failed to process ${grandTotalFailedCount}\n`,
);
