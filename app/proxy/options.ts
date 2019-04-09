/**
 * @file
 * Support for applying options (modifications to FFRK), even if those options
 * would logically fit in another proxy module.
 */

import { Store } from 'redux';

import * as schemas from '../api/schemas';
import { IState } from '../reducers';
import { Handler } from './common';

const optionsHandler: Handler = {
  get_battle_init_data(data: schemas.GetBattleInit, store: Store<IState>) {
    const { alwaysShowTimer } = store.getState().options;
    let changed = false;

    if (alwaysShowTimer) {
      changed = true;
      data.battle.show_timer_type = '1';
    }

    if (changed) {
      return data;
    }

    return undefined;
  },
};

export default optionsHandler;
