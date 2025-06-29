import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';
import { CATEGORY_PACKAGE_NAME, PRODUCT_PACKAGE_NAME } from '@auth-microservices/shared/types';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [PRODUCT_PACKAGE_NAME, CATEGORY_PACKAGE_NAME],
      protoPath: [
        join(__dirname, 'proto/product.proto'),
        join(__dirname, 'proto/category.proto'),
      ],
      url: process.env.GRPC_PORT || 'localhost:50051',
    },
  });

  await app.startAllMicroservices();
  console.log('Microservice is listening');

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
