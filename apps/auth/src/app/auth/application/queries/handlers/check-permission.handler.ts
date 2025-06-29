import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CheckPermissionQuery } from '../impl/check-permission.query';
import { CheckPermissionResponse } from '@auth-microservices/shared/types';
import { PrismaService } from '../../../../prisma/prisma.service';

@QueryHandler(CheckPermissionQuery)
export class CheckPermissionHandler implements IQueryHandler<CheckPermissionQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: CheckPermissionQuery): Promise<CheckPermissionResponse> {
    const { userId, resource, action } = query;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      return { hasPermission: false };
    }

    const hasPermission = await this.prisma.rolePermission.count({
      where: {
        role: {
          isActive: true,
          userRoles: {
            some: {
              userId: userId,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
            }
          }
        },
        permission: {
          resource,
          action,
          isActive: true,
        },
      },
    });

    return { hasPermission: hasPermission > 0 };
  }
}