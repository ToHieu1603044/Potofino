import { Controller } from '@nestjs/common';
import {
  AuthServiceController,
  AuthServiceControllerMethods,
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  LogoutRequest,
  ValidateTokenRequest,
  AuthResponse,
  LogoutResponse,
  ValidateTokenResponse,
} from '@auth-microservices/shared/types';
import { AuthService } from './auth.service';

@Controller()
@AuthServiceControllerMethods()
export class AuthController implements AuthServiceController {
  constructor(private readonly authService: AuthService) {}

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.authService.register(data);
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.authService.login(data);
  }

  async logout(data: LogoutRequest): Promise<LogoutResponse> {
    return this.authService.logout(data.userId);
  }

  async refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
    return this.authService.refreshToken(data.refreshToken);
  }

  async validateToken(data: ValidateTokenRequest): Promise<ValidateTokenResponse> {
    return this.authService.validateToken(data.token);
  }
}
