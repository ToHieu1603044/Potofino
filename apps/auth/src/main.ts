import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app/app.module';
import { RpcExceptionToRpcErrorFilter } from './app/auth/infrastructure/common/exceptions/rpc-exception.filter';

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

//  app.useGlobalFilters(new RpcExceptionToRpcErrorFilter())
  await app.listen();
  console.log('Auth Service is running on port 50054');
}
bootstrap();