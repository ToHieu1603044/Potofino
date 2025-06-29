// apps/api-gateway/src/users/users.controller.ts
import { Controller, Get, Post, Body, UseGuards, Param, Put, Delete, HttpCode, HttpStatus, UseFilters } from '@nestjs/common';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { PermissionsGuard } from './guard/permissions.guard';

import { Permissions } from './decorators/permissions.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guard/roles.guard';
import { CurrentUser } from './current-user.decorator';
import { AuthGrpcService } from './auth.service';
import { lastValueFrom } from 'rxjs';
import { RpcExceptionFilter } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';

@Controller('auth')
@UseFilters(new BaseRpcExceptionFilter()) // Áp dụng filter lỗi gRPC
export class AuthController {
  constructor(private readonly authGrpcService: AuthGrpcService) {}

 @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;

    // Gọi gRPC login
    const result = await lastValueFrom(
      this.authGrpcService.login({ email, password })
    );

    return {
      message: 'Đăng nhập thành công',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result,
    };
  }
   @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: { email: string; password: string; name: string, phone: string }) {
    const { email, password, name, phone } = body;

    const result = await lastValueFrom(
      this.authGrpcService.register({ email, password, name, phone })
    );

    return {
      message: 'Đăng ký thành công',
      user: result
    };
  }
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) // Thứ tự Guards quan trọng
  @Roles(['admin']) // Chỉ vai trò 'admin'
  @Permissions([{ resource: 'user', action: 'read' }]) 
  findAll(@CurrentUser() user: any) {
    console.log(`User ${user.userId} (${user.email}) is accessing all users.`);
    return { message: 'Bạn có quyền đọc danh sách người dùng', data: [{ id: '1', name: 'Alice', email: 'alice@example.com' }] };
  }

  // Endpoint mà bất kỳ ai có vai trò 'user' và quyền 'user:read' đều có thể xem user của chính họ
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(['admin', 'user'], false) 
  @Permissions([{ resource: 'user', action: 'read' }])
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
 
    if (user.userId !== id && !user.roles.includes('admin')) {
      throw new Error('You do not have permission to access this user.');
    }
    console.log(`User ${user.userId} is accessing user ${id}.`);
    return { message: `Bạn có quyền đọc thông tin người dùng ${id}`, data: { id, name: `User ${id}`, email: `user${id}@example.com` } };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(['admin', 'editor'], false) // Admin HOẶC Editor
  @Permissions([{ resource:'user',  action:'create' }])
  create(@Body() createUserDto: any, @CurrentUser() user: any) {
    console.log(`User ${user.userId} is creating a user.`, createUserDto);
    return { message: 'Bạn có quyền tạo người dùng mới', data: { id: 'new-user-id', ...createUserDto } };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(['admin']) // Chỉ Admin mới có thể cập nhật người dùng khác
  @Permissions([{ resource:'user', action: 'update' }])
  update(@Param('id') id: string, @Body() updateUserDto: any, @CurrentUser() user: any) {
    console.log(`User ${user.userId} is updating user ${id}.`, updateUserDto);
    return { message: `Bạn có quyền cập nhật người dùng ${id}`, data: { id, ...updateUserDto } };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(['admin']) // Chỉ Admin mới có thể xóa người dùng
  @Permissions([{ resource:'user',  action:'delete' }])
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    console.log(`User ${user.userId} is deleting user ${id}.`);
    return;
  }

  // --- Admin-facing endpoints for managing roles/permissions ---
  @Post('roles')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(['admin'])
  @Permissions([{ resource:'role',  action:'manage' }])
  async createRole(@Body() createRoleDto: any) {
    const result = await lastValueFrom(this.authGrpcService.createRole(createRoleDto));
    return { message: 'Tạo vai trò thành công', role: result.role };
  }

  @Get('roles')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(['admin', 'moderator'], false) // Admin hoặc Moderator có thể xem roles
  @Permissions([{ resource:'role',  action:'read' }]) 
  async getAllRoles() {
    const result = await lastValueFrom(this.authGrpcService.getAllRoles({}));
    return { message: 'Danh sách vai trò', roles: result.roles };
  }

  @Put('roles/:id/assign-user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(['admin'])
  @Permissions([{ resource:'user_role',  action:'assign' }]) // Giả định quyền quản lý gán vai trò
  async assignRoleToUser(
    @Param('id') roleId: string,
    @Param('userId') userId: string,
    @CurrentUser() adminUser: any,
  ) {
    const result = await lastValueFrom(this.authGrpcService.assignRoleToUser({
      userId,
      roleId,
      assignedBy: adminUser.userId,
      expiresAt: new Date().toISOString(),
    }));
    return { message: 'Gán vai trò cho người dùng thành công', userRoleId: result.userRoleId };
  }

  @Delete('roles/:id/remove-user/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(['admin'])
  @Permissions([{ resource:'user_role', action: 'remove' }])
  async removeRoleFromUser(
    @Param('id') roleId: string,
    @Param('userId') userId: string,
  ) {
    await lastValueFrom(this.authGrpcService.removeRoleFromUser({ userId, roleId }));
    return;
  }

  @Post('permissions')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(['admin'])
  @Permissions([{ resource:'permission', action: 'manage' }])
  async createPermission(@Body() createPermissionDto: any) {
    const result = await lastValueFrom(this.authGrpcService.createPermission(createPermissionDto));
    return { message: 'Tạo quyền thành công', permission: result.permission };
  }

  @Put('roles/:id/assign-permission/:permissionId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(['admin'])
  @Permissions([{ resource:'role_permission',  action:'assign' }])
  async assignPermissionToRole(
    @Param('id') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    const result = await lastValueFrom(this.authGrpcService.assignPermissionToRole({ roleId, permissionId }));
    return { message: 'Gán quyền cho vai trò thành công', rolePermissionId: result.rolePermissionId };
  }

  @Get('my-info')
  async getMyInfo(@CurrentUser() user: any) {
    const [permissionsResult, rolesResult] = await Promise.all([
      lastValueFrom(this.authGrpcService.getUserPermissions({ userId: user.userId })),
      lastValueFrom(this.authGrpcService.getUserRoles({ userId: user.userId })),
    ]);

    return {
      message: 'Thông tin quyền và vai trò của bạn',
      userId: user.userId,
      email: user.email,
      roles: rolesResult.roles,
      permissions: permissionsResult.permissions,
    };
  }
}
