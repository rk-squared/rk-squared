#!/usr/bin/env -S npx ts-node

import * as _ from 'lodash';
import * as process from 'process';
import * as yargs from 'yargs';

import { enlir, EnlirStatus } from '../app/data/enlir';
import { parse, SyntaxError } from '../app/data/mrp/statusParser';
import { SkillEffect } from '../app/data/mrP/types';

// tslint:disable: no-console

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
  'General Set Status',
  'Status Level in Synchro Mode',
  'Increase Status Level',
  'Decrease Status Level',
  'Attach Element',
  'Max Attach Element Level',
  'KO',
]);

function shouldAlwaysSkip(status: Enlir.Status) {
  // Skip Nightmare statuses; these often have unique mechanics that aren't
  // relevant for characters.
  return skipStatuses.has(status.name) || status.name.startsWith('Nightmare ');
}

function processStatuses(): [number, number] {
  const items = enlir.statusByName;
  function shouldShow(parseResults: SkillEffect | undefined, parseError: SyntaxError | undefined) {
    return (parseResults && !argv.hideSuccesses) || (parseError && !argv.hideFailures);
  }

  function showText(
    item: EnlirStatus,
    parseResults: SkillEffect | undefined,
    parseError: SyntaxError | undefined,
  ) {
    console.log(item.id + ' - ' + item.name);
    console.log(item.effects);
    if (parseResults) {
      console.dir(parseResults, { depth: null });
      // const mrP = convertEnlirSkillToMrP(item);
      // const text = formatMrPSkill(mrP);
      // console.log(text);
    }
    if (parseError) {
      console.log(' '.repeat(parseError.location.start.offset) + '^');
      console.log(parseError.message);
    }
    console.log();
  }

  function showJson(
    item: EnlirStatus,
    parseResults: SkillEffect | undefined,
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
    if (shouldAlwaysSkip(i) || (argv.filter && !i.name.match(argv.filter))) {
      return;
    }
    let parseResults: SkillEffect | undefined;
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
