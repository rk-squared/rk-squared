import * as React from 'react';
import * as ReactTooltip from 'react-tooltip';

import * as _ from 'lodash';

import { allEnlirStats, enlir } from '../../data/enlir';
import { formatRelicName } from '../../data/items';

interface Props {
  id: string;
  relicId: number;
}

const separateWithBr = (lines: any[]) => {
  const result: any[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (result.length) {
      result.push(<br key={i} />);
    }
    result.push(lines[i]);
  }
  return result;
};

export class RelicTooltip extends React.PureComponent<Props & any> {
  render() {
    const { id, relicId, ...props } = this.props;
    const relic = enlir.relics[relicId];
    if (!relic) {
      return null;
    }

    const lines = _.filter([
      `${relic.rarity}★ ${relic.type}`,
      _.filter(
        allEnlirStats.map(i => (relic.stats[i] ? `${i.toUpperCase()} ${relic.stats[i]}` : '')),
      ).join(', '),
      relic.effect,
    ]);

    return (
      <ReactTooltip id={id} {...props}>
        <strong>{formatRelicName(relic)}</strong>
        <br />
        {separateWithBr(lines)}
      </ReactTooltip>
    );
  }
}
