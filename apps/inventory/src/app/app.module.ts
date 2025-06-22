import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { KafkaModule } from './kafka/kafka.module';
import { RedisModule } from './redis/redis.module';
import { InventorySyncController } from './inventory/inventory.controller';
import { InventoryService } from './inventory/inventory.service';

@Module({
  imports: [RedisModule, PrismaModule, KafkaModule],
  controllers: [AppController,InventorySyncController],
  providers: [AppService,InventoryService],
})
export class AppModule {}
