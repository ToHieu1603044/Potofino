import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateProductCommand } from '../create.produt.command';
import { ProductRepository } from '../../repositories/product.repository';
import { RedisService } from '../../shared/redis/redis.service';
import { KafkaService } from '../../shared/kafka/kafka.service';
import { ProductEntity } from '../../entities/product.entiti';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler
  implements ICommandHandler<CreateProductCommand> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly redis: RedisService,
    private readonly kafka: KafkaService,
  ) { }

  async execute(command: CreateProductCommand) {
    const { dto } = command;

    const productEntity = new ProductEntity();
    productEntity.name = dto.name;
    productEntity.description = dto.description;
    productEntity.brandId = dto.brandId;
    productEntity.categoryId = dto.categoryId;
    productEntity.skus = dto.skus.map((sku) => ({
      skuCode: sku.skuCode,
      price: sku.price,
      stock: sku.stock,
      attributes: sku.attributes.map((attr) => ({
        attributeOptionId: attr.attributeOptionId,
      })),
    }));

    try {
      const createdProduct = await this.productRepository.createProductWithSkus(productEntity);

      const redisPromises = createdProduct.skus.map((sku) => [
        this.redis.set(`sku_stock:${sku.skuCode}`, sku.stock),
        this.redis.set(`sku_id:${sku.skuCode}`, sku.id),
      ]);
      await Promise.all(redisPromises.flat());

      await this.kafka.emit('inventory.sync.trigger', {
        source: 'product-service',
        reason: 'product_created',
        skuCodes: dto.skus.map((sku) => sku.skuCode),
      });

      return createdProduct;
    } catch (err) {

      console.error('CreateProductHandler failed:', err);
      throw new Error('Failed to create product');
    }
  }

}
