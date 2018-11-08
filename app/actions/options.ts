import { createAction } from 'typesafe-actions';

export interface Options {
  alwaysShowTimer?: boolean;
  staticBattleBackground?: boolean;
  saveTrafficCaptures?: boolean;

  // Obsolete options
  hideNewcomerBanners?: boolean;
}

export const defaultOptions: Options = {
  alwaysShowTimer: false,
  staticBattleBackground: false,
  saveTrafficCaptures: false,

  // Obsolete options
  hideNewcomerBanners: false,
};

export const setOption = createAction('SET_OPTION', (newOptions: Options) => ({
  type: 'SET_OPTION',
  payload: newOptions,
}));

export type OptionsAction = ReturnType<typeof setOption>;
