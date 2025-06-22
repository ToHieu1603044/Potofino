import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'order',
      protoPath: join(__dirname, 'proto/order.proto'),
      url: process.env.GRPC_PORT || 'localhost:50060',
    },
  });

  await app.listen();
  Logger.log(`🚀 Order microservice (gRPC) is running on ${process.env.GRPC_PORT || 'localhost:50060'}`);
}

bootstrap();
