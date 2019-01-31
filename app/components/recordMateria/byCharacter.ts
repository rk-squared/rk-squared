import * as _ from 'lodash';

import { Order, RecordMateriaDetail } from '../../actions/recordMateria';
import { enlir } from '../../data';

// Character GL name and Order, for easy selection
export type CharacterRecordMateria = [string, Order];

const makeCharacterLookup = _.memoize((recordMateria: { [id: number]: RecordMateriaDetail }) =>
  _.keyBy(recordMateria, (i: RecordMateriaDetail) => {
    // Use the canonical GL name for the character if we can find it.
    // Otherwise, use the name attached to the record materia.
    const characterName = enlir.characters[i.characterId]
      ? enlir.characters[i.characterId].name
      : i.characterName;
    return characterName + '-' + i.order;
  }),
);

/**
 * Returns a mapping of characters by GL (global) name and Order.  This makes
 * it easy to write custom lists of record materia without having to look up a
 * bunch of ID numbers.
 */
export function getByCharacter(
  recordMateria: { [id: number]: RecordMateriaDetail },
  characters: CharacterRecordMateria[],
) {
  const characterLookup = makeCharacterLookup(recordMateria);
  return characters.map(([characterName, order]) => characterLookup[characterName + '-' + order]);
}
