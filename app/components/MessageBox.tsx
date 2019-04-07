import * as React from 'react';

import { Message } from '../actions/Messages';

interface Props {
  message: Message;
  onClose?: () => any;
}

export default class MessageBox extends React.Component<Props> {
  render() {
    const {
      message: { text, color },
      onClose,
    } = this.props;
    return (
      <div className={`alert alert-${color}`} role="alert">
        {onClose && (
          <button type="button" className="close" aria-label="Close" onClick={onClose}>
            <span aria-hidden="true">&times;</span>
          </button>
        )}
        {typeof text === 'string' ? text : <div dangerouslySetInnerHTML={text} />}
      </div>
    );
  }
}
