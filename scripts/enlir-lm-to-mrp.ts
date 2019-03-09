#!/usr/bin/env npx ts-node

import * as _ from 'lodash';

import { enlir } from '../app/data/enlir';
import { formatMrPLegendMateria } from '../app/data/mrP/legendMateria';

// tslint:disable: no-console

let lastCharacter: string = '';

let totalCount = 0;
let handledCount = 0;

for (const lm of _.sortBy(Object.values(enlir.legendMateria), ['character', 'id'])) {
  if (lm.character !== lastCharacter) {
    console.log();
    console.log(lm.character);
  }

  let effect = formatMrPLegendMateria(lm);
  if (effect) {
    handledCount++;
  } else {
    effect = '"' + lm.effect + '"';
  }
  console.log(lm.name + ': ' + effect);

  totalCount++;

  lastCharacter = lm.character;
}

console.log();
console.log(`Handled ${handledCount}/${totalCount}`);
