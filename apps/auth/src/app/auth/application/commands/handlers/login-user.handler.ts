import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { LoginUserCommand } from '../impl/login-user.command';
import { IUserRepository } from '../../../domain/interfaces/user.repository.interface';
import { UnauthorizedException } from '../../../domain/exceptions/unauthorized.exception';
import { AuthResponse } from '@auth-microservices/shared/types';
import { TokenDomainService } from '../../../domain/services/token.domain-service';
import { UserLoggedInEvent } from '../../../domain/events/user-logged-in.event';
import { Inject } from '@nestjs/common';

@CommandHandler(LoginUserCommand)
export class LoginUserHandler implements ICommandHandler<LoginUserCommand> {
  constructor(
    private readonly publisher: EventPublisher,
    private readonly tokenDomainService: TokenDomainService,
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: LoginUserCommand): Promise<AuthResponse> {
    const { email, password } = command;

    const userAggregate = await this.userRepository.findByEmail(email);
    if (!userAggregate || !(await userAggregate.validatePassword(password))) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (!userAggregate.getIsActive()) {
      throw new UnauthorizedException('Your account has been deactivated.');
    }

    const mergedUser = this.publisher.mergeObjectContext(userAggregate);
    const { accessToken, refreshToken, refreshTokenEntity } = await this.tokenDomainService.generateAuthTokens(mergedUser);

    mergedUser.addRefreshToken(refreshTokenEntity.token, refreshTokenEntity.expiresAt);
    await this.userRepository.save(mergedUser); // Save changes to refresh tokens
    mergedUser.apply(new UserLoggedInEvent(mergedUser.getId(), mergedUser.getEmail()));
    mergedUser.commit();

    return { accessToken, refreshToken, userId: mergedUser.getId() };
  }
}