import * as _ from 'lodash';

const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;

import { enlir, makeLegendMateriaAliases, makeSoulBreakAliases } from '../data/enlir';
import { describeEnlirSoulBreak, formatMrP } from '../data/mrP';
import { describeMrPLegendMateria } from '../data/mrP/legendMateria';
import { blacklist, IState } from '../reducers';

// Although these act as selectors, do not use reselect.  The expected use case
// calls for them to be used rarely, so memorization isn't worth doing.

export function exportStateToJson(state: IState): string {
  return JSON.stringify(_.omit(state, blacklist), undefined, 2);
}

export function exportSoulBreaksToCsv({ characters: { soulBreaks, vault } }: IState): string {
  if (!soulBreaks) {
    return 'Soul breaks have not been loaded.';
  }

  const allSoulBreaks = new Set<number>([...soulBreaks, ...(vault ? vault.soulBreaks || [] : [])]);
  const aliases = makeSoulBreakAliases(enlir.soulBreaks);

  const stringifier = createCsvStringifier({
    header: [
      { id: 'id', title: 'ID' },
      { id: 'character', title: 'Character' },
      { id: 'realm', title: 'Realm' },
      { id: 'name', title: 'Soul Break' },
      { id: 'alias', title: 'Tier' },
      { id: 'effects', title: 'Effects' },
    ],
  });
  let result = stringifier.getHeaderString();

  for (const character of _.keys(enlir.charactersByName).sort()) {
    if (!enlir.soulBreaksByCharacter[character]) {
      continue;
    }
    for (const sb of _.reverse(
      _.filter(
        enlir.soulBreaksByCharacter[character],
        i => i.tier !== 'RW' && i.tier !== 'Default' && allSoulBreaks.has(i.id),
      ),
    )) {
      result += stringifier.stringifyRecords([
        {
          character,
          realm: sb.realm,
          name: sb.name,
          id: sb.id,
          alias: aliases[sb.id],
          effects: formatMrP(describeEnlirSoulBreak(sb)),
        },
      ]);
    }
  }

  return result;
}

export function exportLegendMateriaToCsv({ characters: { legendMateria, vault } }: IState): string {
  if (!legendMateria) {
    return 'Legend materia have not been loaded.';
  }

  const allLegendMateria = new Set<number>([
    ...legendMateria,
    ...(vault ? vault.legendMateria || [] : []),
  ]);
  const aliases = makeLegendMateriaAliases(enlir.legendMateria);

  const stringifier = createCsvStringifier({
    header: [
      { id: 'id', title: 'ID' },
      { id: 'character', title: 'Character' },
      { id: 'realm', title: 'Realm' },
      { id: 'name', title: 'Legend Materia' },
      { id: 'alias', title: 'LM/LMR' },
      { id: 'effects', title: 'Effects' },
    ],
  });
  let result = stringifier.getHeaderString();

  for (const character of _.keys(enlir.charactersByName).sort()) {
    if (!enlir.legendMateriaByCharacter[character]) {
      continue;
    }
    for (const lm of _.reverse(
      _.filter(enlir.legendMateriaByCharacter[character], i => allLegendMateria.has(i.id)),
    )) {
      result += stringifier.stringifyRecords([
        {
          character,
          realm: lm.realm,
          name: lm.name,
          id: lm.id,
          alias: aliases[lm.id],
          effects: describeMrPLegendMateria(lm),
        },
      ]);
    }
  }

  return result;
}
