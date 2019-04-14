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

function getSchoolName(command: MrPSoulBreak): string {
  if (command.schoolDetails) {
    return command.schoolDetails.map(getSchoolShortName).join('/');
  } else if (command.school) {
    return getSchoolShortName(command.school);
  } else {
    return '?';
  }
}

export function getBraveColumns(
  mrP: MrPSoulBreak,
  braveCommands: MrPSoulBreak[],
): [string, string] {
  return [
    '[' +
      getSchoolName(braveCommands[0]) +
      '], +1 on ' +
      mrP.braveCondition!.map(getShortName).join('/'),
    formatBraveCommands(braveCommands),
  ];
}

export function getBurstColumns(burstCommands: MrPSoulBreak[]): Array<[string, string]> {
  return burstCommands.map(
    cmd => ['[' + getSchoolName(cmd) + ']', '[' + formatMrP(cmd) + ']'] as [string, string],
  );
}
