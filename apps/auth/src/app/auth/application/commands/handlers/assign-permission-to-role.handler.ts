import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { AssignPermissionToRoleCommand } from '../impl/assign-permission-to-role.command';
import { IRoleRepository } from '../../../domain/interfaces/role.repository.interface';
import { IPermissionRepository } from '../../../domain/interfaces/permission.repository.interface';
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { AssignPermissionToRoleResponse } from '@auth-microservices/shared/types';
import { Inject } from '@nestjs/common';
import { PermissionAssignedToRoleEvent } from '../../../domain/events/permission-assigned-to-role.event';

@CommandHandler(AssignPermissionToRoleCommand)
export class AssignPermissionToRoleHandler implements ICommandHandler<AssignPermissionToRoleCommand> {
  constructor(
    private readonly publisher: EventPublisher,
    @Inject('IRoleRepository') private readonly roleRepository: IRoleRepository,
    @Inject('IPermissionRepository') private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(command: AssignPermissionToRoleCommand): Promise<AssignPermissionToRoleResponse> {
    const { roleId, permissionId } = command;

    const roleAggregate = await this.roleRepository.findById(roleId);
    if (!roleAggregate) throw new NotFoundException('Role not found.');

    const permissionEntity = await this.permissionRepository.findById(permissionId);
    if (!permissionEntity) throw new NotFoundException('Permission not found.');

    const mergedRole = this.publisher.mergeObjectContext(roleAggregate);
    mergedRole.assignPermission(permissionId);

    await this.roleRepository.save(mergedRole);
    mergedRole.apply(new PermissionAssignedToRoleEvent(roleId, permissionId));
    mergedRole.commit();

    return { rolePermissionId: 'assigned-successfully' };
  }
}