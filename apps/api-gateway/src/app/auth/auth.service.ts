import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, ClientGrpc, Transport } from '@nestjs/microservices';
import { join } from 'path';
import {
  AuthServiceClient, AUTH_SERVICE_NAME,
  RegisterRequest, LoginRequest, RefreshTokenRequest, ValidateTokenRequest, LogoutRequest,
  CheckPermissionRequest, GetUserPermissionsRequest, CheckRoleRequest, GetUserRolesRequest,
  AssignRoleToUserRequest, RemoveRoleFromUserRequest,
  AssignPermissionToRoleRequest, RemovePermissionFromRoleRequest,
  CreateRoleRequest, UpdateRoleRequest, DeleteRoleRequest, GetAllRolesRequest,
  CreatePermissionRequest, UpdatePermissionRequest, DeletePermissionRequest, GetAllPermissionsRequest,
} from '@auth-microservices/shared/types';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGrpcService implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'auth',
      protoPath: join(__dirname, 'proto/auth.proto'),
      url: process.env.AUTH_SERVICE_GRPC_URL || 'localhost:50054',
    },
  })
  private client: ClientGrpc;

  private authService: AuthServiceClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  // --- Authentication Calls ---
  register(data: RegisterRequest) { return this.authService.register(data); }
  login(data: LoginRequest) { return this.authService.login(data); }
  refreshToken(data: RefreshTokenRequest) { return this.authService.refreshToken(data); }
  validateToken(data: ValidateTokenRequest): Observable<any> { return this.authService.validateToken(data); }
  logout(data: LogoutRequest) { return this.authService.logout(data); }

  // --- Authorization Calls (AuthZ) ---
  checkPermission(data: CheckPermissionRequest): Observable<any> { return this.authService.checkPermission(data); }
  getUserPermissions(data: GetUserPermissionsRequest): Observable<any> { return this.authService.getUserPermissions(data); }
  checkRole(data: CheckRoleRequest): Observable<any> { return this.authService.checkRole(data); }
  getUserRoles(data: GetUserRolesRequest): Observable<any> { return this.authService.getUserRoles(data); }

  // --- Management Calls (Admin-facing APIs for AuthZ) ---

  // User-Role Management
  assignRoleToUser(data: AssignRoleToUserRequest) { return this.authService.assignRoleToUser(data); }
  removeRoleFromUser(data: RemoveRoleFromUserRequest) { return this.authService.removeRoleFromUser(data); }

  // Role-Permission Management
  assignPermissionToRole(data: AssignPermissionToRoleRequest) { return this.authService.assignPermissionToRole(data); }
  removePermissionFromRole(data: RemovePermissionFromRoleRequest) { return this.authService.removePermissionFromRole(data); }

  // Role CRUD
  createRole(data: CreateRoleRequest) { return this.authService.createRole(data); }
  updateRole(data: UpdateRoleRequest) { return this.authService.updateRole(data); }
  deleteRole(data: DeleteRoleRequest) { return this.authService.deleteRole(data); }
  getAllRoles(data: GetAllRolesRequest) { return this.authService.getAllRoles(data); }

  // Permission CRUD
  createPermission(data: CreatePermissionRequest) { return this.authService.createPermission(data); }
  updatePermission(data: UpdatePermissionRequest) { return this.authService.updatePermission(data); }
  deletePermission(data: DeletePermissionRequest) { return this.authService.deletePermission(data); }
  getAllPermissions(data: GetAllPermissionsRequest) { return this.authService.getAllPermissions(data); }
}