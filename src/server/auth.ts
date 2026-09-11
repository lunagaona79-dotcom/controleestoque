import crypto from 'node:crypto';

export interface UserSession {
  token: string;
  user: {
    id: number;
    username: string;
    name: string;
    role: 'admin' | 'operador';
  };
  expiresAt: number;
}

// In-memory active sessions store
const sessions = new Map<string, UserSession>();

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
}

export function createSession(user: { id: number; username: string; name: string; role: 'admin' | 'operador' }): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  sessions.set(token, {
    token,
    user,
    expiresAt,
  });
  return token;
}

export function getSession(token: string): UserSession | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}
