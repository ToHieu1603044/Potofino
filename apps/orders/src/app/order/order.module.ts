// order.module.ts
import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { KafkaModule } from '../kafka/kafka.module'; 
import { PrismaService } from '../prisma/prisma.service';
import { join } from 'path';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { INVENTORY_PACKAGE_NAME, PRODUCT_PACKAGE_NAME } from '@auth-microservices/shared/types';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: PRODUCT_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: PRODUCT_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/product.proto'),
          url:'localhost:50051',
        },
      },
      {
        name: INVENTORY_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: INVENTORY_PACKAGE_NAME,
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
