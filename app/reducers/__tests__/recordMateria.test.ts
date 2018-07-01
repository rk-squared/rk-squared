import { recordMateria } from '../recordMateria';

import { obtainRecordMateria, RecordMateria, setRecordMateriaInventory } from '../../actions/recordMateria';

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

const attunement2: RecordMateria = {
  characterId: 10000200,
  characterName: 'Tyro',
  condition: 'Obtain the Attunement I Record Materia. Chance to obtain with the Keeper in your party.',
  description: 'Deal significantly more damage when attacking with an enemy\'s elemental weakness.',
  id: 111000021,
  name: 'Attunement II',
  obtained: false,
  order: '1b',
  prereqs: [],
  step: 2,
  seriesId: 200001,
};

const obtained = (rm: RecordMateria) => ({...rm, obtained: true});

describe('recordMateria reducer', () => {
  describe('setRecordMateriaInventory', () => {
    it('updates obtained status for inventory', () => {
      const initialState = {
        recordMateria: _.keyBy([attunement1], 'id'),
        inventory: undefined,
        favorites: undefined,
      };

      const newState = recordMateria(initialState, setRecordMateriaInventory([attunement1.id], []));

      expect(newState.recordMateria[attunement1.id].obtained).toBeTruthy();
      expect(newState.inventory).toBeTruthy();
      expect(newState.favorites).toBeTruthy();
      expect((newState.inventory || {})[attunement1.id]).toBeTruthy();
      expect((newState.favorites || {})[attunement1.id]).toBeFalsy();
    });
  });

  describe('obtainRecordMateria', () => {
    it('updates obtained record materia inventory', () => {
      const initialState = {
        recordMateria: _.keyBy([obtained(attunement1), attunement2], 'id'),
        inventory: {},
        favorites: {},
      };

      const newState = recordMateria(initialState, obtainRecordMateria(attunement2.id));

      expect(newState.recordMateria[attunement2.id].obtained).toBeTruthy();
      expect((newState.inventory || {})[attunement2.id]).toBeTruthy();
      expect((newState.favorites || {})[attunement2.id]).toBeFalsy();
    });

    it('handles an empty list', () => {
      const initialState = {
        recordMateria: _.keyBy([obtained(attunement1), attunement2], 'id'),
        inventory: { [attunement1.id]: true },
        favorites: {},
      };

      const newState = recordMateria(initialState, obtainRecordMateria([]));

      expect(newState.recordMateria[attunement1.id].obtained).toBeTruthy();
      expect(newState.recordMateria[attunement2.id].obtained).toBeFalsy();
      expect((newState.inventory || {})[attunement1.id]).toBeTruthy();
      expect((newState.favorites || {})[attunement1.id]).toBeFalsy();
    });
  });
});
