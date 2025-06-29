import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllPermissionsQuery } from '../impl/get-all-permissions.query';
import { GetAllPermissionsResponse, Permission } from '@auth-microservices/shared/types';
import { PrismaService } from '../../../../prisma/prisma.service';

@QueryHandler(GetAllPermissionsQuery)
export class GetAllPermissionsHandler implements IQueryHandler<GetAllPermissionsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<GetAllPermissionsResponse> {
    const permissions = await this.prisma.permission.findMany();
    return {
      permissions: permissions.map(perm => ({
        id: perm.id,
        name: perm.name,
        resource: perm.resource,
        action: perm.action,
        displayName: perm.displayName,
        description: perm.description || '',
        isActive: perm.isActive,
      })),
    };
  }
}