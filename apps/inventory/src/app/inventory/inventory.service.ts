import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { CheckStockResponse, StockItem, ReserveStockResponse, ReserveStockItem } from '@auth-microservices/shared/types';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ReserveStockDto } from './dto/reserve.stock.dto';
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

  async reserveStock(data: ReserveStockDto): Promise<ReserveStockResponse> {
    console.log('reserveStockAtomic', data);
    const items = data.items;

    const keys = items.map(i => `sku_stock:${i.skuCode}`);
    const args = items.map(i => i.quantity.toString());

    const luaScript = `
      for i = 1, #KEYS do
      local stock = tonumber(redis.call("get", KEYS[i]))
      local qty = tonumber(ARGV[i])
      if not stock or stock < qty then
      return "Out of stock for SKU: " .. string.sub(KEYS[i], 11)
      end
      end
      for i = 1, #KEYS do
      redis.call("decrby", KEYS[i], ARGV[i])
      end
      return "OK"
      `;
    const result = await this.redis.eval(luaScript, {
      keys,
      arguments: args,
    });
    console.log('Lua result:', result);

    if (result !== 'OK') {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: result,
      });
    }

    return {
      success: true,
      reservedSkuCodes: items.map(i => i.skuCode),
    };
  }
}
