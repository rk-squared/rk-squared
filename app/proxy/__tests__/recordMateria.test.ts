import { convertRecordMateriaList } from '../recordMateria';

import { Order, RecordMateria } from '../../actions/recordMateria';

import * as _ from 'lodash';

const data = require('./data/released_record_materia_list.json');

function sortRecordMateria(recordMateria: {[id: number]: RecordMateria}) {
  const result: { [character: string]: { [order in Order]: RecordMateria } } = {};
  _.values(recordMateria).forEach(i => {
    result[i.characterName] = result[i.characterName] || {};
    result[i.characterName][i.order] = i;
  });
  return result;
}

describe('record materia proxy', () => {
  describe('get_released_record_materia_list', () => {
    const recordMateria = convertRecordMateriaList(data);
    const sorted = sortRecordMateria(recordMateria);

    it('handles characters with 2 record materia', () => {
      expect(sorted['Warrior']['1'].name).toEqual('Blade\'s Edge');
      expect(sorted['Warrior']['2'].name).toEqual('Warrior\'s Drive');

      expect(sorted['Warrior']['1a']).toBeUndefined();
      expect(sorted['Warrior']['1b']).toBeUndefined();
      expect(sorted['Warrior']['3']).toBeUndefined();
    });

    it('handles characters with 3 record materia', () => {
      expect(sorted['Terra']['1'].name).toEqual('Hidden Power');
      expect(sorted['Terra']['2'].name).toEqual('Blood of Espers');
      expect(sorted['Terra']['3'].name).toEqual('Light of Hope');

      expect(sorted['Terra']['1a']).toBeUndefined();
      expect(sorted['Terra']['1b']).toBeUndefined();
    });

    it('handles characters with 4 record materia', () => {
      expect(sorted['Tyro']['1a'].name).toEqual('Attunement I');
      expect(sorted['Tyro']['1b'].name).toEqual('Attunement II');
      expect(sorted['Tyro']['2'].name).toEqual('Dr. Mog\'s Teachings');
      expect(sorted['Tyro']['3'].name).toEqual('Scholar\'s Boon');

      expect(sorted['Tyro']['1']).toBeUndefined();
    });

    it('tracked obtained status for 4 record materia', () => {
      expect(sorted['Tyro']['1a'].obtained).toEqual(true);
      expect(sorted['Tyro']['1b'].obtained).toEqual(true);
      expect(sorted['Tyro']['2'].obtained).toEqual(true);
      expect(sorted['Tyro']['3'].obtained).toEqual(true);
    });

    it('handles out-of-order record materia', () => {
      expect(sorted['Ingus']['1a'].name).toEqual('Might of Earth');
      expect(sorted['Ingus']['1b'].name).toEqual('Devout Soul');
      // noinspection SpellCheckingInspection
      expect(sorted['Ingus']['2'].name).toEqual('Spirit of Sasune');
      expect(sorted['Ingus']['3'].name).toEqual('Steady Hand');

      expect(sorted['Ingus']['1']).toBeUndefined();

      expect(sorted['Ingus']['1a'].obtained).toEqual(true);
      expect(sorted['Ingus']['1b'].obtained).toEqual(true);
      expect(sorted['Ingus']['2'].obtained).toEqual(true);
      expect(sorted['Ingus']['3'].obtained).toEqual(true);
    });

    it('records prerequisites', () => {
      expect(sorted['Tyro']['2'].prereqs).toEqual([sorted['Tyro']['1a'].id, sorted['Tyro']['1b'].id]);
    });
  });
});
