import * as React from 'react';

import { ModalDialog } from '../common/ModalDialog';
import RelicDrawSimulator from './RelicDrawSimulator';

interface Props {
  bannerId: number;
  children: any;
  className?: string;
}

interface State {
  isOpen: boolean;
}

export class RelicDrawModalLink extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isOpen: false,
    };
  }

  handleOpen = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    this.setState({ isOpen: true });
  };

  handleClose = () => {
    this.setState({ isOpen: false });
  };

  render() {
    const { bannerId, children, className } = this.props;
    const { isOpen } = this.state;
    return (
      <>
        <a href="#" className={className} onClick={this.handleOpen}>
          {children}
        </a>
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
