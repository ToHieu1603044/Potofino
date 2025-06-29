import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../domain/interfaces/user.repository.interface';
import { UserAggregate } from '../../../domain/aggregates/user.aggregate';
import { PrismaService } from '../../../../prisma/prisma.service';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class UserPrismaRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly userSelect = {
    id: true,
    email: true,
    password: true,
    firstName: true,
    name: true,
    lastName: true,
    isActive: true,
    phone: true,
    createdAt: true,
    updatedAt: true,
    refreshTokens: {
      select: {
        id: true,
        token: true,
        userId: true,
        expiresAt: true,
      },
    },
    userRoles: {
      select: {
        id: true,
        userId: true,
        roleId: true,
        assignedBy: true,
        expiresAt: true,
      },
    },
  };

  async findById(id: string): Promise<UserAggregate | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });
    return user ? UserMapper.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<UserAggregate | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: this.userSelect,
    });
    return user ? UserMapper.toDomain(user) : null;
  }

  async findByRefreshToken(token: string): Promise<UserAggregate | null> {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          select: this.userSelect,
        },
      },
    });
    return refreshToken?.user ? UserMapper.toDomain(refreshToken.user) : null;
  }

  async save(userAggregate: UserAggregate): Promise<UserAggregate> {
    const data = UserMapper.toPersistence(userAggregate);

    const result = await this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { id: userAggregate.getId() },
      });

      let savedUser;
      if (existingUser) {
        savedUser = await tx.user.update({
          where: { id: userAggregate.getId() },
          data,
        });
      } else {
        savedUser = await tx.user.create({ data });
      }

      for (const rt of userAggregate.getRefreshTokens()) {
        await tx.refreshToken.upsert({
          where: { id: rt.id },
          update: {
            token: rt.token,
            expiresAt: rt.expiresAt,
          },
          create: {
            id: rt.id,
            token: rt.token,
            userId: rt.userId,
            expiresAt: rt.expiresAt,
          },
        });
      }

      for (const ur of userAggregate.getUserRoles()) {
        await tx.userRole.upsert({
          where: { id: ur.id },
          update: {
            assignedBy: ur.assignedBy,
            expiresAt: ur.expiresAt,
          },
          create: {
            id: ur.id,
            userId: ur.userId,
            roleId: ur.roleId,
            assignedBy: ur.assignedBy,
            expiresAt: ur.expiresAt,
          },
        });
      }

      const fullUser = await tx.user.findUniqueOrThrow({
        where: { id: userAggregate.getId() },
        select: this.userSelect,
      });

      return fullUser;
    });

    return UserMapper.toDomain(result);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { id } });
    return count > 0;
  }
}
