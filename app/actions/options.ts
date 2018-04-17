import { createAction } from 'typesafe-actions';

export interface Options {
  alwaysShowTimer?: boolean;
  staticBattleBackground?: boolean;
  hideNewcomerBanners?: boolean;
}

export const defaultOptions: Options = {
  alwaysShowTimer: false,
  staticBattleBackground: false,
  hideNewcomerBanners: false,
};

export const setOption = createAction('SET_OPTION', (newOptions: Options) => ({
  type: 'SET_OPTION',
  payload: newOptions,
}));
