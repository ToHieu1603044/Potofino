import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid'; // For generating unique refresh tokens
import { UserAggregate } from '../aggregates/user.aggregate';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { UnauthorizedException } from '../exceptions/unauthorized.exception';

export interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenEntity: RefreshTokenEntity; 
}

@Injectable()
export class TokenDomainService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generates a new access token for a user.
   * @param userAggregate The user aggregate for whom to generate the token.
   * @returns The generated access token string.
   */
  async generateAccessToken(userAggregate: UserAggregate): Promise<string> {
    const payload = {
      userId: userAggregate.getId(),
      email: userAggregate.getEmail(),
      name: userAggregate.getName(),
      firstName: userAggregate.getFirstName(),
      lastName: userAggregate.getLastName(),
      phone: userAggregate.getPhone(),
      isActive: userAggregate.getIsActive(),
      createdAt: userAggregate.getCreatedAt(),
      updatedAt: userAggregate.getUpdatedAt(),
    };

    const rawExpiresIn = this.configService.get<string>('ACCESS_TOKEN_EXPIRES_IN_SECONDS');
    if (!rawExpiresIn) {
      throw new Error('ACCESS_TOKEN_EXPIRES_IN_SECONDS is not configured.');
    }

    const expiresIn = /^\d+$/.test(rawExpiresIn) ? `${rawExpiresIn}s` : rawExpiresIn;

    return this.jwtService.sign(payload, { expiresIn });
  }

  /**
   * Generates a new refresh token and its expiration date.
   * @returns An object containing the refresh token string and its expiration date.
   */
  generateRefreshToken(): { token: string; expiresAt: Date } {
    const refreshToken = uuidv4();
    const expiresInDays = this.configService.get<number>(
      'REFRESH_TOKEN_EXPIRES_IN_DAYS',
    );

    if (!expiresInDays || isNaN(expiresInDays)) {
      throw new Error('REFRESH_TOKEN_EXPIRES_IN_DAYS is not configured correctly.');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    return { token: refreshToken, expiresAt };
  }

  /**
   * Generates both access and refresh tokens for a user.
   * Also returns the RefreshTokenEntity to be persisted with the UserAggregate.
   * @param userAggregate The user aggregate.
   * @returns An object containing the access token, refresh token, and the RefreshTokenEntity.
   */
  async generateAuthTokens(userAggregate: UserAggregate): Promise<GeneratedTokens> {
    const accessToken = await this.generateAccessToken(userAggregate);
    const { token: refreshTokenValue, expiresAt: refreshTokenExpiresAt } =
      this.generateRefreshToken();

    const refreshTokenEntity = RefreshTokenEntity.create(
      refreshTokenValue,
      userAggregate.getId(),
      refreshTokenExpiresAt,
    );

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      refreshTokenEntity,
    };
  }

  /**
   * Validates an access token.
   * @param token The access token string.
   * @returns The decoded payload if valid, throws UnauthorizedException otherwise.
   */
  validateAccessToken(token: string): any {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }

  /**
   * Verifies a refresh token.
   * @param token The refresh token string.
   * @returns True if valid format, false otherwise.
   */
  verifyRefreshToken(token: string): boolean {
    return typeof token === 'string' && token.length > 0;
  }

}
