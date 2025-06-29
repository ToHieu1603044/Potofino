// apps/api-gateway/src/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGrpcService } from '../auth.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authGrpcService: AuthGrpcService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<{ roleNames: string[]; requireAll: boolean }>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // Nếu không có vai trò yêu cầu, cho phép truy cập
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('Không có thông tin người dùng để kiểm tra vai trò.');
    }

    try {
      const response = await lastValueFrom(
        this.authGrpcService.checkRole({
          userId,
          roleNames: requiredRoles.roleNames,
          requireAll: requiredRoles.requireAll,
        }),
      );

      if (!response.hasRole) {
        throw new ForbiddenException('Bạn không có đủ vai trò để truy cập tài nguyên này.');
      }
      return true;
    } catch (e) {
      console.error('Error checking roles for user:', userId, e.message);
      throw new ForbiddenException(`Lỗi kiểm tra vai trò: ${e.message}`);
    }
  }
}