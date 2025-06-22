import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
  ListUsersRequest,
  DeleteUserRequest,
  DeleteUserResponse,
  GetUserRequest,
  UserListResponse,
  UserServiceController,
  UserServiceControllerMethods,
} from '@auth-microservices/shared/types';

@UserServiceControllerMethods()
@Injectable()
export class UserService implements UserServiceController {
  constructor(private readonly prisma: PrismaService) {}

  private toUserResponse(user: any): UserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async createUser(data: CreateUserRequest): Promise<UserResponse> {
    const user = await this.prisma.user.create({ data });
    return this.toUserResponse(user);
  }

  async getUser(request: GetUserRequest): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: request.id } });
    if (!user) throw new NotFoundException('User not found');
    return this.toUserResponse(user);
  }

  async updateUser(data: UpdateUserRequest): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: data.id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: data.id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
      },
    });

    return this.toUserResponse(updated);
  }

  async deleteUser(request: DeleteUserRequest): Promise<DeleteUserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: request.id } });
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    await this.prisma.user.delete({ where: { id: request.id } });

    return { success: true, message: 'User deleted successfully' };
  }

  async listUsers(query: ListUsersRequest): Promise<UserListResponse> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;

    const where: any = {};
    if (query.name) where.name = { contains: query.name, mode: 'insensitive' };
    if (query.email) where.email = { contains: query.email, mode: 'insensitive' };
    if (query.phone) where.phone = { contains: query.phone };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((user) => this.toUserResponse(user)),
      total,
      page,
      limit,
    };
  }
}
