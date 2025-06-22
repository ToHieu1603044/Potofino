import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CreateProductRequest, CreateProductResponse, GetAllProductsRequest, GetAllProductsResponse, GetProductRequest, GetProductResponse } from '@auth-microservices/shared/types';
import { CreateProductDto } from '../dto/create.product.dto';
import { RedisService } from '../shared/redis/redis.service';
import { KafkaService } from '../shared/kafka/kafka.service';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ProductRepository } from '../repositories/product.repository';
import { CreateProductCommand } from '../command/create.produt.command';
import { FindProductAllQuery } from '../queries/get.all.product.query';
import { GetProductsDto } from '../dto/get.product.dto';
import { ProductServiceController } from '@auth-microservices/shared/types';
import { ValidateSkuInputsQuery } from '../queries/check.sku.input.query';
import { ValidateSkuInputsDto } from '../dto/validate.sku.dto';

@Controller()
export class ProductGrpcService implements ProductServiceController {

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private kafkaService: KafkaService,
    private readonly commnadBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly productRepository: ProductRepository
  ) { }

 async getProduct(data: GetProductRequest): Promise<GetProductResponse> {
    return this.productRepository.GetProduct(data);
  }

  async createProduct(dto: CreateProductRequest): Promise<CreateProductResponse> {
    return this.commnadBus.execute(new CreateProductCommand(dto));
  }

  async getProducts(dto: GetAllProductsRequest): Promise<GetAllProductsResponse> {
    return this.queryBus.execute(new FindProductAllQuery(dto));
  }
  async validateSkuInputs(data:ValidateSkuInputsDto) {
    return this.queryBus.execute(new ValidateSkuInputsQuery(data)); 
  }
}