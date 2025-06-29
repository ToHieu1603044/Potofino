import { RoleAggregate, RoleProps } from '../../../domain/aggregates/role.aggregate';
import { RolePermissionEntity } from '../../../domain/entities/role-permission.entity';

type RoleWithPermissions = {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  rolePermissions: {
    id: string;
    roleId: string;
    permissionId: string;
  }[];
};

export class RoleMapper {
  static toDomain(prismaRole: RoleWithPermissions): RoleAggregate {
    const props: RoleProps = {
      id: prismaRole.id,
      name: prismaRole.name,
      displayName: prismaRole.displayName,
      description: prismaRole.description || undefined,
      isActive: prismaRole.isActive,
      isSystem: prismaRole.isSystem,
      createdAt: prismaRole.createdAt,
      updatedAt: prismaRole.updatedAt,
      rolePermissions: prismaRole.rolePermissions.map(rp =>
        RolePermissionEntity.create(rp.roleId, rp.permissionId, rp.id)
      ),
    };
    return RoleAggregate.create(props);
  }

  static toPersistence(roleAggregate: RoleAggregate): any {
    return {
      id: roleAggregate.getId(),
      name: roleAggregate.getName(),
      displayName: roleAggregate.getDisplayName(),
      description: roleAggregate.getDescription(),
      isActive: roleAggregate.getIsActive(),
      isSystem: roleAggregate.getIsSystem(),
    };
  }
}
