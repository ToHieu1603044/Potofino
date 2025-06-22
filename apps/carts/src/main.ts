import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';
import { cartPackage   } from '@auth-microservices/shared/types';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: cartPackage,
      protoPath: join(__dirname, 'proto/cart.proto'),
      url: process.env.GRPC_PORT || 'localhost:50052',
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT || 3000);
  console.log('✅ HTTP on 3001 + gRPC on 50052');
}
bootstrap();
