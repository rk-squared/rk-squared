import { getType } from 'typesafe-actions';

import { hideMessage, Message, MessagesAction, showMessage } from '../actions/messages';

import * as _ from 'lodash';

/**
 * Messages to display to the end user.  Messages are currently stored in a
 * simple, presumably sparse, ever-incrementing array.
 */
export interface MessagesState {
  messages: Message[];
}

export const initialState = {
  messages: [],
};

export function messages(
  state: MessagesState = initialState,
  action: MessagesAction,
): MessagesState {
  switch (action.type) {
    case getType(showMessage): {
      // If this message has an ID, then discard any previous messages with
      // that ID.
      const newMessages = action.payload.id
        ? _.filter(state.messages, i => i.id !== action.payload.id)
        : state.messages.slice();

      newMessages.push(action.payload);
      return {
        ...state,
        messages: newMessages,
      };
    }

    case getType(hideMessage): {
      let newMessages: Message[];
      const messageIdOrIndex = action.payload;
      if (typeof messageIdOrIndex === 'number') {
        newMessages = state.messages.slice();
        newMessages.splice(messageIdOrIndex, 1);
      } else {
        newMessages = _.filter(state.messages, i => i.id !== messageIdOrIndex);
      }
      return {
        ...state,
        messages: newMessages,
      };
    }

    /* istanbul ignore next */
    default:
      return state;
  }
}
