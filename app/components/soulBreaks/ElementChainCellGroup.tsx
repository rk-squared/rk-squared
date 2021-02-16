import * as _ from 'lodash';
import * as React from 'react';
import { ChainCell } from './ChainCell';
import { EnlirSoulBreak } from '../../data/enlir';

interface Props {
  chains:
    | {
        phys: EnlirSoulBreak[];
        mag: EnlirSoulBreak[];
      }
    | undefined;
  count: number;

  ownedSoulBreaks?: Set<number>;
  isAnonymous?: boolean;
  soulBreakTooltipId?: string;
}

export class ElementChainCellGroup extends React.Component<Props> {
  render() {
    const { count, ownedSoulBreaks, isAnonymous, soulBreakTooltipId } = this.props;
    const chains = this.props.chains || { phys: [], mag: [] };
    const props = { ownedSoulBreaks, isAnonymous, soulBreakTooltipId };
    return (
      <>
        {_.times(count, i => (
          <ChainCell key={i} soulBreak={chains.phys[i]} {...props} />
        ))}
        {_.times(count, i => (
          <ChainCell key={count + i} soulBreak={chains.mag[i]} {...props} />
        ))}
      </>
    );
  }
}
