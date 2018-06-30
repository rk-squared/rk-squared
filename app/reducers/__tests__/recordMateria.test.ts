import { recordMateria } from '../recordMateria';

import { RecordMateria, setRecordMateriaInventory } from '../../actions/recordMateria';

import * as _ from 'lodash';

const attunement1: RecordMateria = {
  characterId: 10000200,
  characterName: 'Tyro',
  condition: 'Awarded for breaking character level cap.',
  description: 'Deal slightly more damage when attacking with an enemy\'s elemental weakness.',
  id: 111000020,
  name: 'Attunement I',
  obtained: false,
  order: '1a',
  prereqs: [],
  step: 1,
  seriesId: 200001,
};

describe('recordMateria reducer', () => {
  describe('setRecordMateriaInventory', () => {
    it('updates obtained status for inventory', () => {
      const initialState = {
        recordMateria: _.keyBy([attunement1], 'id'),
        favorites: undefined,
        inventory: undefined,
      };

      const newState = recordMateria(initialState, setRecordMateriaInventory([attunement1.id], []));

      expect(newState.recordMateria[attunement1.id].obtained).toBeTruthy();
      expect(newState.inventory).toBeTruthy();
      expect(newState.favorites).toBeTruthy();
      expect((newState.inventory || [])[attunement1.id]).toBeTruthy();
      expect((newState.favorites || [])[attunement1.id]).toBeFalsy();
    });
  });
});
