#!/usr/bin/env -S npx ts-node

import * as _ from 'lodash';

import { enlir, makeLegendMateriaAliases } from '../app/data/enlir';
import { describeMrPLegendMateria } from '../app/data/mrP/legendMateria';
import { logForCli } from '../app/utils/logger';

logForCli();

let lastCharacter = '';

let totalCount = 0;
let handledCount = 0;

const aliases = makeLegendMateriaAliases(enlir.legendMateria);

const onlyItems = process.argv.slice(2);

for (const lm of _.sortBy(Object.values(enlir.legendMateria), ['character', 'id'])) {
  if (
    onlyItems.length &&
    onlyItems.indexOf(lm.name) === -1 &&
    onlyItems.indexOf(lm.character) === -1
  ) {
    continue;
  }

  if (lm.character !== lastCharacter) {
    console.log();
    console.log(lm.character);
  }

  let effect = describeMrPLegendMateria(lm);
  if (effect) {
    handledCount++;
  } else {
    effect = '"' + lm.effect + '"';
  }
  console.log(lm.name + ' (' + aliases[lm.id] + '): ' + effect);

  totalCount++;

  lastCharacter = lm.character;
}

console.log();
console.log(`Handled ${handledCount}/${totalCount}`);
