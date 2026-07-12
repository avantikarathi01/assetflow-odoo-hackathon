import { prisma } from '@/lib/db/prisma';
import { RegisterDTO, LoginDTO } from './schemas';
import { ConflictError, NotFoundError, UnauthorizedError } from '../core/errors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production';

export class AuthService {
  static async registerOrganization(data: RegisterDTO) {
    const slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    // Use transaction for atomic registration
    return prisma.$transaction(async (tx) => {
      // 1. Check for existing organization
      const existingOrg = await tx.organization.findUnique({ where: { slug } });
      if (existingOrg) {
        throw new ConflictError('Organization with this ID already exists');
      }

      // 2. Create organization
      const org = await tx.organization.create({
        data: {
          name: data.organizationName,
          slug,
        },
      });

      // 3. Create Roles
      const adminRole = await tx.role.create({
        data: { organizationId: org.id, name: 'ADMIN', description: 'Full administrative access', isSystem: true, permissions: ['*'] },
      });
      const managerRole = await tx.role.create({
        data: { organizationId: org.id, name: 'MANAGER', description: 'Department or Location manager', isSystem: true, permissions: ['read', 'write'] },
      });
      const employeeRole = await tx.role.create({
        data: { organizationId: org.id, name: 'EMPLOYEE', description: 'Standard employee', isSystem: true, permissions: ['read'] },
      });

      // 4. Create Users
      const passwordHash = await bcrypt.hash(data.password, 12);
      
      // Admin User
      const adminUser = await tx.user.create({
        data: { organizationId: org.id, firstName: data.firstName, lastName: data.lastName, email: data.email, passwordHash },
      });
      await tx.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });

      // Hackathon Shortcut: Auto-create Manager & Employee for testing RBAC
      const managerUser = await tx.user.create({
        data: { organizationId: org.id, firstName: 'Demo', lastName: 'Manager', email: `manager@${slug}.com`, passwordHash },
      });
      await tx.userRole.create({ data: { userId: managerUser.id, roleId: managerRole.id } });

      const employeeUser = await tx.user.create({
        data: { organizationId: org.id, firstName: 'Demo', lastName: 'Employee', email: `employee@${slug}.com`, passwordHash },
      });
      await tx.userRole.create({ data: { userId: employeeUser.id, roleId: employeeRole.id } });

      // 5. Log activity
      await tx.activityLog.create({
        data: {
          organizationId: org.id,
          actorId: adminUser.id,
          action: 'CREATED',
          entityType: 'Organization',
          entityId: org.id,
          reason: 'Initial Registration with Demo Users',
        }
      });

      return { organization: org, user: { id: adminUser.id, email: adminUser.email } };
    }, { timeout: 25000 });
  }

  static async login(data: LoginDTO) {
    const org = await prisma.organization.findUnique({
      where: { slug: data.organizationSlug },
    });

    if (!org) {
      throw new UnauthorizedError('Invalid credentials or organization');
    }

    const user = await prisma.user.findFirst({
      where: {
        organizationId: org.id,
        email: data.email,
        deletedAt: null,
      },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Invalid credentials or account inactive');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate JWT and Session
    const token = jwt.sign(
      { userId: user.id, organizationId: org.id },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { token, user: { id: user.id, email: user.email, roles: user.userRoles.map(ur => ur.role.name) } };
  }

  static async promoteEmployee(organizationId: string, targetUserId: string, roleName: string) {
    const user = await prisma.user.findFirst({
      where: { id: targetUserId, organizationId, deletedAt: null }
    });
    if (!user) throw new NotFoundError('User not found');

    let role = await prisma.role.findFirst({
      where: { name: roleName, organizationId }
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          organizationId,
          name: roleName,
          description: `${roleName} role`
        }
      });
    }

    // Upsert UserRole mapping
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: targetUserId,
          roleId: role.id
        }
      },
      create: {
        userId: targetUserId,
        roleId: role.id
      },
      update: {}
    });

    return { success: true };
  }
}
