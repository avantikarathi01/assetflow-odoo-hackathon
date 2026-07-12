import { prisma } from '@/lib/db/prisma';
import { ConflictError, NotFoundError } from '../core/errors';

export class DepartmentService {
  static async createDepartment(organizationId: string, data: { name: string, code: string, parentId?: string, headUserId?: string }) {
    const existingCode = await prisma.department.findFirst({
      where: {
        organizationId,
        code: data.code,
        deletedAt: null
      }
    });

    if (existingCode) {
      throw new ConflictError('Department code already in use');
    }

    const existingName = await prisma.department.findFirst({
      where: {
        organizationId,
        name: data.name,
        deletedAt: null
      }
    });

    if (existingName) {
      throw new ConflictError('Department name already in use');
    }

    if (data.parentId) {
      const parent = await prisma.department.findUnique({ where: { id: data.parentId } });
      if (!parent || parent.organizationId !== organizationId) {
        throw new NotFoundError('Parent department not found');
      }
    }

    return prisma.department.create({
      data: {
        organizationId,
        name: data.name,
        code: data.code,
        parentId: data.parentId,
        headUserId: data.headUserId,
      }
    });
  }

  static async getHierarchy(organizationId: string) {
    return prisma.department.findMany({
      where: { organizationId, parentId: null, deletedAt: null },
      include: {
        headUser: { select: { id: true, firstName: true, lastName: true } },
        children: {
          where: { deletedAt: null },
          include: {
            headUser: { select: { id: true, firstName: true, lastName: true } },
            children: true
          }
        }
      }
    });
  }
}
