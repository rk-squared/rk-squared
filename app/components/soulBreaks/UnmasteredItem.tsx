import * as React from 'react';

import { enlir, EnlirRelic, makeSoulBreakAliases } from '../../data/enlir';
import { numberWithCommas } from '../../data/mrP/util';
import { RelicTypeIcon } from '../shared/RelicTypeIcon';
import { legendMateriaAliases } from '../shared/SoulBreakShared';

const styles = require('./UnmasteredItem.scss');

const soulBreakAliases = makeSoulBreakAliases(enlir.soulBreaks);

interface Props {
  id: number;
  exp: number;
  enlirItems: {
    [id: number]: {
      name: string;
      character: string;
      relic: string | null;
    };
  };
  aliases: { [id: number]: string };

  className?: string;
}

class UnmasteredItem extends React.Component<Props> {
  renderRelic(relic: EnlirRelic) {
    return (
      <>
        {' ('}
        <RelicTypeIcon type={relic.type} className={styles.icon} /> {relic.name} ({relic.realm}))
      </>
    );
  }

  render() {
    const { id, exp, enlirItems, aliases, className } = this.props;
    if (!enlirItems[id] || !aliases[id]) {
      return null;
    }
    const item = enlirItems[id];
    const relic = item.relic ? enlir.relicsByNameWithRealm[item.relic] : undefined;
    return (
      <li className={className}>
        <strong>{item.character + ' ' + aliases[id]}</strong> — {item.name}
        {relic && this.renderRelic(relic)}
        {`, need ${numberWithCommas(exp)} exp.`}
      </li>
    );
  }
}

export const UnmasteredSoulBreak = (props: { id: number; exp: number; className?: string }) => (
  <UnmasteredItem {...props} enlirItems={enlir.soulBreaks} aliases={soulBreakAliases} />
);
export const UnmasteredLegendMateria = (props: { id: number; exp: number; className?: string }) => (
  <UnmasteredItem {...props} enlirItems={enlir.legendMateria} aliases={legendMateriaAliases} />
);
