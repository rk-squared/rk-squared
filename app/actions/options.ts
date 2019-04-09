import { createAction } from 'typesafe-actions';

export interface Options {
  alwaysShowTimer?: boolean;
  saveTrafficCaptures?: boolean;

  // Obsolete options

  /**
   * Unreliable - as of April 2019, results in broken UI, and it's too hard to
   * debug for too little gain.
   */
  staticBattleBackground?: boolean;

  /**
   * Newcomer Banners no longer exist.
   */
  hideNewcomerBanners?: boolean;
}

export const defaultOptions: Options = {
  alwaysShowTimer: false,
  saveTrafficCaptures: false,

  // Obsolete options
  staticBattleBackground: false,
  hideNewcomerBanners: false,
};

export const setOption = createAction('SET_OPTION', (newOptions: Options) => ({
  type: 'SET_OPTION',
  payload: newOptions,
}));

export type OptionsAction = ReturnType<typeof setOption>;
