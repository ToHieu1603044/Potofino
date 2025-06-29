import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { RemovePermissionFromRoleCommand } from '../impl/remove-permission-from-role.command';
import { IRoleRepository } from '../../../domain/interfaces/role.repository.interface';
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { RemovePermissionFromRoleResponse } from '@auth-microservices/shared/types';
import { Inject } from '@nestjs/common';
import { PermissionRemovedFromRoleEvent } from '../../../domain/events/permission-removed-from-role.event';

@CommandHandler(RemovePermissionFromRoleCommand)
export class RemovePermissionFromRoleHandler implements ICommandHandler<RemovePermissionFromRoleCommand> {
  constructor(
    private readonly publisher: EventPublisher,
    @Inject('IRoleRepository') private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(command: RemovePermissionFromRoleCommand): Promise<RemovePermissionFromRoleResponse> {
    const { roleId, permissionId } = command;

    const roleAggregate = await this.roleRepository.findById(roleId);
    if (!roleAggregate) throw new NotFoundException('Role not found.');

    const mergedRole = this.publisher.mergeObjectContext(roleAggregate);
    mergedRole.removePermission(permissionId);
    
    await this.roleRepository.save(mergedRole);
    mergedRole.apply(new PermissionRemovedFromRoleEvent(roleId, permissionId));
    mergedRole.commit();

    return { success: true };
  }
}