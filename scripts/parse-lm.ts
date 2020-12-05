#!/usr/bin/env -S npx ts-node

import * as _ from 'lodash';
import * as process from 'process';
import * as yargs from 'yargs';

import { enlir, EnlirLegendMateria } from '../app/data/enlir';
import { parse, SyntaxError } from '../app/data/mrp/statusParser';
import { StatusEffect } from '../app/data/mrP/statusTypes';
import { describeMrPLegendMateria } from '../app/data/mrP/legendMateria';

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

function processLegendMateria(): [number, number] {
  const items = _.sortBy(Object.values(enlir.legendMateria), ['character', 'id']);
  function shouldShow(parseResults: StatusEffect | undefined, parseError: SyntaxError | undefined) {
    return (parseResults && !argv.hideSuccesses) || (parseError && !argv.hideFailures);
  }

  function showText(
    item: EnlirLegendMateria,
    parseText: string | null,
    parseResults: StatusEffect | undefined,
    parseError: SyntaxError | undefined,
  ) {
    console.log(item.id + ' - ' + item.name);
    console.log(item.effect);
    if (parseResults) {
      console.dir(parseResults, { depth: null });
      console.log(parseText);
    }
    if (parseError) {
      console.log(' '.repeat(parseError.location.start.offset) + '^');
      console.log(parseError.message);
    }
    console.log();
  }

  function showJson(
    item: EnlirLegendMateria,
    parseText: string | null,
    parseResults: StatusEffect | undefined,
    parseError: SyntaxError | undefined,
  ) {
    const mrPText = parseResults ? parseText : undefined;
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
    if (argv.filter && !i.name.match(argv.filter) && i.id.toString() !== argv.filter) {
      return;
    }
    let parseResults: StatusEffect | undefined;
    let parseError: SyntaxError | undefined;
    totalCount++;
    try {
      parseResults = parse(i.effect, { startRule: 'LegendMateriaEffect' });
      successCount++;
    } catch (e) {
      if (e.name !== 'SyntaxError') {
        console.log(i.name);
        console.log(i.effect);
        throw e;
      }
      parseError = e;
    }

    if (shouldShow(parseResults, parseError)) {
      const parseText = parseResults ? describeMrPLegendMateria(i) : null;
      (argv.json ? showJson : showText)(i, parseText, parseResults, parseError);
    }
  });
  return [successCount, totalCount];
}

export function main() {
  const result = [processLegendMateria()];
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
}

if (require.main === module) {
  main();
}
