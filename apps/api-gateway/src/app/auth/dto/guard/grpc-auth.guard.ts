import {
  AUTH_SERVICE_NAME,
  AuthServiceClient,
  ValidateTokenResponse,
} from '@auth-microservices/shared/types';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable()
export class GrpcAuthGuard implements CanActivate, OnModuleInit {
  private authService: AuthServiceClient;

  constructor(@Inject('AUTH_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Không tìm thấy token trong header');
    }

    if (!this.authService) {
      throw new UnauthorizedException('Auth service chưa được khởi tạo');
    }

    try {
      const result = await firstValueFrom(
        this.authService.validateToken({ token }) as unknown as Observable<ValidateTokenResponse>,
      );

      console.log('[GrpcAuthGuard] gRPC validateToken response:', JSON.stringify(result, null, 2));

      if (!result?.valid) {
        throw new UnauthorizedException('Token không hợp lệ');
      }

      // Gán thông tin người dùng vào request để controller dùng được
      request.user = {
        userId: result.userId,
        email: result.email,
        // Có thể mở rộng thêm các field khác nếu cần
      };
      console.log('[GrpcAuthGuard] User assigned to request:', request.user);

      return true;
    } catch (error) {
      console.error('[GrpcAuthGuard] Lỗi xác thực gRPC:', JSON.stringify(error, null, 2));

      if (error?.details?.includes('EXPIRED')) {
        throw new UnauthorizedException('Token đã hết hạn');
      }

      if (error?.code === 14) {
        throw new UnauthorizedException('Không thể kết nối đến dịch vụ xác thực');
      }

      throw new UnauthorizedException(error?.message || 'Xác thực token thất bại');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers?.authorization;
    if (!authHeader || typeof authHeader !== 'string') return undefined;

    const [type, token] = authHeader.split(' ');
    console.log('[GrpcAuthGuard] Header type:', type, 'Token present:', !!token);

    return type === 'Bearer' ? token : undefined;
  }
}
