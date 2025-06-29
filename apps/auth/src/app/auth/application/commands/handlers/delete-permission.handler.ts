import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { DeletePermissionCommand } from '../impl/delete-permission.command';
import { IPermissionRepository } from '../../../domain/interfaces/permission.repository.interface';
import { PrismaService } from '../../../../prisma/prisma.service'; 
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { DeletePermissionResponse } from '@auth-microservices/shared/types';
import { BadRequestException, Inject } from '@nestjs/common';
import { PermissionDeletedEvent } from '../../../domain/events/permission-deleted.event';

@CommandHandler(DeletePermissionCommand)
export class DeletePermissionHandler implements ICommandHandler<DeletePermissionCommand> {
  constructor(
    private readonly publisher: EventPublisher,
    @Inject('IPermissionRepository') private readonly permissionRepository: IPermissionRepository,
    private readonly prisma: PrismaService, 
  ) {}

  async execute(command: DeletePermissionCommand): Promise<DeletePermissionResponse> {
    const { id } = command;

    const permissionEntity = await this.permissionRepository.findById(id);
    if (!permissionEntity) throw new NotFoundException('Permission not found.');

    const rolePermissionsCount = await this.prisma.rolePermission.count({ where: { permissionId: id } });
    if (rolePermissionsCount > 0) {
      throw new BadRequestException('Cannot delete permission assigned to roles.');
    }

    await this.permissionRepository.delete(id);
    this.publisher.mergeObjectContext(permissionEntity).apply(new PermissionDeletedEvent(permissionEntity.id, permissionEntity.name));
    this.publisher.mergeObjectContext(permissionEntity).commit();

    return { success: true };
  }
}