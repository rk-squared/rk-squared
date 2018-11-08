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

const initialState = {
  messages: [],
};

export function messages(state: MessagesState = initialState, action: MessagesAction): MessagesState {
  switch (action.type) {
    case getType(showMessage):
      return {
        ...state,
        messages: [...state.messages, { ...action.message }]
      };

    case getType(hideMessage):
      return {
        ...state,
        messages: _.omit(state.messages, action.messageId)
      };

    /* istanbul ignore next */
    default:
      return state;
  }
}
