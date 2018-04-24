import * as React from 'react';
import * as ReactTooltip from 'react-tooltip';

import enlir from '../data/enlir';

import * as _ from 'lodash';

interface Props {
  id: string;
  relicId: number;
}

const attributes = ['Attack', 'Defense', 'Magic', 'Resistance', 'Mind', 'Accuracy', 'Evasion'];

const separateWithBr = (lines: any[]) => {
  const result: any[] = [];
  for (const i of lines) {
    if (result.length) {
      result.push(<br/>);
    }
    result.push(i);
  }
  return result;
};

export class RelicTooltip extends React.Component<Props & any> {
  render() {
    const { id, relicId, ...props } = this.props;
    if (!enlir.relics[relicId]) {
      return null;
    }
    const relic = enlir.relics[relicId];

    const lines = _.filter([
      `${relic.Rarity}★ ${enlir.types.relics[relic.RelicType]}`,
      _.filter(attributes.map(i => relic[i] ? `${i} ${relic[i]}` : '')).join(', '),
      relic.Effect
    ]);

    return (
      <ReactTooltip id={id} {...props}>
        <strong>{relic.Description}</strong><br/>
        {separateWithBr(lines)}
      </ReactTooltip>
    );
  }
}
