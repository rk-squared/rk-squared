import { createAction } from 'typesafe-actions';

/**
 * User options - explicitly chosen settings that affect the behavior of FFRK
 * or of RK Squared
 */
export interface Options {
  alwaysShowTimer?: boolean;
  enableLogging?: boolean;
  saveTrafficCaptures?: boolean;

  /**
   * Expire old relic draw banners after this value, in days.
   */
  maxOldRelicDrawBannerAgeInDays?: number;

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

export const defaultOptions: Required<Options> = {
  alwaysShowTimer: false,
  enableLogging: false,
  saveTrafficCaptures: false,

  // Show 4 days of history so that the 3-day lucky draw countdown before a
  // festival doesn't immediately vanish.
  maxOldRelicDrawBannerAgeInDays: 4,

  // Obsolete options
  staticBattleBackground: false,
  hideNewcomerBanners: false,
};

export const setOption = createAction('SET_OPTION', (newOptions: Options) => ({
  type: 'SET_OPTION',
  payload: newOptions,
}));

export type OptionsAction = ReturnType<typeof setOption>;
