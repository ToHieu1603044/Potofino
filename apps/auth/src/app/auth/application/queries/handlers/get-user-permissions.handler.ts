import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserPermissionsQuery } from '../impl/get-user-permissions.query';
import { PrismaService } from '../../../../prisma/prisma.service'; 
import { GetUserPermissionsResponse, Permission } from '@auth-microservices/shared/types';

@QueryHandler(GetUserPermissionsQuery)
export class GetUserPermissionsHandler implements IQueryHandler<GetUserPermissionsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserPermissionsQuery): Promise<GetUserPermissionsResponse> {
    const { userId } = query;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      return { permissions: [] };
    }

    // Optimized query to fetch permissions directly
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        role: {
          userRoles: {
            some: {
              userId: userId,
              role: { isActive: true },
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
            }
          }
        },
        permission: {
          isActive: true
        }
      },
      include: { permission: true },
      distinct: ['permissionId'],
    });

    const permissions: Permission[] = rolePermissions.map(rp => ({
      id: rp.permission.id,
      name: rp.permission.name,
      resource: rp.permission.resource,
      action: rp.permission.action,
      displayName: rp.permission.displayName,
      description: rp.permission.description || '',
      isActive: rp.permission.isActive,
    }));

    return { permissions };
  }
}