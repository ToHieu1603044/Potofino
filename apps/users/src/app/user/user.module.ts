import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaService } from '../kafka/kafka.service';
import { UserController } from './user.controller';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'user-kafka-client',
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'user-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, KafkaService],
})
export class UserModule {}