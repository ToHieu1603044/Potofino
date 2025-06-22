import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(userData: any) {
    const { name, email, phone, password } = userData;
    console.log('✅ Creating user...');
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      throw new ConflictException('User đã tồn tại');
    }

    const user = await this.prisma.user.create({
      data: { name, email, phone, password },
    });

    return user;
  }
 async findUserByEmail(data: { email: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return {};
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: user.password,
    };
  }
}
