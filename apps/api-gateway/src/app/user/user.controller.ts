import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserRequestDto,
  UpdateUserRequestDto,
  GetUserRequestDto,
  DeleteUserRequestDto,
  ListUsersRequestDto,
} from './dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @Post()
  create(@Body() dto: CreateUserRequestDto) {
    return this.usersService.createUser(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.getUser({ id });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserRequestDto) {
    return this.usersService.updateUser({ ...dto, id });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.deleteUser({ id });
  }

  @Get()
  findAll(@Query() query: ListUsersRequestDto) {
    return this.usersService.listUsers(query);
  }
}
