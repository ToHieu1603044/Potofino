import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { KafkaService } from '../kafka/kafka.service';
import { lastValueFrom } from 'rxjs';

import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  LogoutResponse,
  ValidateTokenResponse,
} from '@auth-microservices/shared/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly kafkaService: KafkaService,
    // @Inject(USER_PACKAGE_NAME) private readonly client: ClientGrpc,
  ) {}

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const { name, email, phone, password } = data;
      const hashedPassword = await bcrypt.hash(password, 10);

      const userExists = await this.prisma.user.findUnique({ where: { email } });
      if (userExists) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: 'User already exists',
        });
      }

      const createdUser = await this.prisma.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
        },
      });

      const tokens = await this.generateTokens(createdUser.id, email);
      await this.saveRefreshToken(createdUser.id, tokens.refreshToken);

      return {
        success: true,
        message: 'Registered successfully',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          phone: createdUser.phone,
          createdAt: createdUser.createdAt.toISOString(),
          updatedAt: createdUser.updatedAt.toISOString(),
        },
      };
    } catch (error) {
      throw new RpcException({
        code: status.INTERNAL,
        message: error?.message || 'Registration failed',
      });
    }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const { email, password } = data;
      const user = await this.prisma.user.findUnique({ where: { email } });

      if (!user) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'User not found',
        });
      }

      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid credentials',
        });
      }

      const tokens = await this.generateTokens(user.id, user.email);
      await this.saveRefreshToken(user.id, tokens.refreshToken);

      return {
        success: true,
        message: 'Logged in successfully',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      };
    } catch (error) {
      throw new RpcException({
        code: status.INTERNAL,
        message: error?.message || 'Login failed',
      });
    }
  }

  async logout(userId: string): Promise<LogoutResponse> {
    try {
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      throw new RpcException({
        code: status.INTERNAL,
        message: error?.message || 'Logout failed',
      });
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const saved = await this.prisma.refreshToken.findFirst({
        where: { token: refreshToken, userId: decoded.sub },
      });

      if (!saved) throw new UnauthorizedException('Invalid refresh token');

      const newTokens = await this.generateTokens(decoded.sub, decoded.email);
      await this.saveRefreshToken(decoded.sub, newTokens.refreshToken);

      // Replace this with a proper microservice call or local DB query
      const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });

      return {
        success: true,
        message: 'Token refreshed',
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      };
    } catch (error) {
      throw new UnauthorizedException(error?.message || 'Invalid or expired refresh token');
    }
  }

  async validateToken(token: string): Promise<ValidateTokenResponse> {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      return {
        valid: true,
        userId: decoded.sub,
        email: decoded.email,
        message: 'Token is valid',
      };
    } catch {
      return {
        valid: false,
        userId: '',
        email: '',
        message: 'Invalid token',
      };
    }
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }
}
