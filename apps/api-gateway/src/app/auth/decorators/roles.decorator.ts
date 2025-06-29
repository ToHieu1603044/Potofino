// apps/api-gateway/src/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator để định nghĩa các vai trò cần thiết cho một route hoặc controller.
 * @param roleNames Mảng các tên vai trò.
 * @param requireAll Nếu là true, người dùng cần có TẤT CẢ các vai trò. Nếu là false (mặc định), người dùng cần có BẤT KỲ vai trò nào trong danh sách.
 */
export const Roles = (roleNames: string[], requireAll?: boolean) =>
  SetMetadata(ROLES_KEY, { roleNames, requireAll: requireAll ?? false });

