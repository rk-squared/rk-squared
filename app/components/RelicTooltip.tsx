import * as React from 'react';
import * as ReactTooltip from 'react-tooltip';

import enlir from '../data/enlir';

interface Props {
  id: string;
  relicId: number;
}

const attributes = ['Attack', 'Defense', 'Magic', 'Resistance', 'Mind', 'Accuracy', 'Evasion'];

export class RelicTooltip extends React.Component<Props & any> {
  render() {
    const { id, relicId, ...props } = this.props;
    if (!enlir.relics[relicId]) {
      return null;
    }
    const relic = enlir.relics[relicId];
    return (
      <ReactTooltip id={id} {...props}>
        {attributes.map(i => relic[i] ? `${i} ${relic[i]}. ` : '')}
        {!!relic.Effect && (relic.Effect + '.')}
      </ReactTooltip>
    );
  }
}
