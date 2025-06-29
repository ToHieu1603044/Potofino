import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CheckRoleQuery } from '../impl/check-role.query';
import { CheckRoleResponse } from '@auth-microservices/shared/types';
import { PrismaService } from '../../../../prisma/prisma.service';

@QueryHandler(CheckRoleQuery)
export class CheckRoleHandler implements IQueryHandler<CheckRoleQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: CheckRoleQuery): Promise<CheckRoleResponse> {
    const { userId, roleNames, requireAll } = query;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      return { hasRole: false };
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        role: {
          name: { in: roleNames },
          isActive: true,
        },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      },
      select: { role: { select: { name: true } } },
    });

    const foundRoleNames = userRoles.map(ur => ur.role.name);

    if (requireAll) {
      const hasAll = roleNames.every(roleName => foundRoleNames.includes(roleName));
      return { hasRole: hasAll };
    } else {
      const hasAny = roleNames.some(roleName => foundRoleNames.includes(roleName));
      return { hasRole: hasAny };
    }
  }
}