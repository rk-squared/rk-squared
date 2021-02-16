import { EnlirSoulBreak } from '../../data/enlir';
import * as React from 'react';

const styles = require('./ChainCell.scss');

interface Props {
  soulBreak: EnlirSoulBreak | undefined;
  ownedSoulBreaks?: Set<number>;
  isAnonymous?: boolean;
}

export class ChainCell extends React.Component<Props> {
  render() {
    const { soulBreak, ownedSoulBreaks, isAnonymous } = this.props;
    const className =
      !isAnonymous && ownedSoulBreaks && (!soulBreak || !ownedSoulBreaks.has(soulBreak.id))
        ? styles.unowned
        : undefined;
    return <td className={className}>{soulBreak ? soulBreak.character : undefined}</td>;
  }
}
