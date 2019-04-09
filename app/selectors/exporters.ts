import * as _ from 'lodash';

import { enlir, makeSoulBreakAliases } from '../data/enlir';
import { describeEnlirSoulBreak, formatMrP } from '../data/mrP';
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

  let result = 'Character,Realm,Soul Break,ID,Tier,Effects\n';

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
      result +=
        [
          character,
          sb.realm,
          sb.name,
          sb.id,
          aliases[sb.id],
          formatMrP(describeEnlirSoulBreak(sb)),
        ].join(',') + '\n';
    }
  }

  return result;
}
