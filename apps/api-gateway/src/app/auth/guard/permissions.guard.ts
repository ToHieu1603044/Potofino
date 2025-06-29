// apps/api-gateway/src/guards/permissions.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGrpcService } from '../auth.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector, // Dùng để đọc metadata từ decorators
    private authGrpcService: AuthGrpcService, // Dịch vụ gRPC để tương tác với Auth Service
  ) {}

  /**
   * Phương thức `canActivate` kiểm tra quyền của người dùng.
   * @param context Ngữ cảnh thực thi hiện tại.
   * @returns Promise<boolean> cho biết người dùng có quyền truy cập hay không.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Lấy các quyền yêu cầu từ metadata của route handler hoặc controller
    // `getAllAndOverride` ưu tiên metadata từ handler trước, sau đó là controller.
    const requiredPermissions = this.reflector.getAllAndOverride<
      { resource: string; action: string }[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    // 2. Nếu không có quyền nào được yêu cầu trên route này, cho phép truy cập
    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId; // Lấy userId từ đối tượng `request.user` đã được JwtAuthGuard gán

    // 3. Kiểm tra xem có thông tin người dùng hay không
    if (!userId) {
      // Nếu không có userId, có nghĩa là JwtAuthGuard đã không chạy hoặc không thành công.
      // Tuy nhiên, nếu bạn dùng chung `@UseGuards(JwtAuthGuard, PermissionsGuard)`,
      // lỗi sẽ được JwtAuthGuard xử lý trước. Lỗi này chủ yếu cho các trường hợp không mong muốn.
      throw new ForbiddenException('User information is missing for permission check. Ensure JwtAuthGuard runs first.');
    }

    // 4. Duyệt qua từng quyền yêu cầu và gọi Auth Service để kiểm tra
    for (const perm of requiredPermissions) {
      try {
        const response = await lastValueFrom(
          this.authGrpcService.checkPermission({ // Gọi gRPC method để kiểm tra quyền
            userId,
            resource: perm.resource,
            action: perm.action,
          }),
        );

        // 5. Nếu người dùng không có quyền này, ném ngoại lệ ForbiddenException
        if (!response.hasPermission) {
          throw new ForbiddenException(`You do not have permission to ${perm.action} ${perm.resource}.`);
        }
      } catch (e) {
        // Log lỗi chi tiết hơn cho việc debug
        console.error(`PermissionsGuard: Error checking permission '${perm.resource}:${perm.action}' for user '${userId}':`, e.message);
        // Ném lại ngoại lệ ForbiddenException để được bắt bởi exception filter
        throw new ForbiddenException(`Access denied for resource '${perm.resource}' with action '${perm.action}'.`);
      }
    }

    // Nếu tất cả các quyền yêu cầu đều được kiểm tra thành công, cho phép request tiếp tục
    return true;
  }
}