// main.ts trong UserService (tích hợp cả Kafka + gRPC nếu cần)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {

  const grpcApp = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'user',
      protoPath: join(__dirname, 'proto/user.proto'), 
      url: '0.0.0.0:50055',
    },
  });

  const kafkaApp = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'user-consumer',
      },
    },
  });

  await grpcApp.listen();
  await kafkaApp.listen();

  console.log('✅ UserService is listening on gRPC (50051) and Kafka');
}
bootstrap();
