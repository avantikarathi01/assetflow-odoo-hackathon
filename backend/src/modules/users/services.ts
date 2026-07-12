import { prisma } from '@/lib/db/prisma';
import { NotFoundError, ConflictError } from '../core/errors';
import bcrypt from 'bcryptjs';

export class UserService {
  static async createUser(organizationId: string, data: any) {
    const existing = await prisma.user.findFirst({
      where: {
        organizationId,
        email: data.email,
        deletedAt: null
      }
    });

    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = data.password 
      ? await bcrypt.hash(data.password, 12)
      : await bcrypt.hash(Math.random().toString(36).slice(-8), 12); // random temporary password

    return prisma.user.create({
      data: {
        organizationId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        employeeCode: data.employeeCode,
        departmentId: data.departmentId,
        passwordHash,
        status: data.status || 'INVITED',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        employeeCode: true,
      }
    });
  }

  static async getUsers(organizationId: string, query?: { departmentId?: string }) {
    return prisma.user.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(query?.departmentId && { departmentId: query.departmentId })
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        department: {
          select: { id: true, name: true }
        }
      }
    });
  }
}
