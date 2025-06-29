import { Injectable } from '@nestjs/common';
import { IRoleRepository } from '../../../domain/interfaces/role.repository.interface';
import { RoleAggregate } from '../../../domain/aggregates/role.aggregate';
import { PrismaService } from '../../../../prisma/prisma.service';
import { RoleMapper } from '../mappers/role.mapper';

@Injectable()
export class RolePrismaRepository implements IRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<RoleAggregate | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { rolePermissions: true },
    });
    return role ? RoleMapper.toDomain(role) : null;
  }

  async findByName(name: string): Promise<RoleAggregate | null> {
    const role = await this.prisma.role.findUnique({
      where: { name },
      include: { rolePermissions: true },
    });
    return role ? RoleMapper.toDomain(role) : null;
  }

  async save(roleAggregate: RoleAggregate): Promise<RoleAggregate> {
    const data = RoleMapper.toPersistence(roleAggregate);

    const result = await this.prisma.$transaction(async (tx) => {
      let createdOrUpdatedRole;
      if (await tx.role.findUnique({ where: { id: roleAggregate.getId() } })) {
        createdOrUpdatedRole = await tx.role.update({
          where: { id: roleAggregate.getId() },
          data: {
            ...data,
            updatedAt: new Date(), 
          },
        });
      } else {
        createdOrUpdatedRole = await tx.role.create({
          data: {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      const existingPermissions = await tx.rolePermission.findMany({ where: { roleId: roleAggregate.getId() } });
      const currentPermissionIds = roleAggregate.getRolePermissions().map(rp => rp.permissionId);

      for (const existing of existingPermissions) {
        if (!currentPermissionIds.includes(existing.permissionId)) {
          await tx.rolePermission.delete({ where: { id: existing.id } });
        }
      }

      for (const newRp of roleAggregate.getRolePermissions()) {
        const found = existingPermissions.some(ep => ep.permissionId === newRp.permissionId);
        if (!found) {
          await tx.rolePermission.create({
            data: {
              id: newRp.id,
              roleId: newRp.roleId,
              permissionId: newRp.permissionId,
              createdAt: newRp.createdAt,
            },
          });
        }
      }

      return await tx.role.findUniqueOrThrow({
        where: { id: roleAggregate.getId() },
        include: { rolePermissions: true },
      });
    });

    return RoleMapper.toDomain(result);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.role.delete({ where: { id } });
  }

  async countUsersWithRole(roleId: string): Promise<number> {
    return this.prisma.userRole.count({ where: { roleId } });
  }

  async countPermissionsForRole(roleId: string): Promise<number> {
    return this.prisma.rolePermission.count({ where: { roleId } });
  }
}