import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './shared/prisma/prisma.service';
import { PrismaModule } from './shared/prisma/prisma.module';
import { KafkaModule } from './shared/kafka/kafka.module';
import { RedisModule } from './shared/redis/redis.module';
import { CqrsModule } from '@nestjs/cqrs';
import { ProductModule } from './product/product.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { GetProductHandler } from './product/queries/handlers/get.product.handler';
import { GetProductAllHandler } from './product/queries/handlers/get.all.product.handler';
import { CATEGORY_PACKAGE_NAME, PRODUCT_PACKAGE_NAME } from '@auth-microservices/shared/types';
import { BrandModule } from './brand/brand.module';

@Module({
  imports: [PrismaModule, KafkaModule, RedisModule,CqrsModule, ProductModule,BrandModule,
   ClientsModule.register([
      {
        name: PRODUCT_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.GRPC_PORT || 'localhost:50051', 
          package: [PRODUCT_PACKAGE_NAME,CATEGORY_PACKAGE_NAME],
          protoPath: [
            join(__dirname, 'proto/product.proto'),
            join(__dirname, 'proto/category.proto'),
          ],
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
  ],
})
export class AppModule {}
