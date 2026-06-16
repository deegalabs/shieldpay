import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySession, type Session } from './session';

/** Read the current session in a server component / route handler. */
export async function getSession(): Promise<Session | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}
