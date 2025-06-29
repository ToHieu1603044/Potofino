import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { LogoutUserCommand } from '../impl/logout-user.command';
import { IUserRepository } from '../../../domain/interfaces/user.repository.interface';
import { Inject } from '@nestjs/common';

@CommandHandler(LogoutUserCommand)
export class LogoutUserHandler implements ICommandHandler<LogoutUserCommand> {
  constructor(
    private readonly publisher: EventPublisher,
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: LogoutUserCommand): Promise<boolean> {
    const { refreshToken } = command;

    const userAggregate = await this.userRepository.findByRefreshToken(refreshToken);
    if (!userAggregate) {
  
      return true;
    }

    const mergedUser = this.publisher.mergeObjectContext(userAggregate);
    mergedUser.removeRefreshToken(refreshToken);
    await this.userRepository.save(mergedUser);
    mergedUser.commit(); 

    return true;
  }
}