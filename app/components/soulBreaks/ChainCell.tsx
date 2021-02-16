import { EnlirSoulBreak } from '../../data/enlir';
import * as React from 'react';

const styles = require('./ChainCell.scss');

interface Props {
  soulBreak: EnlirSoulBreak | undefined;
  ownedSoulBreaks?: Set<number>;
  isAnonymous?: boolean;
  soulBreakTooltipId?: string;
}

export class ChainCell extends React.Component<Props> {
  render() {
    const { soulBreak, ownedSoulBreaks, isAnonymous, soulBreakTooltipId } = this.props;
    const className =
      !isAnonymous && ownedSoulBreaks && (!soulBreak || !ownedSoulBreaks.has(soulBreak.id))
        ? styles.unowned
        : undefined;
    if (!soulBreak) {
      return <td className={className} />;
    }
    return (
      <td className={className} data-tip={soulBreak.id} data-for={soulBreakTooltipId}>
        {soulBreak.character}
      </td>
    );
  }
}
