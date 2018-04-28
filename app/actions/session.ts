import { createAction } from 'typesafe-actions';

export interface Session {
  // User ID.  A very large (~50 bit) integer.
  userId?: string;

  // User session - 32 character hexadecimal string
  userSession?: string;

  // http_session_sid cookie
  sessionCookie?: string;
}

export const updateSession = createAction('UPDATE_SESSION', (session: Session) => ({
  type: 'UPDATE_SESSION',
  payload: session
}));

export type SessionAction = ReturnType<typeof updateSession>;
