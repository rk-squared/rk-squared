import * as React from 'react';

interface Props {
  drawCount: number;
  onClick: (drawCount: number) => void;
}

export class DrawButton extends React.PureComponent<Props> {
  handleClick = () => {
    this.props.onClick(this.props.drawCount);
  };

  render() {
    const { drawCount } = this.props;
    return (
      <button type="button" className="btn btn-primary mr-1" onClick={this.handleClick}>
        Relic Draw ×{drawCount}
      </button>
    );
  }
}
