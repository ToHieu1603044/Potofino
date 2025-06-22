import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from './user.service';
import {
  CreateUserRequestDto,
  DeleteUserRequestDto,
  GetUserRequestDto,
  ListUsersRequestDto,
  UpdateUserRequestDto,
} from './dto/user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @GrpcMethod('UserService', 'GetUser')
  async getUser(data: GetUserRequestDto) {
    return this.userService.getUser({ id: data.id });
  }

  @GrpcMethod('UserService', 'ListUsers')
  async listUsers(data: ListUsersRequestDto) {
    return this.userService.listUsers({
      page: data.page,
      limit: data.limit,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
    });
  }

  @GrpcMethod('UserService', 'CreateUser')
  async createUser(data: CreateUserRequestDto) {
    return this.userService.createUser(data);
  }

  @GrpcMethod('UserService', 'UpdateUser')
  async updateUser(data: UpdateUserRequestDto) {
    return this.userService.updateUser({
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
    });
  }

  @GrpcMethod('UserService', 'DeleteUser')
  async deleteUser(data: DeleteUserRequestDto) {
    return this.userService.deleteUser({ id: data.id });
  }
}
