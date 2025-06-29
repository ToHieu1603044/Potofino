import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { AssignRoleToUserCommand } from '../impl/assign-role-to-user.command';
import { IUserRepository } from '../../../domain/interfaces/user.repository.interface';
import { IRoleRepository } from '../../../domain/interfaces/role.repository.interface';
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { AssignRoleToUserResponse } from '@auth-microservices/shared/types';
import { Inject } from '@nestjs/common';
import { RoleAssignedToUserEvent } from '../../../domain/events/role-assigned-to-user.event';

@CommandHandler(AssignRoleToUserCommand)
export class AssignRoleToUserHandler implements ICommandHandler<AssignRoleToUserCommand> {
  constructor(
    private readonly publisher: EventPublisher,
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    @Inject('IRoleRepository') private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(command: AssignRoleToUserCommand): Promise<AssignRoleToUserResponse> {
    const { userId, roleId, assignedBy, expiresAt } = command;

    const userAggregate = await this.userRepository.findById(userId);
    if (!userAggregate) throw new NotFoundException('User not found.');

    const roleAggregate = await this.roleRepository.findById(roleId);
    if (!roleAggregate) throw new NotFoundException('Role not found.');

    const mergedUser = this.publisher.mergeObjectContext(userAggregate);
    const expiresAtDate = expiresAt ? new Date(expiresAt) : undefined;
    mergedUser.assignRole(roleId, assignedBy, expiresAtDate);

    await this.userRepository.save(mergedUser);
    mergedUser.apply(new RoleAssignedToUserEvent(userId, roleId, assignedBy, expiresAtDate));
    mergedUser.commit();

    return { userRoleId: 'assigned-successfully' };
  }
}