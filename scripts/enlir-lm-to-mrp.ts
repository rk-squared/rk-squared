#!/usr/bin/env npx ts-node

import * as _ from 'lodash';

import { enlir } from '../app/data/enlir';
import { formatMrPLegendMateria } from '../app/data/mrP/legendMateria';

// tslint:disable: no-console

let lastCharacter: string = '';

for (const lm of _.sortBy(Object.values(enlir.legendMateria), ['character', 'id'])) {
  if (lm.character !== lastCharacter) {
    console.log();
    console.log(lm.character);
  }
  console.log(lm.name + ': ' + formatMrPLegendMateria(lm));
  lastCharacter = lm.character;
}
