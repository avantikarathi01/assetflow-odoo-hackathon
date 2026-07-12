import { prisma } from '@/lib/db/prisma';
import { NotificationType, NotificationSeverity } from '@prisma/client';

export class NotificationService {
  static async create(
    organizationId: string,
    userId: string,
    type: NotificationType,
    severity: NotificationSeverity,
    title: string,
    message: string,
    entityType?: string,
    entityId?: string
  ) {
    return prisma.notification.create({
      data: {
        organizationId,
        userId,
        type,
        severity,
        title,
        message,
        entityType,
        entityId
      }
    });
  }

  static async getUnreadAndRecent(organizationId: string, userId: string) {
    return prisma.notification.findMany({
      where: { organizationId, userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  static async markAsRead(organizationId: string, notificationId: string, userId: string) {
    return prisma.notification.update({
      where: { id: notificationId, organizationId, userId },
      data: { readAt: new Date() }
    });
  }
}
