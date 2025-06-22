import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderController } from './order/order.controller';
import { OrderService } from './order/order.service';
import { OrderModule } from './order/order.module';
import { KafkaService } from './kafka/kafka.service';
import { PrismaService } from './prisma/prisma.service';
import { KafkaModule } from './kafka/kafka.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [OrderModule,KafkaModule,PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
