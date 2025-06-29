import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { UpdatePermissionCommand } from '../impl/update-permission.command';
import { IPermissionRepository } from '../../../domain/interfaces/permission.repository.interface';
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { PermissionResponse } from '@auth-microservices/shared/types';
import { ConflictException, Inject } from '@nestjs/common';
import { PermissionUpdatedEvent } from '../../../domain/events/permission-updated.event';

@CommandHandler(UpdatePermissionCommand)
export class UpdatePermissionHandler implements ICommandHandler<UpdatePermissionCommand> {
  constructor(
    private readonly publisher: EventPublisher,
    @Inject('IPermissionRepository') private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(command: UpdatePermissionCommand): Promise<PermissionResponse> {
    const { id, name, resource, action, displayName, description, isActive } = command;

    const permissionEntity = await this.permissionRepository.findById(id);
    if (!permissionEntity) throw new NotFoundException('Permission not found.');

    if (name && name !== permissionEntity.name) {
      const existingByName = await this.permissionRepository.findByName(name);
      if (existingByName && existingByName.id !== id) {
        throw new ConflictException('New permission name already exists.');
      }
    }

    if ((resource && action) && (resource !== permissionEntity.resource || action !== permissionEntity.action)) {
      const existingByResourceAction = await this.permissionRepository.findByResourceAndAction(resource, action);
      if (existingByResourceAction && existingByResourceAction.id !== id) {
        throw new ConflictException('A permission with this resource and action already exists.');
      }
    }

    permissionEntity.update(name, resource, action, displayName, description, isActive);

    const updatedPermission = await this.permissionRepository.save(permissionEntity);
    this.publisher.mergeObjectContext(updatedPermission).apply(new PermissionUpdatedEvent(updatedPermission.id, updatedPermission.name));
    this.publisher.mergeObjectContext(updatedPermission).commit();

    return {
      permission: {
        id: updatedPermission.id,
        name: updatedPermission.name,
        resource: updatedPermission.resource,
        action: updatedPermission.action,
        displayName: updatedPermission.displayName,
        description: updatedPermission.description || '',
        isActive: updatedPermission.isActive,
      },
    };
  }
}