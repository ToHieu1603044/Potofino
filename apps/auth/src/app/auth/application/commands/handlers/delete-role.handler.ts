import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { DeleteRoleCommand } from '../impl/delete-role.command';
import { IRoleRepository } from '../../../domain/interfaces/role.repository.interface';
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { DeleteRoleResponse } from '@auth-microservices/shared/types';
import { Inject } from '@nestjs/common';
import { RoleDeletedEvent } from '../../../domain/events/role-deleted.event';
import { BadRequestException } from '../../../domain/exceptions/bad-request.exception';

@CommandHandler(DeleteRoleCommand)
export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand> {
  constructor(
    private readonly publisher: EventPublisher,
    @Inject('IRoleRepository') private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(command: DeleteRoleCommand): Promise<DeleteRoleResponse> {
    const { id } = command;

    const roleAggregate = await this.roleRepository.findById(id);
    if (!roleAggregate) throw new NotFoundException('Role not found.');

    const userRolesCount = await this.roleRepository.countUsersWithRole(id);
    const rolePermissionsCount = await this.roleRepository.countPermissionsForRole(id);

    // Domain logic for deletion
    try {
      roleAggregate.canBeDeleted(userRolesCount > 0, rolePermissionsCount > 0);
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw new BadRequestException(e.message);
      }
      throw e; // Re-throw other unexpected errors
    }

    await this.roleRepository.delete(id);
    const mergedRole = this.publisher.mergeObjectContext(roleAggregate);
    mergedRole.apply(new RoleDeletedEvent(mergedRole.getId(), mergedRole.getName()));
    mergedRole.commit();

    return { success: true };
  }
}