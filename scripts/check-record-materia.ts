#!/usr/bin/env npx ts-node
/**
 * @file
 * Validates record materia tables for completion and correctness
 */

import { Order } from '../app/actions/recordMateria';
import attackReplacementTables from '../app/components/recordMateria/AttackReplacementDefinitions';
import damageHealingTables from '../app/components/recordMateria/DamageHealingDefinitions';
import miscTables from '../app/components/recordMateria/MiscDefinitions';
import statBuffsTables from '../app/components/recordMateria/StatBuffsDefinitions';

import * as _ from 'lodash';

// tslint:disable no-console

const allTables = _.flatten([ attackReplacementTables, damageHealingTables, miscTables, statBuffsTables ]);
const allRows = _.flatten(allTables.map(i => i.rows));
const allCharactersAndOrders = _.flatten(_.flatten(allRows.map(i => _.values(i.items))));

const byCharacter: { [character: string]: { [order in Order]: boolean } } = {};
for (const [ character, order ] of allCharactersAndOrders) {
  byCharacter[character] = byCharacter[character] || {};
  byCharacter[character][order] = true;
}

const hasAllOrders = (orders: {[order in Order]: boolean}) => (
  orders['2'] && orders['3'] && (
    orders['1'] || (orders['1a'] && orders['1b'])
  )
);

for (const character of _.sortBy(Object.keys(byCharacter))) {
  const orders = byCharacter[character];
  if (!hasAllOrders(orders)) {
    const orderString = _.sortBy(Object.keys(orders)).join(', ');
    console.log(`${character}: have ${orderString}`);
  }
}
