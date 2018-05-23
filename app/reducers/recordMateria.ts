import { getType } from 'typesafe-actions';

import { RecordMateria, RecordMateriaAction, setRecordMateria } from '../actions/recordMateria';

export interface RecordMateriaState {
  recordMateria: {
    [id: number]: RecordMateria;
  };
}

const initialState = {
  recordMateria: {}
};

export function recordMateria(state: RecordMateriaState = initialState,
                              action: RecordMateriaAction): RecordMateriaState {
  switch (action.type) {
    case getType(setRecordMateria):
      return {
        ...state,
        recordMateria: action.payload.recordMateria
      };

    default:
      return state;
  }
}
