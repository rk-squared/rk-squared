import * as React from 'react';
import * as ReactTooltip from 'react-tooltip';

import * as _ from 'lodash';

import {
  describeRelicStats,
  enlir,
  EnlirRelicRarity,
  EnlirHeroArtifact,
  EnlirRelic,
} from '../../data/enlir';
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
    const relic =
      (enlir.relics[relicId] as EnlirRelic | undefined) ??
      (enlir.heroArtifacts[relicId] as EnlirHeroArtifact | undefined);
    if (!relic) {
      return null;
    }

    const lines = _.filter([
      ('season' in relic ? relic.character + "'s Hero Artifact" : formatRarity(relic.rarity)) +
        ' ' +
        relic.type,
      describeRelicStats(relic),
      'effect' in relic ? relic.effect : undefined,
      ...('fixedEffects' in relic ? relic.fixedEffects : []),
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
