import { NextRequest } from 'next/server';

export interface UserSession {
  userId: string;
  organizationId: string;
  roles: string[];
}

export function getSession(request: NextRequest): UserSession | null {
  const userId = request.headers.get('x-user-id');
  const organizationId = request.headers.get('x-org-id');
  const rolesRaw = request.headers.get('x-roles');

  if (!userId || !organizationId) {
    return null;
  }

  let roles: string[] = [];
  try {
    if (rolesRaw) roles = JSON.parse(rolesRaw);
  } catch (e) {}

  return { userId, organizationId, roles };
}

export function requireAdmin(session: UserSession | null): boolean {
  if (!session) return false;
  return session.roles.includes('ADMIN');
}

export function requireManager(session: UserSession | null): boolean {
  if (!session) return false;
  return session.roles.includes('ADMIN') || session.roles.includes('MANAGER');
}
