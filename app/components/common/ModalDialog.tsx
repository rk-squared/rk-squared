import * as React from 'react';
import * as Modal from 'react-modal';

import classNames from 'classnames';

import { ModalHeader } from './ModalHeader';

require('./ModalDialog.scss');

interface Props {
  isOpen: boolean;
  title?: string | (() => any);
  onClose: () => void;
  className?: string;
  children: any;
}

export class ModalDialog extends React.Component<Props> {
  render() {
    const { isOpen, onClose, title, className, children } = this.props;

    const overlayStyles = {
      backgroundColor: 'rgba(0, 0, 0, 0.50)',
      overflowY: 'auto',
      // Ensure that the overlay appears on top of anything else using z-index
      // (e.g., RelicDrawBannerTable).
      zIndex: 100,
    };

    return (
      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        className={classNames('modal-dialog', className)}
        style={{ overlay: overlayStyles }}
      >
        <div className="modal-content">
          {title && (
            <ModalHeader onClose={onClose}>
              <h5 className="modal-title">{typeof title === 'string' ? title : title()}</h5>
            </ModalHeader>
          )}
          <div className="modal-body">{children}</div>
        </div>
      </Modal>
    );
  }
}
