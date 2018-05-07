import { createAction } from 'typesafe-actions';

export interface Options {
  alwaysShowTimer?: boolean;
  staticBattleBackground?: boolean;
  hideNewcomerBanners?: boolean;
  saveTrafficCaptures?: boolean;
}

export const defaultOptions: Options = {
  alwaysShowTimer: false,
  staticBattleBackground: false,
  hideNewcomerBanners: false,
  saveTrafficCaptures: false,
};

export const setOption = createAction('SET_OPTION', (newOptions: Options) => ({
  type: 'SET_OPTION',
  payload: newOptions,
}));

export type OptionsAction = ReturnType<typeof setOption>;
