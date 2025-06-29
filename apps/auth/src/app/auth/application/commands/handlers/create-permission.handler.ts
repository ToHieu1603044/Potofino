import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { CreatePermissionCommand } from '../impl/create-permission.command';
import { IPermissionRepository } from '../../../domain/interfaces/permission.repository.interface';
import { ConflictException } from '../../../domain/exceptions/conflict.exception';
import { PermissionResponse } from '@auth-microservices/shared/types';
import { PermissionEntity } from '../../../domain/entities/permission.entity';
import { Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PermissionCreatedEvent } from '../../../domain/events/permission-created.event';

@CommandHandler(CreatePermissionCommand)
export class CreatePermissionHandler implements ICommandHandler<CreatePermissionCommand> {
  constructor(
    private readonly publisher: EventPublisher,
    @Inject('IPermissionRepository') private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(command: CreatePermissionCommand): Promise<PermissionResponse> {
    const { name, resource, action, displayName, description, isActive } = command;

    const existingPermissionByName = await this.permissionRepository.findByName(name);
    if (existingPermissionByName) {
      throw new ConflictException('Permission name already exists.');
    }

    const existingPermissionByResourceAction = await this.permissionRepository.findByResourceAndAction(resource, action);
    if (existingPermissionByResourceAction) {
      throw new ConflictException('A permission with this resource and action already exists.');
    }

    const permissionId = uuidv4();
    const permissionEntity = PermissionEntity.create(permissionId, name, resource, action, displayName, description);
    if (isActive !== undefined) {
        permissionEntity.update(undefined, undefined, undefined, undefined, undefined, isActive);
    }

    const savedPermission = await this.permissionRepository.save(permissionEntity);

    this.publisher.mergeObjectContext(savedPermission).apply(new PermissionCreatedEvent(savedPermission.id, savedPermission.name, savedPermission.resource, savedPermission.action));
    this.publisher.mergeObjectContext(savedPermission).commit();

    return {
      permission: {
        id: savedPermission.id,
        name: savedPermission.name,
        resource: savedPermission.resource,
        action: savedPermission.action,
        displayName: savedPermission.displayName,
        description: savedPermission.description || '',
        isActive: savedPermission.isActive,
      },
    };
  }
}