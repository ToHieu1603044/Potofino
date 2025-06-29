import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllRolesQuery } from '../impl/get-all-roles.query';
import { GetAllRolesResponse, Role } from '@auth-microservices/shared/types';
import { PrismaService } from '../../../../prisma/prisma.service';

@QueryHandler(GetAllRolesQuery)
export class GetAllRolesHandler implements IQueryHandler<GetAllRolesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<GetAllRolesResponse> {
    const roles = await this.prisma.role.findMany();
    return {
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description || '',
        isActive: role.isActive,
        isSystem: role.isSystem,
      })),
    };
  }
}