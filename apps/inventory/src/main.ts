import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  // Tạo app HTTP (bạn có thể bỏ nếu không cần)
  const app = await NestFactory.create(AppModule);

  // Kết nối gRPC
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'inventory',
      protoPath: join(__dirname, 'proto/inventory.proto'),
      url: 'localhost:50071',
    },
  });

  // Kết nối Kafka
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'inventory-service',
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'inventory-consumer-group',
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3009);
  Logger.log(`🚀 Inventory service is running with gRPC + Kafka`);
}

bootstrap();
