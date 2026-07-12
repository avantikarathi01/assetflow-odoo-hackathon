import { NextRequest } from 'next/server';

export async function getSession(req: NextRequest) {
  // For the purpose of the hackathon demo, we will extract this from headers if no cookie is present
  // In a full production app, this would use 'jsonwebtoken' to decode the HttpOnly cookie.
  
  const orgId = req.headers.get('x-organization-id') || 'demo-org-id';
  const userId = req.headers.get('x-user-id') || 'demo-user-id';

  if (!orgId || !userId) {
    throw new Error('Unauthorized');
  }

  return { organizationId: orgId, userId: userId };
}
