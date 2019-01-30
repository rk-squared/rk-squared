import { createAction } from 'typesafe-actions';

import { LangType } from '../api/apiUrls';

export interface Session {
  // User ID.  A very large (~50 bit) integer.
  userId?: string;

  // Is this user using the Japanese (JP) version instead of global (GL)?
  isJp?: boolean;

  // User session - 32 character hexadecimal string
  userSession?: string;

  // http_session_sid cookie
  sessionCookie?: string;
}

export const getLang = (session: Session): LangType => (session.isJp ? LangType.Jp : LangType.Gl);

export const updateSession = createAction('UPDATE_SESSION', (session: Session) => ({
  type: 'UPDATE_SESSION',
  payload: session,
}));

export type SessionAction = ReturnType<typeof updateSession>;
