import * as React from 'react';

import { ModalDialog } from '../common/ModalDialog';
import RelicDrawSimulator from './RelicDrawSimulator';

interface Props {
  bannerId: number;
}

interface State {
  isOpen: boolean;
}

export class RelicDrawModal extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isOpen: false,
    };
  }

  handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    this.setState({ isOpen: true });
  };

  handleClose = () => {
    this.setState({ isOpen: false });
  };

  render() {
    const { bannerId } = this.props;
    const { isOpen } = this.state;
    return (
      <>
        <button type="button" className="btn btn-link" onClick={this.handleOpen}>
          Relic Draw Simulator
        </button>
        {isOpen && (
          <ModalDialog
            isOpen={this.state.isOpen}
            onClose={this.handleClose}
            className="modal-lg app-modal-full-height"
            title={'Relic Draw Simulator'}
          >
            <RelicDrawSimulator bannerId={bannerId} />
          </ModalDialog>
        )}
      </>
    );
  }
}
