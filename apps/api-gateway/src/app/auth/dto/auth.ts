export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
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

export interface LoginDto {
  email: string;
  password: string;
  metadata?: Record<string, string>;
}

export interface CreateUserDto {
  email: string;
  username: string;
  password: string;
  role_ids?: string[];
}

export interface UpdateUserDto {
  email?: string;
  username?: string;
  is_active?: boolean;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permission_ids?: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}