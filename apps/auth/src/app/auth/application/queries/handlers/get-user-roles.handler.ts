import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserRolesQuery } from '../impl/get-user-roles.query';
import { GetUserRolesResponse, Role } from '@auth-microservices/shared/types';
import { PrismaService } from '../../../../prisma/prisma.service';

@QueryHandler(GetUserRolesQuery)
export class GetUserRolesHandler implements IQueryHandler<GetUserRolesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserRolesQuery): Promise<GetUserRolesResponse> {
    const { userId } = query;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      return { roles: [] };
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        role: { isActive: true },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      },
      include: { role: true },
    });

    const roles: Role[] = userRoles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      displayName: ur.role.displayName,
      description: ur.role.description || '',
      isActive: ur.role.isActive,
      isSystem: ur.role.isSystem,
    }));

    return { roles };
  }
}