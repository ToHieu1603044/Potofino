// order.module.ts
import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { KafkaModule } from '../kafka/kafka.module'; 
import { PrismaService } from '../prisma/prisma.service';
import { join } from 'path';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'product',
        transport: Transport.GRPC,
        options: {
          package: 'product',
          protoPath: join(__dirname, 'proto/product.proto'),
          url:'localhost:50051',
        },
      },
      {
        name: 'inventory',
        transport: Transport.GRPC,
        options: {
          package: 'inventory',
          protoPath: join(__dirname, 'proto/inventory.proto'),
          url:'localhost:50071',
        },
      },
    ]),
    KafkaModule
  ],
  providers: [OrderService, PrismaService],
  controllers: [OrderController],
})
export class OrderModule {}
