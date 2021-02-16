import { EnlirSoulBreak } from '../../data/enlir';
import * as React from 'react';

interface Props {
  soulBreak: EnlirSoulBreak | undefined;
}

export class ChainCell extends React.Component<Props> {
  render() {
    const { soulBreak } = this.props;
    if (!soulBreak) {
      return <td />;
    }
    return <td>{soulBreak.character}</td>;
  }
}
