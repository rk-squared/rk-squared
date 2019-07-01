/**
 * @file
 * Types and helpers shared across all soul break components.  (Not to be
 * confused with support for shared soul breaks.)
 */

import * as TrieSearch from 'trie-search';

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
  SASB: styles.synchro,
  Glint: styles.glint,
  'Glint+': styles.glint,

  // Unused - placeholders
  Default: styles.unique,
  RW: styles.unique,
  Shared: styles.unique,
};

export const soulBreakAbbrevAliases = makeSoulBreakAliases(enlir.soulBreaks, {
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
  SASB: 'SA',
  RW: '-',
  Shared: '-',
});
export const soulBreakFullAliases = makeSoulBreakAliases(enlir.soulBreaks);
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

export function getSynchroColumns(
  mrP: MrPSoulBreak,
  synchroCommands: MrPSoulBreak[],
): Array<[string, string]> {
  return synchroCommands.map(
    (cmd, i) =>
      [
        '[' +
          getSchoolName(cmd) +
          ']' +
          (mrP.synchroCondition && mrP.synchroCondition[i]
            ? ', w/ ' + getShortName(mrP.synchroCondition[i])
            : ''),
        formatMrP(cmd),
      ] as [string, string],
  );
}

interface SoulBreakSearchItem {
  id: number;
  character: string;
  characterText: string;
  name: string;
  nameJp: string;
  fullTier: string;
  abbrevTier: string;
}
interface LegendMateriaSearchItem {
  id: number;
  character: string;
  characterText: string;
  name: string;
  nameJp: string;
  tier: string;
}

let cachedSoulBreakSearch: TrieSearch<SoulBreakSearchItem> | undefined;
let cachedLegendMateriaSearch: TrieSearch<LegendMateriaSearchItem> | undefined;
function getSearches() {
  if (!cachedSoulBreakSearch) {
    cachedSoulBreakSearch = new TrieSearch(
      ['character', 'characterText', 'name', 'fullTier', 'abbrevTier'],
      {
        indexField: 'id',
        idFieldOrFunction: 'id',
      },
    );
    cachedSoulBreakSearch.addAll(
      Object.values(enlir.soulBreaks)
        .filter(i => i.character != null)
        .map(i => ({
          id: i.id,
          character: i.character!,
          characterText: i.character!.replace(/[^a-zA-Z]/g, ''),
          name: i.name,
          nameJp: i.nameJp,
          fullTier: soulBreakFullAliases[i.id],
          abbrevTier: soulBreakAbbrevAliases[i.id],
        })),
    );
  }
  if (!cachedLegendMateriaSearch) {
    cachedLegendMateriaSearch = new TrieSearch(['character', 'characterText', 'name', 'tier'], {
      indexField: 'id',
      idFieldOrFunction: 'id',
    });
    cachedLegendMateriaSearch.addAll(
      Object.values(enlir.legendMateria).map(i => ({
        id: i.id,
        character: i.character,
        characterText: i.character!.replace(/[^a-zA-Z]/g, ''),
        name: i.name,
        nameJp: i.nameJp,
        tier: legendMateriaAliases[i.id],
      })),
    );
  }
  return [cachedSoulBreakSearch, cachedLegendMateriaSearch];
}

export interface SearchResults {
  characters: Set<string>;
  soulBreakIds: Set<number>;
  legendMateriaIds: Set<number>;
}

export function searchSoulBreaksAndLegendMateria(searchFilter: string): SearchResults {
  const [soulBreakSearch, legendMateriaSearch] = getSearches();
  const searchResults: SearchResults = {
    characters: new Set<string>(),
    soulBreakIds: new Set<number>(),
    legendMateriaIds: new Set<number>(),
  };
  for (const i of soulBreakSearch.get(searchFilter, TrieSearch.UNION_REDUCER)) {
    searchResults.characters.add(i.character);
    searchResults.soulBreakIds.add(i.id);
  }
  for (const i of legendMateriaSearch.get(searchFilter, TrieSearch.UNION_REDUCER)) {
    searchResults.characters.add(i.character);
    searchResults.legendMateriaIds.add(i.id);
  }
  return searchResults;
}
