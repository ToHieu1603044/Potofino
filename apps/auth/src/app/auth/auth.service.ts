// apps/auth-service/src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import {
  AuthResponse,
  ValidateTokenResponse,
  CheckPermissionResponse,
  GetUserPermissionsResponse,
  Permission,
  CheckRoleResponse,
  GetUserRolesResponse,
  Role,
  AssignRoleToUserResponse,
  RemoveRoleFromUserResponse,
  AssignPermissionToRoleResponse,
  RemovePermissionFromRoleResponse,
  RoleResponse,
  DeleteRoleResponse,
  GetAllRolesResponse,
  PermissionResponse,
  DeletePermissionResponse,
  GetAllPermissionsResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  DeleteRoleRequest,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  DeletePermissionRequest,
} from '@auth-microservices/shared/types';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  // --- Authentication Methods (Giữ nguyên hoặc cải tiến nhỏ) ---
  async register(data: any): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new ConflictException('Email đã tồn tại.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        isActive: true,
      },
    });

    // Gán vai trò "user" mặc định cho người dùng mới
    const defaultUserRole = await this.prisma.role.findUnique({ where: { name: 'user' } });
    if (defaultUserRole) {
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: defaultUserRole.id,
          assignedAt: new Date(),
          assignedBy: 'system',
        },
      });
    } else {
      console.warn('Vai trò "user" mặc định không tồn tại. Hãy đảm bảo chạy seed data!');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user.id);
    return { accessToken, refreshToken, userId: user.id };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Sai email hoặc mật khẩu.');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa.');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user.id);
    return { accessToken, refreshToken, userId: user.id };
  }

  async refreshToken(token: string): Promise<AuthResponse> {
    const existingToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!existingToken || new Date() > existingToken.expiresAt) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn.');
    }
    if (!existingToken.user.isActive) {
      throw new UnauthorizedException('Tài khoản liên kết với refresh token đã bị khóa.');
    }

    // Xóa token cũ để đảm bảo mỗi refresh token chỉ dùng được 1 lần
    await this.prisma.refreshToken.delete({ where: { id: existingToken.id } });

    const { accessToken, refreshToken } = await this.generateTokens(existingToken.userId);
    return { accessToken, refreshToken, userId: existingToken.userId };
  }

  async validateToken(accessToken: string): Promise<ValidateTokenResponse> {
    try {
      const payload = this.jwtService.verify(accessToken);
      const user = await this.prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user || !user.isActive) {
        return { userId: null, email: null, isValid: false };
      }
      return { userId: payload.userId, email: payload.email, isValid: true };
    } catch (error) {
      return { userId: null, email: null, isValid: false };
    }
  }

  async logout(refreshToken: string): Promise<boolean> {
    try {
      const deleted = await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
      return deleted.count > 0;
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      return false;
    }
  }

  private async generateTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Người dùng không hoạt động.');
    }

    const payload = { userId: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m' });
    const refreshToken = this.jwtService.sign(payload, { jwtid: uuidv4(), expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d' });

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + this.getExpirationMilliseconds(process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d')),
      },
    });

    return { accessToken, refreshToken };
  }

  private getExpirationMilliseconds(expiresIn: string): number {
    const value = parseInt(expiresIn.slice(0, -1));
    const unit = expiresIn.slice(-1);

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000; // Mặc định 7 ngày
    }
  }

  // --- Authorization Methods (Check Permissions & Roles) ---
  async checkPermission(userId: string, resource: string, action: string): Promise<CheckPermissionResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      return { hasPermission: false };
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        role: { isActive: true },
        OR: [ { expiresAt: null }, { expiresAt: { gt: new Date() } } ]
      },
      include: { role: true },
    });

    if (!userRoles.length) {
      return { hasPermission: false };
    }

    const roleIds = userRoles.map((ur) => ur.roleId);

    const hasPermission = await this.prisma.rolePermission.count({
      where: {
        roleId: { in: roleIds },
        permission: {
          resource,
          action,
          isActive: true,
        },
      },
    });

    return { hasPermission: hasPermission > 0 };
  }

  async getUserPermissions(userId: string): Promise<GetUserPermissionsResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      return { permissions: [] };
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        role: { isActive: true },
        OR: [ { expiresAt: null }, { expiresAt: { gt: new Date() } } ]
      },
      include: { role: true },
    });

    if (!userRoles.length) {
      return { permissions: [] };
    }

    const roleIds = userRoles.map((ur) => ur.roleId);

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        roleId: { in: roleIds },
        permission: {
          isActive: true,
        },
      },
      include: { permission: true },
      distinct: ['permissionId'],
    });

    const permissions: Permission[] = rolePermissions.map(rp => ({
      id: rp.permission.id,
      name: rp.permission.name,
      resource: rp.permission.resource,
      action: rp.permission.action,
      displayName: rp.permission.displayName,
      description: rp.permission.description || '',
      isActive: rp.permission.isActive,
    }));

    return { permissions };
  }

  async checkRole(userId: string, roleNames: string[], requireAll: boolean): Promise<CheckRoleResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      return { hasRole: false };
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        role: {
          name: { in: roleNames },
          isActive: true,
        },
        OR: [ { expiresAt: null }, { expiresAt: { gt: new Date() } } ]
      },
      select: { role: { select: { name: true } } },
    });

    const userRoleNames = userRoles.map(ur => ur.role.name);

    if (requireAll) {
      const hasAll = roleNames.every(roleName => userRoleNames.includes(roleName));
      return { hasRole: hasAll };
    } else {
      const hasAny = roleNames.some(roleName => userRoleNames.includes(roleName));
      return { hasRole: hasAny };
    }
  }

  async getUserRoles(userId: string): Promise<GetUserRolesResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      return { roles: [] };
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        role: { isActive: true },
        OR: [ { expiresAt: null }, { expiresAt: { gt: new Date() } } ]
      },
      include: { role: true },
    });

    const roles: Role[] = userRoles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      displayName: ur.role.displayName,
      description: ur.role.description || '',
      isActive: ur.role.isActive,
      isSystem: ur.role.isSystem,
    }));

    return { roles };
  }

  // --- Management Methods (for Admin APIs) ---

  // User-Role Management
  async assignRoleToUser(userId: string, roleId: string, assignedBy?: string, expiresAt?: string): Promise<AssignRoleToUserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại.');
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Vai trò không tồn tại.');

    const existingUserRole = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } }
    });
    if (existingUserRole) {
      throw new ConflictException('Người dùng đã có vai trò này.');
    }

    const newUserRole = await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    // Ghi audit log
    await this.logAudit(assignedBy, 'ASSIGN_ROLE', 'user_role', newUserRole.id, null, newUserRole);
    return { userRoleId: newUserRole.id };
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<RemoveRoleFromUserResponse> {
    const existingUserRole = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } }
    });
    if (!existingUserRole) {
      throw new NotFoundException('Người dùng không có vai trò này.');
    }
    await this.prisma.userRole.delete({
      where: { id: existingUserRole.id },
    });
    // Ghi audit log
    await this.logAudit(null, 'REMOVE_ROLE', 'user_role', existingUserRole.id, existingUserRole, null);
    return { success: true };
  }

  // Role-Permission Management
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<AssignPermissionToRoleResponse> {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Vai trò không tồn tại.');
    const permission = await this.prisma.permission.findUnique({ where: { id: permissionId } });
    if (!permission) throw new NotFoundException('Quyền không tồn tại.');

    const existingRolePermission = await this.prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } }
    });
    if (existingRolePermission) {
      throw new ConflictException('Vai trò đã có quyền này.');
    }

    const newRolePermission = await this.prisma.rolePermission.create({
      data: { roleId, permissionId },
    });
    // Ghi audit log
    await this.logAudit(null, 'ASSIGN_PERMISSION', 'role_permission', newRolePermission.id, null, newRolePermission);
    return { rolePermissionId: newRolePermission.id };
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<RemovePermissionFromRoleResponse> {
    const existingRolePermission = await this.prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } }
    });
    if (!existingRolePermission) {
      throw new NotFoundException('Vai trò không có quyền này.');
    }
    await this.prisma.rolePermission.delete({
      where: { id: existingRolePermission.id },
    });
    // Ghi audit log
    await this.logAudit(null, 'REMOVE_PERMISSION', 'role_permission', existingRolePermission.id, existingRolePermission, null);
    return { success: true };
  }

  // Role CRUD
  async createRole(data: CreateRoleRequest): Promise<RoleResponse> {
    const existingRole = await this.prisma.role.findUnique({ where: { name: data.name } });
    if (existingRole) {
      throw new ConflictException('Tên vai trò đã tồn tại.');
    }
    const role = await this.prisma.role.create({ data });
    await this.logAudit(null, 'CREATE', 'role', role.id, null, role);
    return { role: {
      id: role.id, name: role.name, displayName: role.displayName,
      description: role.description || '', isActive: role.isActive, isSystem: role.isSystem
    }};
  }

  async updateRole(data: UpdateRoleRequest): Promise<RoleResponse> {
    const role = await this.prisma.role.findUnique({ where: { id: data.id } });
    if (!role) throw new NotFoundException('Vai trò không tồn tại.');

    if (data.name && data.name !== role.name) {
      const existing = await this.prisma.role.findUnique({ where: { name: data.name } });
      if (existing) throw new ConflictException('Tên vai trò mới đã tồn tại.');
    }

    const updatedRole = await this.prisma.role.update({
      where: { id: data.id },
      data: {
        name: data.name || role.name,
        displayName: data.displayName || role.displayName,
        description: data.description || role.description,
        isActive: data.isActive ?? role.isActive, // Use ?? for boolean updates
      },
    });
    await this.logAudit(null, 'UPDATE', 'role', updatedRole.id, role, updatedRole);
    return { role: {
      id: updatedRole.id, name: updatedRole.name, displayName: updatedRole.displayName,
      description: updatedRole.description || '', isActive: updatedRole.isActive, isSystem: updatedRole.isSystem
    }};
  }

  async deleteRole(data: DeleteRoleRequest): Promise<DeleteRoleResponse> {
    const role = await this.prisma.role.findUnique({ where: { id: data.id } });
    if (!role) throw new NotFoundException('Vai trò không tồn tại.');
    if (role.isSystem) throw new BadRequestException('Không thể xóa vai trò hệ thống.');

    const userRolesCount = await this.prisma.userRole.count({ where: { roleId: data.id } });
    if (userRolesCount > 0) {
      throw new BadRequestException('Không thể xóa vai trò đang được gán cho người dùng.');
    }

    const rolePermissionsCount = await this.prisma.rolePermission.count({ where: { roleId: data.id } });
    if (rolePermissionsCount > 0) {
      throw new BadRequestException('Không thể xóa vai trò đang có quyền được gán.');
    }

    await this.prisma.role.delete({ where: { id: data.id } });
    await this.logAudit(null, 'DELETE', 'role', role.id, role, null);
    return { success: true };
  }

  async getAllRoles(): Promise<GetAllRolesResponse> {
    const roles = await this.prisma.role.findMany();
    return { roles: roles.map(role => ({
      id: role.id, name: role.name, displayName: role.displayName,
      description: role.description || '', isActive: role.isActive, isSystem: role.isSystem
    }))};
  }

  // Permission CRUD
  async createPermission(data: CreatePermissionRequest): Promise<PermissionResponse> {
    const existingPermission = await this.prisma.permission.findUnique({
      where: { name: data.name },
    });
    if (existingPermission) {
      throw new ConflictException('Tên quyền đã tồn tại.');
    }
    const permission = await this.prisma.permission.create({ data });
    await this.logAudit(null, 'CREATE', 'permission', permission.id, null, permission);
    return { permission: {
      id: permission.id, name: permission.name, resource: permission.resource, action: permission.action,
      displayName: permission.displayName, description: permission.description || '', isActive: permission.isActive
    }};
  }

  async updatePermission(data: UpdatePermissionRequest): Promise<PermissionResponse> {
    const permission = await this.prisma.permission.findUnique({ where: { id: data.id } });
    if (!permission) throw new NotFoundException('Quyền không tồn tại.');

    if ((data.resource && data.action) && (data.resource !== permission.resource || data.action !== permission.action)) {
      const existing = await this.prisma.permission.findUnique({
        where: { resource_action: { resource: data.resource || permission.resource, action: data.action || permission.action } }
      });
      if (existing && existing.id !== permission.id) throw new ConflictException('Cặp resource-action mới đã tồn tại.');
    }

    const updatedPermission = await this.prisma.permission.update({
      where: { id: data.id },
      data: {
        name: data.name || permission.name,
        resource: data.resource || permission.resource,
        action: data.action || permission.action,
        displayName: data.displayName || permission.displayName,
        description: data.description || permission.description,
        isActive: data.isActive ?? permission.isActive,
      },
    });
    await this.logAudit(null, 'UPDATE', 'permission', updatedPermission.id, permission, updatedPermission);
    return { permission: {
      id: updatedPermission.id, name: updatedPermission.name, resource: updatedPermission.resource, action: updatedPermission.action,
      displayName: updatedPermission.displayName, description: updatedPermission.description || '', isActive: updatedPermission.isActive
    }};
  }

  async deletePermission(data: DeletePermissionRequest): Promise<DeletePermissionResponse> {
    const permission = await this.prisma.permission.findUnique({ where: { id: data.id } });
    if (!permission) throw new NotFoundException('Quyền không tồn tại.');

    const rolePermissionsCount = await this.prisma.rolePermission.count({ where: { permissionId: data.id } });
    if (rolePermissionsCount > 0) {
      throw new BadRequestException('Không thể xóa quyền đang được gán cho vai trò.');
    }

    await this.prisma.permission.delete({ where: { id: data.id } });
    await this.logAudit(null, 'DELETE', 'permission', permission.id, permission, null);
    return { success: true };
  }

  async getAllPermissions(): Promise<GetAllPermissionsResponse> {
    const permissions = await this.prisma.permission.findMany();
    return { permissions: permissions.map(perm => ({
      id: perm.id, name: perm.name, resource: perm.resource, action: perm.action,
      displayName: perm.displayName, description: perm.description || '', isActive: perm.isActive
    }))};
  }

  // --- Audit Logging Helper ---
  private async logAudit(
    userId: string | null = null,
    action: string,
    resource: string,
    resourceId: string | null = null,
    oldValues: any | null = null,
    newValues: any | null = null,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          resource,
          resourceId,
          oldValues: oldValues ? JSON.stringify(oldValues) : null,
          newValues: newValues ? JSON.stringify(newValues) : null,
          // Có thể thêm ipAddress và userAgent nếu có thông tin từ context
        },
      });
    } catch (error) {
      console.error('Lỗi khi ghi audit log:', error);
      // Không ném lỗi ra ngoài để không ảnh hưởng đến luồng chính
    }
  }
}