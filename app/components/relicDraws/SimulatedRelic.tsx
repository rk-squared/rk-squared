import * as React from 'react';

import { LangType } from '../../api/apiUrls';
import { enlir, EnlirRelic } from '../../data/enlir';
import { relicImage } from '../../data/urls';
import {
  legendMateriaAliases,
  limitBreakFullAliases,
  makeTierStyleMap,
  soulBreakFullAliases,
} from '../shared/SoulBreakShared';

const styles = require('./SimulatedRelic.scss');

const tierClass = makeTierStyleMap(styles);

interface Props {
  relic: EnlirRelic;
  lang: LangType;
}

export const SimulatedRelic = ({ relic, lang }: Props) => {
  const id = relic.id;
  const sb = enlir.relicSoulBreaks[id];
  const lb = enlir.relicLimitBreaks[id];
  const lm = enlir.relicLegendMateria[id];
  const textClass = sb ? tierClass[sb.tier] : lb ? tierClass[lb.tier] : styles.legendMateria;
  // FIXME: Tooltips
  // FIXME: Indicate dupes and want status
  return (
    <div className={styles.component}>
      <img src={relicImage(lang, relic.id, relic.rarity)} alt={relic.name} />
      <span className={textClass}>
        {relic.character}{' '}
        {sb
          ? soulBreakFullAliases[sb.id]
          : lb
          ? limitBreakFullAliases[lb.id]
          : lm
          ? legendMateriaAliases[lm.id]
          : ''}
      </span>
    </div>
  );
};
