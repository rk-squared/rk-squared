import { convertRecordMateriaList } from '../recordMateria';

const data = require('./data/released_record_materia_list.json');

describe('record materia proxy', () => {
  describe('get_released_record_materia_list', () => {
    it('does stuff', () => {
      expect(convertRecordMateriaList(data)).toMatchSnapshot();
    });
  });
});
