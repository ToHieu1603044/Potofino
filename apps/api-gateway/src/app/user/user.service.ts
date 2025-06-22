import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  CreateUserRequestDto,
  UpdateUserRequestDto,
  GetUserRequestDto,
  DeleteUserRequestDto,
  ListUsersRequestDto,
} from './dto/user.dto';
import { USER_PACKAGE_NAME, USER_SERVICE_NAME, UserServiceClient } from '@auth-microservices/shared/types';

@Injectable()
export class UserService implements OnModuleInit {
  private userService: UserServiceClient;

  constructor(@Inject(USER_PACKAGE_NAME) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  async createUser(dto: CreateUserRequestDto) {
    return lastValueFrom(this.userService.createUser(dto)); 
  }

  async getUser(dto: GetUserRequestDto) {
    return lastValueFrom(this.userService.getUser(dto)); 
  }

  async updateUser(dto: UpdateUserRequestDto) {
    return lastValueFrom(this.userService.updateUser(dto)); 
  }

  async deleteUser(dto: DeleteUserRequestDto) {
    return lastValueFrom(this.userService.deleteUser(dto)); 
  }

  async listUsers(dto: ListUsersRequestDto) {
    return lastValueFrom(this.userService.listUsers(dto)); 
  }
}
