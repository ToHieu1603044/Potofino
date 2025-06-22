import { Controller, Logger } from '@nestjs/common';
import { EventPattern, GrpcMethod, Payload } from '@nestjs/microservices';
import { InventoryService } from './inventory.service';
import { CheckStockRequest, CheckStockResponse, InventoryServiceController, InventoryServiceControllerMethods } from '@auth-microservices/shared/types'
@InventoryServiceControllerMethods()
@Controller('inventory')
export class InventorySyncController implements InventoryServiceController {
  private readonly logger = new Logger(InventorySyncController.name);

  constructor(private readonly inventorySyncService: InventoryService) { }

  @EventPattern('inventory.sync.trigger')
  async handleInventorySync(@Payload() message: any) {
    console.log(message);
    const { source, reason, skuCodes } = message?.value || message;

    this.logger.log(`Received sync trigger from ${source} (${reason}) with SKUs: ${skuCodes?.join(', ')}`);

    if (!skuCodes || !Array.isArray(skuCodes)) {
      this.logger.warn('Invalid or missing SKU codes in sync message');
      return;
    }

    try {
      await this.inventorySyncService.syncSkusFromRedis(skuCodes);

    } catch (error) {
      this.logger.error(`Error syncing SKUs: ${error.message}`, error.stack);
    }
  }

  async checkStock(data: CheckStockRequest): Promise<CheckStockResponse> {
    return await this.inventorySyncService.checkStock(data.skuCodes);

  }
}
