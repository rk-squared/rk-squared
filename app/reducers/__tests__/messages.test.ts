import { hideMessage, Message, showMessage } from '../../actions/messages';
import { initialState, messages } from '../messages';

describe('messages reducer', () => {
  it('shows and hides messages by id', () => {
    const alphaMessage: Message = { id: 'alpha', text: 'This is a test', color: 'info' };
    const betaMessage: Message = { id: 'beta', text: 'This is also a test', color: 'info' };

    let state = messages(initialState, showMessage(alphaMessage));
    expect(state).toEqual({ messages: [alphaMessage] });

    state = messages(state, showMessage(betaMessage));
    expect(state).toEqual({ messages: [alphaMessage, betaMessage] });

    state = messages(state, hideMessage('alpha'));
    expect(state).toEqual({ messages: [betaMessage] });
  });

  it('replaces messages by id', () => {
    const alphaMessage: Message = { id: 'alpha', text: 'This is a test', color: 'info' };

    let state = messages(initialState, showMessage(alphaMessage));
    expect(state).toEqual({ messages: [alphaMessage] });

    alphaMessage.text = 'Second message';
    state = messages(state, showMessage(alphaMessage));
    expect(state.messages[0].text).toEqual('Second message');
  });
});
