/**
 * @file
 * Support for applying options (modifications to FFRK), even if those options
 * would logically fit in another proxy module.
 */

import { Store } from 'redux';

import * as schemas from '../api/schemas';
import { IState } from '../reducers';
import { Handler } from './types';

// Manually copied from Nightmare dungeons
const staticBackground = {
  assets: {
    'bg-10227': '/Content/lang/ww/compile/en/ab/bg/10227/10227.json'
  },
  animationTime: 2000,
  animation_info: {
    bgEffectIds: [],
    id: 'bg-10227'
  }
};
// noinspection SpellCheckingInspection
const staticBackgroundAsset = {
  bundle: {
    '/Content/lang/ww/compile/en/ab/bg/common/img_wipe.png': {
      hash: 'xVibBIDBXrZY17YTSndAXw'
    },
    '/Content/lang/ww/compile/en/ab/bg/10227/10227.json': {
      hash: 'J/XA+KO8dRtc5oYhum0FKA'
    },
    '/Content/lang/ww/compile/en/ab/bg/10227/img_10227_01_02.png': {
      hash: 'kYCceguzDOA9PJLQEeUSjA'
    },
    '/Content/lang/ww/compile/en/ab/bg/10227/img_10227_01_03.png': {
      hash: 'A6yf/IlIbbgYYWddMXu6hQ'
    }
  },
  assetPath: '/Content/lang/ww/compile/en/ab/bg/10227/10227.json'
};

const optionsHandler: Handler = {
  get_battle_init_data(data: schemas.GetBattleInit, store: Store<IState>) {
    const { alwaysShowTimer, staticBattleBackground } = store.getState().options;
    let changed = false;

    if (alwaysShowTimer) {
      changed = true;
      data.battle.show_timer_type = '1';
    }

    if (staticBattleBackground) {
      changed = true;
      data.battle.background = staticBackground;
      data.assets[staticBackground.animation_info.id] = staticBackgroundAsset;
      for (const i of data.battle.rounds) {
        i.background_change_type = '0';
      }
    }

    if (changed) {
      return data;
    }

    return undefined;
  },
};

export default optionsHandler;
