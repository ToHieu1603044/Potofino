// apps/auth-service/src/auth/auth.controller.ts
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import {
  RegisterRequest, LoginRequest, AuthResponse, RefreshTokenRequest, ValidateTokenRequest, ValidateTokenResponse, LogoutRequest, LogoutResponse,
  CheckPermissionRequest, CheckPermissionResponse, GetUserPermissionsRequest, GetUserPermissionsResponse,
  CheckRoleRequest, CheckRoleResponse, GetUserRolesRequest, GetUserRolesResponse,
  AssignRoleToUserRequest, AssignRoleToUserResponse, RemoveRoleFromUserRequest, RemoveRoleFromUserResponse,
  AssignPermissionToRoleRequest, AssignPermissionToRoleResponse, RemovePermissionFromRoleRequest, RemovePermissionFromRoleResponse,
  CreateRoleRequest, RoleResponse, UpdateRoleRequest, DeleteRoleRequest, DeleteRoleResponse, GetAllRolesResponse,
  CreatePermissionRequest, PermissionResponse, UpdatePermissionRequest, DeletePermissionRequest, DeletePermissionResponse, GetAllPermissionsResponse,
  AuthServiceController,
  AuthServiceControllerMethods,
} from '@auth-microservices/shared/types';

import { RegisterUserCommand } from './application/commands/impl/register-user.command';
import { LoginUserCommand } from './application/commands/impl/login-user.command';
import { RefreshAccessTokenCommand } from './application/commands/impl/refresh-access-token.command';
import { LogoutUserCommand } from './application/commands/impl/logout-user.command';
import { CheckPermissionQuery } from './application/queries/impl/check-permission.query';
import { GetUserPermissionsQuery } from './application/queries/impl/get-user-permissions.query';
import { CheckRoleQuery } from './application/queries/impl/check-role.query';
import { GetUserRolesQuery } from './application/queries/impl/get-user-roles.query';
import { AssignRoleToUserCommand } from './application/commands/impl/assign-role-to-user.command';
import { RemoveRoleFromUserCommand } from './application/commands/impl/remove-role-from-user.command';
import { AssignPermissionToRoleCommand } from './application/commands/impl/assign-permission-to-role.command';
import { RemovePermissionFromRoleCommand } from './application/commands/impl/remove-permission-from-role.command';
import { CreateRoleCommand } from './application/commands/impl/create-role.command';
import { UpdateRoleCommand } from './application/commands/impl/update-role.command';
import { DeleteRoleCommand } from './application/commands/impl/delete-role.command';
import { GetAllRolesQuery } from './application/queries/impl/get-all-roles.query';
import { CreatePermissionCommand } from './application/commands/impl/create-permission.command';
import { UpdatePermissionCommand } from './application/commands/impl/update-permission.command';
import { DeletePermissionCommand } from './application/commands/impl/delete-permission.command';
import { GetAllPermissionsQuery } from './application/queries/impl/get-all-permissions.query';
import { ValidateTokenQueryHandler } from './application/queries/handlers/validate-token.handler';
import { ValidateTokenQuery } from './application/queries/impl/validate-token.query';

@AuthServiceControllerMethods()
@Controller('auth')
export class AuthController implements AuthServiceController {
  constructor(private commandBus: CommandBus, private queryBus: QueryBus) {}

  @GrpcMethod('AuthService', 'Register')
  register(data: RegisterRequest): Promise<AuthResponse> {
    return this.commandBus.execute(new RegisterUserCommand(data.name, data.email, data.password, data.phone ?? null));
  }

  @GrpcMethod('AuthService', 'Login')
  login(data: LoginRequest): Promise<AuthResponse> {
    return this.commandBus.execute(new LoginUserCommand(data.email, data.password));
  }

  @GrpcMethod('AuthService', 'RefreshToken')
  refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
    return this.commandBus.execute(new RefreshAccessTokenCommand(data.refreshToken));
  }

  @GrpcMethod('AuthService', 'ValidateToken')
  validateToken(data: ValidateTokenRequest): Promise<ValidateTokenResponse> {
    return this.queryBus.execute(new ValidateTokenQuery(data.accessToken));
  }

  @GrpcMethod('AuthService', 'Logout')
  async logout(data: LogoutRequest): Promise<LogoutResponse> {
    const success = await this.commandBus.execute(new LogoutUserCommand(data.refreshToken));
    return { success };
  }

  @GrpcMethod('AuthService', 'CheckPermission')
  checkPermission(data: CheckPermissionRequest): Promise<CheckPermissionResponse> {
    return this.queryBus.execute(new CheckPermissionQuery(data.userId, data.resource, data.action));
  }

  @GrpcMethod('AuthService', 'GetUserPermissions')
  getUserPermissions(data: GetUserPermissionsRequest): Promise<GetUserPermissionsResponse> {
    return this.queryBus.execute(new GetUserPermissionsQuery(data.userId));
  }

  @GrpcMethod('AuthService', 'CheckRole')
  checkRole(data: CheckRoleRequest): Promise<CheckRoleResponse> {
    return this.queryBus.execute(new CheckRoleQuery(data.userId, data.roleNames, data.requireAll));
  }

  @GrpcMethod('AuthService', 'GetUserRoles')
  getUserRoles(data: GetUserRolesRequest): Promise<GetUserRolesResponse> {
    return this.queryBus.execute(new GetUserRolesQuery(data.userId));
  }

  @GrpcMethod('AuthService', 'AssignRoleToUser')
  assignRoleToUser(data: AssignRoleToUserRequest): Promise<AssignRoleToUserResponse> {
    return this.commandBus.execute(new AssignRoleToUserCommand(data.userId, data.roleId, data.assignedBy, data.expiresAt));
  }

  @GrpcMethod('AuthService', 'RemoveRoleFromUser')
  removeRoleFromUser(data: RemoveRoleFromUserRequest): Promise<RemoveRoleFromUserResponse> {
    return this.commandBus.execute(new RemoveRoleFromUserCommand(data.userId, data.roleId));
  }

  @GrpcMethod('AuthService', 'AssignPermissionToRole')
  assignPermissionToRole(data: AssignPermissionToRoleRequest): Promise<AssignPermissionToRoleResponse> {
    return this.commandBus.execute(new AssignPermissionToRoleCommand(data.roleId, data.permissionId));
  }

  @GrpcMethod('AuthService', 'RemovePermissionFromRole')
  removePermissionFromRole(data: RemovePermissionFromRoleRequest): Promise<RemovePermissionFromRoleResponse> {
    return this.commandBus.execute(new RemovePermissionFromRoleCommand(data.roleId, data.permissionId));
  }

  @GrpcMethod('AuthService', 'CreateRole')
  createRole(data: CreateRoleRequest): Promise<RoleResponse> {
    return this.commandBus.execute(new CreateRoleCommand(data.name, data.displayName, data.description, data.isActive, data.isSystem));
  }

  @GrpcMethod('AuthService', 'UpdateRole')
  updateRole(data: UpdateRoleRequest): Promise<RoleResponse> {
    return this.commandBus.execute(new UpdateRoleCommand(data.id, data.name, data.displayName, data.description, data.isActive));
  }

  @GrpcMethod('AuthService', 'DeleteRole')
  deleteRole(data: DeleteRoleRequest): Promise<DeleteRoleResponse> {
    return this.commandBus.execute(new DeleteRoleCommand(data.id));
  }

  @GrpcMethod('AuthService', 'GetAllRoles')
  getAllRoles(): Promise<GetAllRolesResponse> {
    return this.queryBus.execute(new GetAllRolesQuery());
  }

  @GrpcMethod('AuthService', 'CreatePermission')
  createPermission(data: CreatePermissionRequest): Promise<PermissionResponse> {
    return this.commandBus.execute(new CreatePermissionCommand(data.name, data.resource, data.action, data.displayName, data.description, data.isActive));
  }

  @GrpcMethod('AuthService', 'UpdatePermission')
  updatePermission(data: UpdatePermissionRequest): Promise<PermissionResponse> {
    return this.commandBus.execute(new UpdatePermissionCommand(data.id, data.name, data.resource, data.action, data.displayName, data.description, data.isActive));
  }

  @GrpcMethod('AuthService', 'DeletePermission')
  deletePermission(data: DeletePermissionRequest): Promise<DeletePermissionResponse> {
    return this.commandBus.execute(new DeletePermissionCommand(data.id));
  }

  @GrpcMethod('AuthService', 'GetAllPermissions')
  getAllPermissions(): Promise<GetAllPermissionsResponse> {
    return this.queryBus.execute(new GetAllPermissionsQuery());
  }
}
