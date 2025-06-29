import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { RefreshAccessTokenCommand } from '../impl/refresh-access-token.command';
import { IUserRepository } from '../../../domain/interfaces/user.repository.interface';
import { UnauthorizedException } from '../../../domain/exceptions/unauthorized.exception';
import { AuthResponse } from '@auth-microservices/shared/types';
import { Inject } from '@nestjs/common';
import { TokenDomainService } from '../../../domain/services/token.domain-service';

@CommandHandler(RefreshAccessTokenCommand)
export class RefreshAccessTokenHandler implements ICommandHandler<RefreshAccessTokenCommand> {
  constructor(
    private readonly publisher: EventPublisher,
    private readonly tokenDomainService: TokenDomainService,
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: RefreshAccessTokenCommand): Promise<AuthResponse> {
    const { refreshToken: oldRefreshTokenValue } = command;

    const userAggregate = await this.userRepository.findByRefreshToken(oldRefreshTokenValue);
    if (!userAggregate || !userAggregate.getIsActive()) {
      throw new UnauthorizedException('Invalid or expired refresh token, or user is inactive.');
    }

    const mergedUser = this.publisher.mergeObjectContext(userAggregate);

    const wasRemoved = mergedUser.removeRefreshToken(oldRefreshTokenValue);
    if (!wasRemoved) {
        throw new UnauthorizedException('Refresh token not found for this user.'); 
    }

    const { accessToken, refreshToken: newRefreshTokenValue, refreshTokenEntity } = await this.tokenDomainService.generateAuthTokens(mergedUser);

    mergedUser.addRefreshToken(refreshTokenEntity.token, refreshTokenEntity.expiresAt);

    await this.userRepository.save(mergedUser);
    mergedUser.commit(); 

    return { accessToken, refreshToken: newRefreshTokenValue, userId: mergedUser.getId() };
  }
}