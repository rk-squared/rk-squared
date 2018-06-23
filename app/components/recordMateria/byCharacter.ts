import { Order, RecordMateriaDetail } from '../../actions/recordMateria';

import * as _ from 'lodash';

// Character name and Order, for easy selection
export type CharacterRecordMateria = [ string, Order ];

const makeCharacterLookup = _.memoize(
  (recordMateria: { [id: number]: RecordMateriaDetail }) => _.keyBy(recordMateria, i => i.characterName + '-' + i.order)
);

export function getByCharacter(
  recordMateria: { [id: number]: RecordMateriaDetail },
  characters: CharacterRecordMateria[]
) {
  const characterLookup = makeCharacterLookup(recordMateria);
  return characters.map(([characterName, order]) => characterLookup[characterName + '-' + order]);
}
