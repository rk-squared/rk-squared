/**
 * @file
 * Validates record materia tables for completion and correctness
 */

import { Order } from '../../../actions/recordMateria';
import attackReplacementTables from '../AttackReplacementDefinitions';
import damageHealingTables from '../DamageHealingDefinitions';
import miscTables from '../MiscDefinitions';
import statBuffsTables from '../StatBuffsDefinitions';

import * as _ from 'lodash';

function getIncompleteCharacters(): string[] {
  const allTables = _.flatten([
    attackReplacementTables,
    damageHealingTables,
    miscTables,
    statBuffsTables,
  ]);
  const allRows = _.flatten(allTables.map(i => i.rows));
  const allCharactersAndOrders = _.flatten(_.flatten(allRows.map(i => _.values(i.items))));

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

// tslint:disable no-console
describe('RecordMateriaTableDefinitions', () => {
  it('contains consistent and complete character information', () => {
    expect(getIncompleteCharacters()).toEqual([]);
  });
});
