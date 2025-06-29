import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ValidateTokenQuery } from '../impl/validate-token.query';
import { ValidateTokenResponse } from '@auth-microservices/shared/types';
import { PrismaService } from '../../../../prisma/prisma.service'; 
import { JwtService } from '@nestjs/jwt';
@QueryHandler(ValidateTokenQuery)
export class ValidateTokenQueryHandler implements IQueryHandler<ValidateTokenQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(query: ValidateTokenQuery): Promise<ValidateTokenResponse> {
    try {
      const payload = this.jwtService.verify(query.accessToken);
      const user = await this.prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user || !user.isActive) {
        return { userId: null, email: null, isValid: false };
      }
      return { userId: payload.userId, email: payload.email, isValid: true };
    } catch (error) {
      return { userId: null, email: null, isValid: false };
    }
  }
}