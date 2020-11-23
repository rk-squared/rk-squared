import * as React from 'react';
import * as ReactTooltip from 'react-tooltip';

import * as _ from 'lodash';

import { describeRelicStats, enlir, EnlirRelicRarity } from '../../data/enlir';
import { formatRelicName } from '../../data/items';
import { separateWithBr } from '../common/BrText';

interface Props {
  id: string;
  relicId: number;
}

const formatRarity = (rarity: EnlirRelicRarity) => (rarity === 'S' ? 'Artifact' : `${rarity}★`);

export class RelicTooltip extends React.PureComponent<Props & any> {
  render() {
    const { id, relicId, ...props } = this.props;
    const relic = enlir.relics[relicId];
    if (!relic) {
      return null;
    }

    const lines = _.filter([
      formatRarity(relic.rarity) + ' ' + relic.type,
      describeRelicStats(relic),
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
