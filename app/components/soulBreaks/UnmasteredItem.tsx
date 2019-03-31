import * as React from 'react';

import { enlir, EnlirRelic, makeSoulBreakAliases } from '../../data/enlir';
import { RelicTypeIcon } from '../shared/RelicTypeIcon';
import { legendMateriaAliases } from './LegendMateriaListItem';

const styles = require('./UnmasteredItem.scss');

const soulBreakAliases = makeSoulBreakAliases(enlir.soulBreaks);

interface Props {
  id: number;
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
        {', from '}
        <RelicTypeIcon type={relic.type} className={styles.icon} /> {relic.name} ({relic.realm})
      </>
    );
  }

  render() {
    const { id, enlirItems, aliases, className } = this.props;
    if (!enlirItems[id] || !aliases[id]) {
      return null;
    }
    const item = enlirItems[id];
    const relic = item.relic ? enlir.relicsByNameWithRealm[item.relic] : undefined;
    return (
      <li className={className}>
        <strong>{item.character + ' ' + aliases[id]}</strong>
        {' (' + item.name}
        {relic && this.renderRelic(relic)})
      </li>
    );
  }
}

export const UnmasteredSoulBreak = ({ id, ...props }: { id: number; className?: string }) => (
  <UnmasteredItem {...props} id={id} enlirItems={enlir.soulBreaks} aliases={soulBreakAliases} />
);
export const UnmasteredLegendMateria = ({ id, ...props }: { id: number; className?: string }) => (
  <UnmasteredItem
    {...props}
    id={id}
    enlirItems={enlir.legendMateria}
    aliases={legendMateriaAliases}
  />
);
