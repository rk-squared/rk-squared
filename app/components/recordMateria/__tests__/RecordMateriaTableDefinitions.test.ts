/**
 * @file
 * Validates record materia tables for completion and correctness
 */

import { Order } from '../../../actions/recordMateria';
import { enlir, isCoreJob } from '../../../data/enlir';
import attackReplacementTables from '../AttackReplacementDefinitions';
import damageHealingTables from '../DamageHealingDefinitions';
import miscTables from '../MiscDefinitions';
import statBuffsTables from '../StatBuffsDefinitions';

import * as _ from 'lodash';

function getAllCharactersAndOrders() {
  const allTables = _.flatten([
    attackReplacementTables,
    damageHealingTables,
    miscTables,
    statBuffsTables,
  ]);
  const allRows = _.flatten(allTables.map(i => i.rows));
  return _.flatten(_.flatten(allRows.map(i => _.values(i.items))));
}

function getIncompleteCharacters(): string[] {
  const allCharactersAndOrders = getAllCharactersAndOrders();

  const byCharacter: { [character: string]: { [order in Order]: boolean } } = {};
  for (const [character, order] of allCharactersAndOrders) {
    byCharacter[character] = byCharacter[character] || {};
    // Note that it is not an error for an RM to appear in more than one category.
    byCharacter[character][order] = true;
  }

  const hasAllOrders = (orders: { [order in Order]: boolean }) =>
    orders['2'] && orders['3'] && (orders['1'] || (orders['1a'] && orders['1b']));

  const result: string[] = [];
  for (const character of _.sortBy(Object.keys(byCharacter))) {
    const orders = byCharacter[character];
    if (!hasAllOrders(orders)) {
      const orderString = _.sortBy(Object.keys(orders)).join(', ');
      result.push(`${character} is incomplete: have ${orderString}`);
    }
  }
  return result;
}

function getMissingCharacters(): string[] {
  const allCharactersAndOrders = getAllCharactersAndOrders();
  const rmCharacters = new Set(allCharactersAndOrders.map(([character]) => character));
  return _.values(enlir.characters)
    .filter(i => !isCoreJob(i))
    .map(i => i.name)
    .filter(i => !rmCharacters.has(i));
}

describe('RecordMateriaTableDefinitions', () => {
  it('contains consistent and complete character information', () => {
    expect(getIncompleteCharacters()).toEqual([]);
    expect(getMissingCharacters()).toEqual(['Ravus']);
  });
});
