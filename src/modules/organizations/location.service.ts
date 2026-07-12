import { prisma } from '@/lib/db/prisma';
import { ConflictError, NotFoundError } from '../core/errors';

export class LocationService {
  static async createLocation(organizationId: string, data: { name: string, code: string, parentId?: string }) {
    const existing = await prisma.location.findFirst({
      where: {
        organizationId,
        code: data.code,
        deletedAt: null
      }
    });

    if (existing) {
      throw new ConflictError('Location code already in use');
    }

    if (data.parentId) {
      const parent = await prisma.location.findUnique({ where: { id: data.parentId } });
      if (!parent || parent.organizationId !== organizationId) {
        throw new NotFoundError('Parent location not found');
      }
    }

    return prisma.location.create({
      data: {
        organizationId,
        name: data.name,
        code: data.code,
        parentId: data.parentId
      }
    });
  }

  static async getHierarchy(organizationId: string) {
    // For large hierarchies, we might use CTEs, but Prisma include handles simple depth well
    return prisma.location.findMany({
      where: { organizationId, parentId: null, deletedAt: null },
      include: {
        children: {
          where: { deletedAt: null },
          include: {
            children: true // Adjust depth as needed
          }
        }
      }
    });
  }
}
