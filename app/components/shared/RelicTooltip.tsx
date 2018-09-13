import * as React from 'react';
import * as ReactTooltip from 'react-tooltip';

import { enlir } from '../../data';

import * as _ from 'lodash';

interface Props {
  id: string;
  relicId: number;
}

const attributes = ['Attack', 'Defense', 'Magic', 'Resistance', 'Mind', 'Accuracy', 'Evasion'];

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
