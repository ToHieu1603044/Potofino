import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, GrpcMethod, KafkaContext, Payload } from '@nestjs/microservices';
import { InventoryService } from './inventory.service';
import { CheckStockRequest, CheckStockResponse, InventoryServiceController, InventoryServiceControllerMethods, ReserveStockResponse, ReserveStockRequest, SyncStockFromRedisRequest, SyncStockFromRedisResponse } from '@auth-microservices/shared/types'
import { ReserveStockDto } from './dto/reserve.stock.dto';
@InventoryServiceControllerMethods()
@Controller('inventory')
export class InventorySyncController implements InventoryServiceController {
  private readonly logger = new Logger(InventorySyncController.name);

  constructor(private readonly inventorySyncService: InventoryService) { }

  @EventPattern(['inventory.sync.trigger', 'order.created'])
  async handleInventorySync(@Payload() message: any, @Ctx() context: KafkaContext) {
    const topic = context.getTopic();

    let payload: any;
    try {
      payload =
        typeof message?.value === 'string'
          ? JSON.parse(message.value)
          : message?.value || message;
    } catch (err) {
      this.logger.error('Failed to parse sync message', err);
      return;
    }

    const { source, reason, skuCodes } = payload;

    this.logger.log(
      `Received sync from ${source} (${reason}) via topic: ${topic}, SKUs: ${skuCodes?.join(', ')}`,
    );

    if (!Array.isArray(skuCodes)) {
      this.logger.warn('Invalid skuCodes');
      return;
    }

    try {
      await this.inventorySyncService.syncSkusFromRedis(skuCodes);
    } catch (err) {
      this.logger.error('Sync error', err.stack);
    }
  }



  async checkStock(data: CheckStockRequest): Promise<CheckStockResponse> {
    return await this.inventorySyncService.checkStock(data.skuCodes);
  }
  async reserveStock(data: ReserveStockDto): Promise<ReserveStockResponse> {
    return this.inventorySyncService.reserveStock(data);
  }


  async syncStockFromRedis(data: SyncStockFromRedisRequest): Promise<SyncStockFromRedisResponse> {
    await this.inventorySyncService.syncSkusFromRedis(data.skuCodes);

    return {
      success: true,
      syncedSkuCodes: data.skuCodes,
    };
  }
}
