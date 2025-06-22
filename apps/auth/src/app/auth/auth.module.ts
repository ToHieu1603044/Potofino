import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaService } from '../kafka/kafka.service';
import { join } from 'path';
import { KafkaModule } from '../kafka/kafka.module';
import { USER_PACKAGE_NAME } from '@auth-microservices/shared/types';
import { PrismaService } from '../prisma/prisma.service'; // 👈 Đảm bảo import PrismaService
import { UserController } from './users/user.controller';
import { UserService } from './users/user.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '1h' },
    }),
    ClientsModule.register([
      // {
      //   name: USER_PACKAGE_NAME,
      //   transport: Transport.GRPC,
      //   options: {
      //     package: 'user',
      //     protoPath: join(__dirname, 'proto/user.proto'),
      //     url: 'localhost:50055',
      //   },
      // },
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'auth-service',
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'auth-consumer-group',
          },
        },
      },
    ]),
    KafkaModule,
  ],
  controllers: [AuthController,UserController],
  providers: [AuthService, KafkaService, PrismaService,UserService],
  exports: [AuthService],
})
export class AuthModule {}
