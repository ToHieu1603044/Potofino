import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { UpdateRoleCommand } from '../impl/update-role.command';
import { IRoleRepository } from '../../../domain/interfaces/role.repository.interface';
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { RoleResponse } from '@auth-microservices/shared/types';
import { Inject } from '@nestjs/common';
import { RoleUpdatedEvent } from '../../../domain/events/role-updated.event';
import { ConflictException } from '../../../domain/exceptions/conflict.exception';

@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand> {
  constructor(
    private readonly publisher: EventPublisher,
    @Inject('IRoleRepository') private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(command: UpdateRoleCommand): Promise<RoleResponse> {
    const { id, name, displayName, description, isActive } = command;

    const roleAggregate = await this.roleRepository.findById(id);
    if (!roleAggregate) throw new NotFoundException('Role not found.');

    if (name && name !== roleAggregate.getName()) {
      const existing = await this.roleRepository.findByName(name);
      if (existing && existing.getId() !== id) throw new ConflictException('New role name already exists.');
    }

    const mergedRole = this.publisher.mergeObjectContext(roleAggregate);
    mergedRole.updateDetails(name, displayName, description, isActive);

    await this.roleRepository.save(mergedRole);
    mergedRole.apply(new RoleUpdatedEvent(mergedRole.getId(), mergedRole.getName()));
    mergedRole.commit();

    return {
      role: {
        id: mergedRole.getId(),
        name: mergedRole.getName(),
        displayName: mergedRole.getDisplayName(),
        description: mergedRole.getDescription() || '',
        isActive: mergedRole.getIsActive(),
        isSystem: mergedRole.getIsSystem(),
      },
    };
  }
}