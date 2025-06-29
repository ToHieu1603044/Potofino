import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { RegisterUserCommand } from '../impl/register-user.command';
import { IUserRepository } from '../../../domain/interfaces/user.repository.interface';
import { ConflictException, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { UserAggregate } from '../../../domain/aggregates/user.aggregate';
import { TokenDomainService } from '../../../domain/services/token.domain-service';
import { AuthResponse } from '@auth-microservices/shared/types';
import { IRoleRepository } from '../../../domain/interfaces/role.repository.interface';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    @Inject('IRoleRepository') private readonly roleRepository: IRoleRepository,
    private readonly tokenDomainService: TokenDomainService,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: RegisterUserCommand): Promise<AuthResponse> {
    const { name, email, password, phone } = command;
    
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists.');
    }

    const userId = uuidv4();
    const userInstance = await UserAggregate.create({
      id: userId,
      email,
      phone,
      name: name,
      passwordPlain: password,
      firstName: name,
      lastName: phone, 
    });

    const userAggregate = this.publisher.mergeObjectContext(userInstance);

    const defaultUserRole = await this.roleRepository.findByName('user');
    if (defaultUserRole) {
      userAggregate.assignRole(defaultUserRole.getId(), 'system');
    } else {
      console.warn('Default "user" role not found. Ensure seed data is run!');
    }

    const { accessToken, refreshToken, refreshTokenEntity } =
      await this.tokenDomainService.generateAuthTokens(userAggregate);

    userAggregate.addRefreshToken(
      refreshTokenEntity.token,
      refreshTokenEntity.expiresAt,
    );

    await this.userRepository.save(userAggregate);

    userAggregate.commit();

    return {
      accessToken,
      refreshToken,
      userId: userAggregate.getId(),
    };
  }
}
