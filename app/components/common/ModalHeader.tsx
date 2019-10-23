import * as React from 'react';

interface Props {
  onClose?: () => void;
  children: any;
}

export class ModalHeader extends React.Component<Props> {
  handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    this.props.onClose!();
  };

  render() {
    const { onClose, children } = this.props;
    return (
      <div className="modal-header">
        {children}
        {onClose && (
          <button onClick={this.handleClick} className="close">
            <span aria-hidden="true">&times;</span>
          </button>
        )}
      </div>
    );
  }
}
