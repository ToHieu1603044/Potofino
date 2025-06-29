// apps/api-gateway/src/guards/jwt-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGrpcService } from '../auth.service';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private authGrpcService: AuthGrpcService) {}

  /**
   * Phương thức `canActivate` quyết định liệu request có được phép tiếp tục hay không.
   * @param context Ngữ cảnh thực thi hiện tại (chứa thông tin về request, response, v.v.).
   * @returns Promise<boolean> cho biết request có được phép hay không.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // 1. Kiểm tra sự tồn tại và định dạng của Authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header. Expected "Bearer <token>".');
    }

    // 2. Trích xuất Access Token
    const accessToken = authHeader.split(' ')[1];

    try {
      // 3. Gọi Auth Service qua gRPC để xác thực token
      const validationResponse = await lastValueFrom(
        this.authGrpcService.validateToken({ accessToken }),
      );

      // 4. Kiểm tra phản hồi từ Auth Service
      if (!validationResponse.isValid) {
        throw new UnauthorizedException('Invalid or expired token.');
      }

      // 5. Gán thông tin người dùng vào request để các handler tiếp theo có thể sử dụng
      // (userId và email được trả về từ Auth Service)
      request.user = {
        userId: validationResponse.userId,
        email: validationResponse.email,
        accessToken: accessToken, // Có thể giữ lại accessToken nếu cần
      };

      // Cho phép request tiếp tục
      return true;
    } catch (error) {
      // Xử lý các lỗi trong quá trình xác thực (ví dụ: token hết hạn, lỗi kết nối gRPC)
      // `UnauthorizedException` sẽ được bắt bởi exception filter và trả về mã lỗi 401
      console.error('JwtAuthGuard: Token validation failed.', error.message);
      throw new UnauthorizedException('Authentication failed. Please log in again.');
    }
  }
}