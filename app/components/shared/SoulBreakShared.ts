import {
  enlir,
  EnlirSoulBreakTier,
  makeLegendMateriaAliases,
  makeSoulBreakAliases,
} from '../../data/enlir';
import { formatMrP, MrPSoulBreak } from '../../data/mrP';
import { formatBraveCommands } from '../../data/mrP/brave';
import { getSchoolShortName, getShortName } from '../../data/mrP/types';

export const styles = require('./SoulBreakShared.scss');

export const tierClass: { [tier in EnlirSoulBreakTier]: string | undefined } = {
  SB: styles.unique,
  SSB: styles.super,
  BSB: styles.burst,
  OSB: styles.overstrike,
  AOSB: styles.overstrike,
  USB: styles.ultra,
  CSB: styles.chain,
  AASB: styles.awakening,
  Glint: styles.glint,
  'Glint+': styles.glint,

  // Unused - placeholders
  Default: styles.unique,
  RW: styles.unique,
  Shared: styles.unique,
};

export const soulBreakAliases = makeSoulBreakAliases(enlir.soulBreaks, {
  Default: '-',
  SB: '-',
  SSB: 'S',
  BSB: 'B',
  OSB: 'O',
  AOSB: 'AO',
  Glint: 'G',
  'Glint+': 'G+',
  USB: 'U',
  CSB: 'C',
  AASB: 'AA',
  RW: '-',
  Shared: '-',
});

export const legendMateriaAliases = makeLegendMateriaAliases(enlir.legendMateria);

export function getBraveColumns(
  mrP: MrPSoulBreak,
  braveCommands: MrPSoulBreak[],
): [string, string] {
  return [
    '[' +
      (braveCommands[0].school ? getSchoolShortName(braveCommands[0].school) : '?') +
      '], +1 on ' +
      mrP.braveCondition!.map(getShortName).join('/'),
    formatBraveCommands(braveCommands),
  ];
}

export function getBurstColumns(burstCommands: MrPSoulBreak[]): Array<[string, string]> {
  return burstCommands.map(
    cmd =>
      [
        '[' + (cmd.school ? getSchoolShortName(cmd.school) : '?') + ']',
        '[' + formatMrP(cmd) + ']',
      ] as [string, string],
  );
}
