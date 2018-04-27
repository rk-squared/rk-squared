import * as React from 'react';

interface Props {
  onClose?: () => void;
  children: any;
}

export class ModalHeader extends React.Component<Props> {
  render() {
    const { onClose, children } = this.props;
    return (
      <div className="modal-header">
        {children}
        {onClose && <button onClick={onClose} className="close"><span aria-hidden="true">&times;</span></button>}
      </div>
    );
  }
}
