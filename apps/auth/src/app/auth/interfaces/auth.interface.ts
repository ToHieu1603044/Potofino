// interfaces/auth.interface.ts

export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string; // ISO string
  updated_at: string;
  roles: Role[];
  permissions: Permission[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// ============ AUTHENTICATION ============

export interface LoginRequest {
  email: string;
  password: string;
  metadata?: Record<string, string>;
}

export interface LoginResponse {
  status: CommonResponse;
  tokens: TokenPair;
  user: User;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  status: CommonResponse;
  tokens: TokenPair;
}

export interface ValidateTokenRequest {
  token: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  user_id: string;
  message: string;
  user: User;
}

export interface LogoutRequest {
  user_id: string;
  token: string;
}

export interface LogoutResponse {
  status: CommonResponse;
}

// ============ USER MANAGEMENT ============

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  role_ids: string[];
}

export interface CreateUserResponse {
  status: CommonResponse;
  user: User;
}

export interface GetUserRequest {
  user_id: string;
}

export interface GetUserResponse {
  status: CommonResponse;
  user: User;
}

export interface UpdateUserRequest {
  user_id: string;
  email?: string;
  username?: string;
  is_active?: boolean;
  updated_by?: string;
}

export interface UpdateUserResponse {
  status: CommonResponse;
  user: User;
}

export interface DeleteUserRequest {
  user_id: string;
}

export interface DeleteUserResponse {
  status: CommonResponse;
}

export interface ListUsersRequest {
  page?: number;
  limit?: number;
  keyword?: string;
}

export interface ListUsersResponse {
  status: CommonResponse;
  users: User[];
  total: number;
}

// ============ ROLE MANAGEMENT ============

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permission_ids: string[];
  created_by: string;
}

export interface CreateRoleResponse {
  status: CommonResponse;
  role: Role;
}

export interface GetRolesRequest {
  page?: number;
  limit?: number;
  keyword?: string;
  sort_by?: string;
  order?: string;
}

export interface GetRolesResponse {
  status: CommonResponse;
  roles: Role[];
  total: number;
}

export interface UpdateRoleRequest {
  role_id: string;
  name?: string;
  description?: string;
  is_active?: boolean;
  updated_by?: string;
}

export interface UpdateRoleResponse {
  status: CommonResponse;
  role: Role;
}

export interface DeleteRoleRequest {
  role_id: string;
}

export interface DeleteRoleResponse {
  status: CommonResponse;
}

// ============ PERMISSION MANAGEMENT ============

export interface GetPermissionsRequest {
  resource?: string;
}

export interface GetPermissionsResponse {
  status: CommonResponse;
  permissions: Permission[];
}

export interface AssignRoleRequest {
  user_id: string;
  role_id: string;
  assigned_by: string;
}

export interface AssignRoleResponse {
  status: CommonResponse;
}

export interface RemoveRoleRequest {
  user_id: string;
  role_id: string;
}

export interface RemoveRoleResponse {
  status: CommonResponse;
}

export interface AssignPermissionRequest {
  user_id: string;
  permission_id: string;
  assigned_by: string;
}

export interface AssignPermissionResponse {
  status: CommonResponse;
}

export interface RemovePermissionRequest {
  user_id: string;
  permission_id: string;
}

export interface RemovePermissionResponse {
  status: CommonResponse;
}

// ============ AUTHORIZATION ============

export interface CheckPermissionRequest {
  user_id: string;
  resource: string;
  action: string;
}

export interface CheckPermissionResponse {
  has_permission: boolean;
  message: string;
}

export interface GetUserPermissionsRequest {
  user_id: string;
}

export interface GetUserPermissionsResponse {
  status: CommonResponse;
  permissions: string[];
}

export interface GetUserRolesRequest {
  user_id: string;
}

export interface GetUserRolesResponse {
  status: CommonResponse;
  roles: Role[];
}

// ============ COMMON ============

export interface CommonResponse {
  success: boolean;
  message: string;
  error_code?: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}