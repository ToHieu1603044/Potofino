
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaService } from '../prisma/prisma.service';
import { KafkaService } from '../kafka/kafka.service';
import { AuthController } from './auth.controller';
import { TokenDomainService } from './domain/services/token.domain-service';
import { UserPrismaRepository } from './infrastructure/persistence/repositories/user.prisma.repository';
import { RolePrismaRepository } from './infrastructure/persistence/repositories/role.prisma.repository';
import { PermissionPrismaRepository } from './infrastructure/persistence/repositories/permission.prisma.repository';
import { RegisterUserHandler } from './application/commands/handlers/register-user.handler';
import { LoginUserHandler } from './application/commands/handlers/login-user.handler';
import { RefreshAccessTokenHandler } from './application/commands/handlers/refresh-access-token.handler';
import { LogoutUserHandler } from './application/commands/handlers/logout-user.handler';
import { AssignRoleToUserHandler } from './application/commands/handlers/assign-role-to-user.handler';
import { RemoveRoleFromUserHandler } from './application/commands/handlers/remove-role-from-user.handler';
import { CreateRoleHandler } from './application/commands/handlers/create-role.handler';
import { UpdateRoleHandler } from './application/commands/handlers/update-role.handler';
import { DeleteRoleHandler } from './application/commands/handlers/delete-role.handler';
import { CreatePermissionHandler } from './application/commands/handlers/create-permission.handler';
import { UpdatePermissionHandler } from './application/commands/handlers/update-permission.handler';
import { DeletePermissionHandler } from './application/commands/handlers/delete-permission.handler';
import { AssignPermissionToRoleHandler } from './application/commands/handlers/assign-permission-to-role.handler';
import { RemovePermissionFromRoleHandler } from './application/commands/handlers/remove-permission-from-role.handler';
import { GetUserPermissionsHandler } from './application/queries/handlers/get-user-permissions.handler';
import { ValidateTokenQueryHandler } from './application/queries/handlers/validate-token.handler';
import { CheckPermissionHandler } from './application/queries/handlers/check-permission.handler';
import { CheckRoleHandler } from './application/queries/handlers/check-role.handler';
import { GetUserRolesHandler } from './application/queries/handlers/get-user-roles.handler';
import { GetAllRolesHandler } from './application/queries/handlers/get-all-roles.handler';
import { GetAllPermissionsHandler } from './application/queries/handlers/get-all-permissions.handler';
import { AuditLogEventHandler } from './application/event-handlers/audit-log.event-handler';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Client, ClientsModule, Transport } from '@nestjs/microservices';

const CommandHandlers = [
  RegisterUserHandler,
  LoginUserHandler,
  RefreshAccessTokenHandler,
  LogoutUserHandler,
  AssignRoleToUserHandler,
  RemoveRoleFromUserHandler,
  CreateRoleHandler,
  UpdateRoleHandler,
  DeleteRoleHandler,
  CreatePermissionHandler,
  UpdatePermissionHandler,
  DeletePermissionHandler,
  AssignPermissionToRoleHandler,
  RemovePermissionFromRoleHandler,
];

const QueryHandlers = [
  GetUserPermissionsHandler,
  ValidateTokenQueryHandler,
  CheckPermissionHandler,
  CheckRoleHandler,
  GetUserRolesHandler,
  GetAllRolesHandler,
  GetAllPermissionsHandler,
];

@Module({
  imports: [
    CqrsModule,
    ClientsModule.register([
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
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    KafkaService,
    TokenDomainService,
    { provide: 'IUserRepository', useClass: UserPrismaRepository },
    { provide: 'IRoleRepository', useClass: RolePrismaRepository },
    { provide: 'IPermissionRepository', useClass: PermissionPrismaRepository },
    ...CommandHandlers,
    ...QueryHandlers,
    AuditLogEventHandler,
  ],
})
export class AuthModule {}
