export const gameUrl = 'https://www.finalfantasyrecordkeeper.com/';

export const downloadUrl = 'https://github.com/rk-squared/rk-squared/releases';
export type PlatformType = 'mac' | 'windows';
export function binaryDownloadUrl(version: string, platform: 'mac' | 'windows') {
  const baseUrl = 'https://github.com/rk-squared/rk-squared/releases/download/v' + version;
  const installer =
    platform === 'mac' ? `RK.Squared-${version}.dmg` : `RK.Squared.Setup.${version}.exe`;
  return baseUrl + '/' + installer;
}

export const ffrkCommunityUrl =
  'https://docs.google.com/spreadsheets/d/1f8OJIQhpycljDQ8QNDk_va1GJ1u7RVoMaNjFcHH0LKk';
export const ffrkCommunityHelp = 'Open the FFRK Community Google Docs spreadsheet in your browser.';

export const misterPUrl = 'http://happypluto.com/~misterp/r/ffrk.pdf';
export const misterPHelp = "Open MisterP's FFRK PDF in your browser.";

export const redditUrl = 'https://www.reddit.com/r/FFRecordKeeper/';

export const rkSquaredUrl = 'https://www.rk-squared.com/';
export const issuesUrl = 'https://github.com/rk-squared/rk-squared/issues';
