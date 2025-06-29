import { PermissionEntity } from '../../../domain/entities/permission.entity';
import { Permission, Prisma } from '@prisma/client-auth';

type PermissionPrisma = Pick<
  Permission,
  'id' | 'name' | 'resource' | 'action' | 'displayName' | 'description' | 'isActive' | 'createdAt' | 'updatedAt'
>;

export class PermissionMapper {
  static toDomain(prisma: PermissionPrisma): PermissionEntity {
    const permission = PermissionEntity.create(
      prisma.id,
      prisma.name,
      prisma.resource,
      prisma.action,
      prisma.displayName,
      prisma.description ?? undefined,
    );

    permission.createdAt = prisma.createdAt;
    permission.updatedAt = prisma.updatedAt;
    permission.isActive = prisma.isActive;

    return permission;
  }

  static toCreateInput(permission: PermissionEntity): Prisma.PermissionCreateInput {
    return {
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      displayName: permission.displayName,
      description: permission.description,
      isActive: permission.isActive,
    };
  }

  static toUpdateInput(permission: PermissionEntity): Prisma.PermissionUpdateInput {
    return {
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      displayName: permission.displayName,
      description: permission.description,
      isActive: permission.isActive,
    };
  }

  static toPersistence(permission: PermissionEntity): Prisma.PermissionUncheckedCreateInput {
    return {
      id: permission.id,
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      displayName: permission.displayName,
      description: permission.description,
      isActive: permission.isActive,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    };
  }
}
