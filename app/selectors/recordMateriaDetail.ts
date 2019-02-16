import * as _ from 'lodash';
import { createSelector } from 'reselect';

import { Character } from '../actions/characters';
import { getPrereqs, getStatus, RecordMateriaDetail } from '../actions/recordMateria';
import { IState } from '../reducers';
import { RecordMateriaState } from '../reducers/recordMateria';

export const getRecordMateriaDetail = createSelector<
  IState,
  RecordMateriaState,
  { [id: number]: Character },
  { [id: number]: RecordMateriaDetail }
>(
  [(state: IState) => state.recordMateria, (state: IState) => state.characters.characters],
  (
    { recordMateria, inventory, favorites, obtained }: RecordMateriaState,
    characters: { [id: number]: Character },
  ): { [id: number]: RecordMateriaDetail } => {
    return _.mapValues(recordMateria, i => {
      const isInInventory = inventory == null ? true : inventory[i.id];
      const isFavorite = favorites == null ? false : favorites[i.id];
      const isObtained = obtained == null ? false : obtained[i.id];
      return {
        ...i,
        ...getStatus(
          i,
          characters[i.characterId],
          getPrereqs(i, recordMateria),
          isInInventory,
          isFavorite,
          isObtained,
        ),
      };
    });
  },
);
