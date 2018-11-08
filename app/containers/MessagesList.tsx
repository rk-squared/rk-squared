import * as React from 'react';
import { connect } from 'react-redux';

import { hideMessage as hideMessageAction, Message } from '../actions/messages';
import MessageBox from '../components/MessageBox';
import { IState } from '../reducers';

interface Props {
  messages: Message[];
  hideMessage: (id: number) => any;
}

export class MessagesList extends React.Component<Props> {
  render() {
    const { messages, hideMessage } = this.props;
    const messageIds = Object.keys(messages).sort();
    return (
      <>
        {messageIds.map(i => <MessageBox key={i} message={messages[+i]} onClose={() => hideMessage(+i)}/>)}
      </>
    );
  }
}

export default connect(
  (state: IState) => ({ messages: state.messages.messages}),
  {
    hideMessage: hideMessageAction
  }
)(MessagesList);
