import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

import { ProductEntity } from '../entities/product.entiti';
import { Prisma, Product, Sku, SkuAttributeOption } from '@prisma/client';
import { GetAllProductsResponse, GetProductResponse } from '@auth-microservices/shared/types';
import { paginate, PAGINATION } from 'libs/utils/pagination';
import { RedisService } from '../../shared/redis/redis.service';
import { ValidateSkuInputsDto } from '../dto/validate.sku.dto';

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService,

    private readonly redis: RedisService
  ) { }

async createProductWithSkus(
  product: ProductEntity,
): Promise<Product & { skus: (Sku & { skuOptions: SkuAttributeOption[] })[] }> {
  try {
    return await this.prisma.$transaction(async (tx) => {
      const createdProduct = await tx.product.create({
        data: {
          name: product.name,
          description: product.description,
          brandId: product.brandId,
          categoryId: product.categoryId,
          skus: {
            create: product.skus.map((sku) => ({
              skuCode: sku.skuCode,
              price: new Prisma.Decimal(sku.price),
              stock: sku.stock,
              skuOptions: {
                create: sku.attributes.map((attr) => ({
                  attributeOptionId: attr.attributeOptionId,
                })),
              },
            })),
          },
        },
        include: {
          skus: {
            include: {
              skuOptions: true,
            },
          },
        },
      });

      return createdProduct;
    });
  } catch (error) {
    console.error('Error creating product with SKUs:', error);
    throw new Error('Failed to create product with SKUs');
  }
}

  async findAll(
    where?: any,
    orderBy?: any,
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
  ): Promise<GetAllProductsResponse> {
    const cacheKey = `products:all:${JSON.stringify({ where, orderBy, page, limit })}`;

    return this.redis.getOrSet<GetAllProductsResponse>(cacheKey, async () => {
      const { skip, take, page: currentPage, limit: currentLimit } = paginate({ page, limit });

      const [products, total] = await this.prisma.$transaction([
        this.prisma.product.findMany({
          where,
          include: {
            skus: {
              include: {
                skuOptions: {
                  include: {
                    attributeOption: {
                      select: {
                        id: true,
                        value: true,
                        attribute: {
                          select: {
                            id: true,
                            name: true,
                            description: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy,
          skip,
          take,
        }),
        this.prisma.product.count({ where }),
      ]);

      return {
        products: products.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description ?? '',
          brandId: product.brandId ?? '',
          categoryId: product.categoryId ?? '',
          skus: product.skus.map((sku) => ({
            id: sku.id,
            skuCode: sku.skuCode,
            price: parseFloat(sku.price.toString()),
            stock: sku.stock,
            skuOptions: sku.skuOptions.map((skuOption) => ({
              attributeOptionId: skuOption.attributeOption.id,
              attributeOptionValue: skuOption.attributeOption.value,
              attribute: {
                id: skuOption.attributeOption.attribute.id,
                name: skuOption.attributeOption.attribute.name,
                description: skuOption.attributeOption.attribute.description ?? '',
              },
            })),
          })),
        })),
        total,
        page: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(total / currentLimit),
      };
    });
  }


  async GetProduct(data: { id: string }): Promise<GetProductResponse | null> {
    const sku = await this.prisma.sku.findUnique({
      where: { id: data.id },
      include: {
        product: {
          include: {
            skus: {
              include: {
                skuOptions: {
                  include: {
                    attributeOption: {
                      include: {
                        attribute: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        skuOptions: {
          include: {
            attributeOption: {
              include: {
                attribute: true,
              },
            },
          },
        },
      },
    });

    if (!sku) return null;

    const product = sku.product;
    if (!product) return null;

    return {
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      brandId: product.brandId ?? '',
      categoryId: product.categoryId ?? '',
      skus: product.skus.map((skuItem) => ({
        id: skuItem.id,
        skuCode: skuItem.skuCode,
        price: Number(skuItem.price),
        stock: skuItem.stock,
        skuOptions: skuItem.skuOptions.map((option) => ({
          attributeOptionId: option.attributeOptionId,
          attributeOptionValue: option.attributeOption.value ?? '',
          attribute: {
            id: option.attributeOption.attribute.id,
            name: option.attributeOption.attribute.name,
            description: option.attributeOption.attribute.description ?? '',
          },
        })),
      })),
    };
  }
  async delete(id: string): Promise<Product> {
    try {
      const deletedProduct = await this.prisma.product.delete({ where: { id } });
      return deletedProduct;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error('Failed to delete product');
    }
  }
  async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    return this.prisma.product.update({ where: { id }, data });
  }
async validateSkuInputs(data: ValidateSkuInputsDto) {
  const items = data?.items ?? [];

  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, invalidSkuCodes: [] };
  }

  // Lấy tất cả productId, skuId và skuCode
  const productIds = Array.from(new Set(items.map(i => i.productId)));
  const skuIds = Array.from(new Set(items.map(i => i.skuId)));

  // 1. Kiểm tra Product có tồn tại không
  const existingProducts = await this.prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true },
  });
  const validProductIds = new Set(existingProducts.map(p => p.id));

  // 2. Lấy tất cả SKU thuộc product
  const skus = await this.prisma.sku.findMany({
    where: {
      id: { in: skuIds },
    },
    select: {
      id: true,
      skuCode: true,
      productId: true,
    },
  });

  // 3. Tạo Map để check nhanh
  const skuMap = new Map<string, boolean>();
  skus.forEach(sku => {
    const key = `${sku.id}-${sku.skuCode}-${sku.productId}`;
    skuMap.set(key, true);
  });

  // 4. Kiểm tra từng item xem hợp lệ không
  const invalidSkuCodes: string[] = [];

  for (const input of items) {
    const { skuId, skuCode, productId } = input;

    // Kiểm tra productId có tồn tại không
    if (!validProductIds.has(productId)) {
      invalidSkuCodes.push(skuCode);
      continue;
    }

    // Kiểm tra skuId, skuCode, productId có đúng không
    const key = `${skuId}-${skuCode}-${productId}`;
    if (!skuMap.has(key)) {
      invalidSkuCodes.push(skuCode);
    }
  }
  console.log('invalidSkuCodes', invalidSkuCodes);
  return {
    valid: invalidSkuCodes.length === 0,
    invalidSkuCodes,
  };
}


}
