import * as React from 'react';

import { RelicDrawPullParams } from '../../data/probabilities';

interface Props {
  pull: RelicDrawPullParams;
  onClick: (pull: RelicDrawPullParams) => void;
}

export class DrawButton extends React.PureComponent<Props> {
  handleClick = () => {
    this.props.onClick(this.props.pull);
  };

  render() {
    const { pull } = this.props;
    return (
      <button type="button" className="btn btn-primary mr-1" onClick={this.handleClick}>
        Relic Draw ×{pull.drawCount}
      </button>
    );
  }
}
