import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { PrismaService } from './shared/prisma/prisma.service';
import { KafkaService } from './shared/kafka/kafka.service';
import { KafkaModule } from './shared/kafka/kafka.module';
import { RedisModule } from './shared/redis/redis.module';
import { PrismaModule } from './shared/prisma/prisma.module';
import { CqrsModule } from '@nestjs/cqrs';
import { ProductGrpcService } from './grpc/product.grpc.service';
import { CreateProductHandler } from './command/handlers/create.product.handler';
import { ProductRepository } from './repositories/product.repository';
import { ProductGrpcController } from './grpc/product.grpc.controller';
import { GetProductAllHandler } from './queries/handlers/get.all.product.handler';
import { GetProductHandler } from './queries/handlers/get.product.handler';
import { ValidateSkuInputsHandler } from './queries/handlers/check.sku.input.handler';

@Module({
  imports: [CqrsModule, KafkaModule, RedisModule, PrismaModule],
  providers: [ProductService, PrismaService, KafkaService,ProductGrpcService,CreateProductHandler,GetProductAllHandler,ValidateSkuInputsHandler,
     {
      provide: ProductRepository,
      useClass: ProductRepository,
    },
  ],
  controllers: [ProductGrpcController]
})
export class ProductModule {}
