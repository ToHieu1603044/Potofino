import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { GrpcAuthGuard } from './dto/guard/grpc-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Post('logout')
  @UseGuards(GrpcAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req, @Body() body: { refreshToken: string }) {
    return this.authService.logout(req.user.id, body.refreshToken);
  }

  @Post('profile')
  @UseGuards(GrpcAuthGuard)
  getProfile(@Request() req) {
    return {
      success: true,
      message: 'This is a protected route',
      user: req.user,
    };
  }
}
