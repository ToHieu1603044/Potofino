import {
  Inject,
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import {
  AUTH_SERVICE_NAME,
  AuthServiceClient,
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  LogoutRequest,
} from '@auth-microservices/shared/types';

@Injectable()
export class AuthService implements OnModuleInit {
  private authClient: AuthServiceClient;

  constructor(@Inject('AUTH_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.authClient = this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  async register(dto: RegisterDto) {
    const request: RegisterRequest = {
      name: dto.name,
      email: dto.email,
      phone: dto.phone || '',
      password: dto.password,
    };

    try {
      return await lastValueFrom(this.authClient.register(request));
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Đăng ký thất bại');
    }
  }

  async login(dto: LoginDto) {
    const request: LoginRequest = {
      email: dto.email,
      password: dto.password,
    };

    try {
      return await lastValueFrom(this.authClient.login(request));
    } catch (error) {
      if (error.code === 16 || error.message?.includes('Invalid credentials')) {
        throw new UnauthorizedException('Sai email hoặc mật khẩu');
      }
      throw new InternalServerErrorException(error.message || 'Đăng nhập thất bại');
    }
  }

  async refreshToken(dto: RefreshTokenDto) {
    const request: RefreshTokenRequest = {
      refreshToken: dto.refreshToken,
    };

    try {
      return await lastValueFrom(this.authClient.refreshToken(request));
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Làm mới token thất bại');
    }
  }

  async logout(userId: string, refreshToken: string) {
    const request: LogoutRequest = { userId, refreshToken };

    try {
      return await lastValueFrom(this.authClient.logout(request));
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Đăng xuất thất bại');
    }
  }
}
