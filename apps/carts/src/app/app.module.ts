import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CartGrpcService } from './cart/cart.grpc.service';
import { CartGrpcController } from './cart/cart.grpc.controller';
import { PrismaModule } from './cart/prisma/prisma.module';
import { PrismaService } from './cart/prisma/prisma.service';
import { CartService } from './cart/cart.service';

@Module({
  imports: [PrismaModule],
  controllers: [AppController, CartGrpcController],
  providers: [AppService, CartGrpcService,PrismaService,CartService],
})
export class AppModule {}
