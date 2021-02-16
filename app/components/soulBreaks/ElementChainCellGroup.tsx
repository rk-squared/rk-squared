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
}

export class ElementChainCellGroup extends React.Component<Props> {
  render() {
    const { count } = this.props;
    const chains = this.props.chains || { phys: [], mag: [] };
    return (
      <>
        {_.times(count, i => (
          <ChainCell key={i} soulBreak={chains.phys[i]} />
        ))}
        {_.times(count, i => (
          <ChainCell key={count + i} soulBreak={chains.mag[i]} />
        ))}
      </>
    );
  }
}
