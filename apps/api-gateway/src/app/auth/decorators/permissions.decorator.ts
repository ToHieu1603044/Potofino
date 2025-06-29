// apps/api-gateway/src/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

// Khóa dùng để lưu trữ và truy xuất metadata của quyền
export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator để định nghĩa các quyền cần thiết cho một route hoặc controller.
 *
 * @param permissions Một mảng các đối tượng quyền, mỗi đối tượng chứa `resource` và `action`.
 * Ví dụ: `Permissions([{ resource: 'user', action: 'read' }, { resource: 'post', action: 'create' }])`
 */
export function Permissions(permissions: { resource: string; action: string }[]) {
  return SetMetadata(PERMISSIONS_KEY, permissions);
}
