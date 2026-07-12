import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '../core/errors';

export class OrganizationService {
  static async getById(id: string) {
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        departments: {
          where: { status: 'ACTIVE' },
          select: { id: true, name: true, code: true }
        },
        locations: {
          where: { status: 'ACTIVE' },
          select: { id: true, name: true, code: true }
        }
      }
    });

    if (!org || !org.isActive) {
      throw new NotFoundError('Organization not found');
    }

    return org;
  }

  static async updateSettings(id: string, data: { timezone?: string, currency?: string }) {
    return prisma.organization.update({
      where: { id },
      data,
    });
  }
}
