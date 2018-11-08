import { createAction } from 'typesafe-actions';

export type MessageColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';

export interface Message {
  id?: number;
  text: string;
  color: MessageColor;
}

export const showMessage = createAction('SHOW_MESSAGE', (message: Message) => ({
  type: 'SHOW_MESSAGE',
  message
}));

export const hideMessage = createAction('HIDE_MESSAGE', (messageId: number) => ({
  type: 'HIDE_MESSAGE',
  messageId
}));

export const showDanger = (text: string) => showMessage({text, color: 'danger'});

export type MessagesAction = ReturnType<
  typeof showMessage |
  typeof hideMessage
>;
