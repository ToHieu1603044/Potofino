import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { CheckStockResponse, StockItem } from '@auth-microservices/shared/types';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) { }

  async syncSkusFromRedis(skuCodes: string[]) {
    if (!Array.isArray(skuCodes) || skuCodes.length === 0) {
      this.logger.warn('No SKU codes provided for sync');
      return;
    }

    for (const skuCode of skuCodes) {
      const redisStockKey = `sku_stock:${skuCode}`;
      const redisSkuIdKey = `sku_id:${skuCode}`;

      const [stockStr, skuId] = await Promise.all([
        this.redis.get(redisStockKey),
        this.redis.get(redisSkuIdKey),
      ]);

      if (stockStr === null || skuId === null) {
        this.logger.warn(`Missing Redis data for SKU: ${skuCode}`);
        continue;
      }

      const stock = parseInt(stockStr, 10);
      if (isNaN(stock)) {
        this.logger.error(`Invalid stock value for ${skuCode}: ${stockStr}`);
        continue;
      }

      await this.prisma.inventoryStock.upsert({
        where: { skuCode },
        create: { skuId, skuCode, stock },
        update: { stock },
      });

      this.logger.debug(`Synced SKU ${skuCode} with stock ${stock}`);
    }

    this.logger.log(`Inventory sync completed for ${skuCodes.length} SKUs`);
  }
  async checkStock(skuCodes: string[]): Promise<CheckStockResponse> {
    this.logger.log('checkStock', skuCodes);
    if (!Array.isArray(skuCodes) || skuCodes.length === 0) {
      this.logger.warn('No SKU codes provided for check stock');
      return { items: [] };
    }

    const uniqueSkuCodes = [...new Set(skuCodes)];
    const redisKeys = uniqueSkuCodes.map((code) => `sku_stock:${code}`);
    const stockStrs = await this.redis.mget(redisKeys);

    const results: StockItem[] = [];
    const fallbackSkuCodes: string[] = [];

    uniqueSkuCodes.forEach((skuCode, index) => {
      const stockStr = stockStrs[index];
      if (stockStr === null || isNaN(parseInt(stockStr, 10))) {
        this.logger.warn(`Fallback to DB for SKU: ${skuCode}`);
        fallbackSkuCodes.push(skuCode);
      } else {
        results.push({
          skuCode,
          stock: parseInt(stockStr, 10),
        });
      }
    });

    if (fallbackSkuCodes.length > 0) {
      const dbStocks = await this.prisma.stockLog.findMany({
        where: {
          skuCode: { in: fallbackSkuCodes },
        },
        select: {
          skuCode: true,
          stock: true,
        },
      });

      this.logger.log('DB Fallback Results:', dbStocks);

      await Promise.all(
        dbStocks.map((sku) =>
          this.redis.set(`sku_stock:${sku.skuCode}`, sku.stock.toString())
        )
      );

      results.push(...dbStocks.map((sku) => ({
        skuCode: sku.skuCode,
        stock: sku.stock,
      })));
    }

    this.logger.log('Final checkStock result:', results);
    return { items: results };
  }

}
