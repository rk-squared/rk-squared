import * as React from 'react';
import * as ReactTooltip from 'react-tooltip';

import { enlir } from '../../data';
import { formatRelicName } from '../../data/items';

import * as _ from 'lodash';

interface Props {
  id: string;
  relicId: number;
}

const attributes = ['atk', 'def', 'mag', 'res', 'mnd', 'acc', 'eva'];

const separateWithBr = (lines: any[]) => {
  const result: any[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (result.length) {
      result.push(<br key={i}/>);
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
      _.filter(attributes.map(i => relic.stats[i] ? `${i.toUpperCase()} ${relic.stats[i]}` : '')).join(', '),
      relic.effect
    ]);

    return (
      <ReactTooltip id={id} {...props}>
        <strong>{formatRelicName(relic)}</strong><br/>
        {separateWithBr(lines)}
      </ReactTooltip>
    );
  }
}
