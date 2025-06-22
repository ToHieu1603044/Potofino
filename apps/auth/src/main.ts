import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app/app.module';

async function bootstrap() {
 const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    transport: Transport.GRPC,
    options: {
      package: ['auth', 'user'],
      protoPath: [
        join(__dirname, 'proto/auth.proto'),
        join(__dirname, 'proto/user.proto'),
      ],
      url: '0.0.0.0:50054',
    },
  },
);


  await app.listen();
  console.log('Auth Service is running on port 50054');
}
bootstrap();