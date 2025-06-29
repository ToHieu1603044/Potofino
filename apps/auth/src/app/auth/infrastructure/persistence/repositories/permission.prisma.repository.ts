import { Injectable } from '@nestjs/common';
import { IPermissionRepository } from '../../../domain/interfaces/permission.repository.interface';
import { PermissionEntity } from '../../../domain/entities/permission.entity';
import { PrismaService } from '../../../../prisma/prisma.service';
import { PermissionMapper } from '../mappers/permission.mapper';

@Injectable()
export class PermissionPrismaRepository implements IPermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PermissionEntity | null> {
    const permission = await this.prisma.permission.findUnique({ where: { id } });
    return permission ? PermissionMapper.toDomain(permission) : null;
  }

  async findByName(name: string): Promise<PermissionEntity | null> {
    const permission = await this.prisma.permission.findUnique({ where: { name } });
    return permission ? PermissionMapper.toDomain(permission) : null;
  }

  async findByResourceAndAction(resource: string, action: string): Promise<PermissionEntity | null> {
    const permission = await this.prisma.permission.findUnique({ where: { resource_action: { resource, action } } });
    return permission ? PermissionMapper.toDomain(permission) : null;
  }

  async save(permissionEntity: PermissionEntity): Promise<PermissionEntity> {
    const data = PermissionMapper.toPersistence(permissionEntity);

    const result = await this.prisma.$transaction(async (tx) => {
      let createdOrUpdatedPermission;
      if (await tx.permission.findUnique({ where: { id: permissionEntity.id } })) {
        createdOrUpdatedPermission = await tx.permission.update({
          where: { id: permissionEntity.id },
          data: {
            ...data,
            updatedAt: new Date(),
          },
        });
      } else {
        createdOrUpdatedPermission = await tx.permission.create({
          data: {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
      return createdOrUpdatedPermission;
    });

    return PermissionMapper.toDomain(result);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.permission.delete({ where: { id } });
  }
}