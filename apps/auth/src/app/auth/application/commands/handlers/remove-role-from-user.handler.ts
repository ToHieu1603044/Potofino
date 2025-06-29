import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { RemoveRoleFromUserCommand } from '../impl/remove-role-from-user.command';
import { IUserRepository } from '../../../domain/interfaces/user.repository.interface';
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { RemoveRoleFromUserResponse } from '@auth-microservices/shared/types';
import { Inject } from '@nestjs/common';
import { RoleRemovedFromUserEvent } from '../../../domain/events/role-removed-from-user.event';

@CommandHandler(RemoveRoleFromUserCommand)
export class RemoveRoleFromUserHandler implements ICommandHandler<RemoveRoleFromUserCommand> {
  constructor(
    private readonly publisher: EventPublisher,
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: RemoveRoleFromUserCommand): Promise<RemoveRoleFromUserResponse> {
    const { userId, roleId } = command;

    const userAggregate = await this.userRepository.findById(userId);
    if (!userAggregate) throw new NotFoundException('User not found.');

    const mergedUser = this.publisher.mergeObjectContext(userAggregate);
    mergedUser.removeRole(roleId); // This method should throw NotFoundException if role not found on user
    
    await this.userRepository.save(mergedUser);
    mergedUser.apply(new RoleRemovedFromUserEvent(userId, roleId));
    mergedUser.commit();

    return { success: true };
  }
}