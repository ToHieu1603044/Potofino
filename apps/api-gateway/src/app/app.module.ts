import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CartController } from './cart/cart.controller';
import { CartService } from './cart/cart.service';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ProductController } from './product/product.controller';
import { GrpcClientService } from './grpc/grpc-client.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { UserService } from './user/user.service';
import { CART_PACKAGE_NAME, ORDER_PACKAGE_NAME, PRODUCT_PACKAGE_NAME, USER_PACKAGE_NAME } from '@auth-microservices/shared/types';
import { UsersController } from './user/user.controller';
import { ProductService } from './product/product.service';
import { OrderController } from './order/order.controller';
import { OrderService } from './order/order.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    ClientsModule.register([
       {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'api-gateway',
            brokers: ['localhost:9092'],
          },
        },
      },
    ]),
    ClientsModule.register([
      {
        name: PRODUCT_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          url: 'localhost:50051',
          package: PRODUCT_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/product.proto'),
        },
      },
    ]),
    ClientsModule.register([
      {
        name: CART_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          url: 'localhost:50052',
          package: CART_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/cart.proto'),
        },
      },
    ]),
     ClientsModule.register([
      {
        name: 'AUTH_PACKAGE',
        transport: Transport.GRPC,
        options: {
          url: 'localhost:50054',
          package: 'auth',
          protoPath: join(__dirname, 'proto/auth.proto'),
        },
      },
      {
        name: USER_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          url: 'localhost:50054',
          package: 'user',
          protoPath: join(__dirname, 'proto/user.proto'),
        },
      }
    ]),
    ClientsModule.register([
      {
        name: ORDER_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          url: 'localhost:50060',
          package: 'order',
          protoPath: join(__dirname, 'proto/order.proto'),
        }
      }
    ])
  ],
  controllers: [AppController, CartController, ProductController,AuthController,UsersController,ProductController,OrderController],
  providers: [
    UserService,
    AppService,
    CartService,
    GrpcClientService, 
    AuthService,
    ProductService,
    OrderService
  ],
})
export class AppModule {}
