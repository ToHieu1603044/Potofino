import { Controller } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ProductGrpcService } from './product.grpc.service';
import {
  ProductServiceControllerMethods,
  ProductServiceController,
  CreateProductRequest,
  CreateProductResponse,
  GetAllProductsRequest,
  GetAllProductsResponse,
  GetProductRequest,
  GetProductResponse,
} from '@auth-microservices/shared/types';
import { GrpcMethod } from '@nestjs/microservices';
import { ValidateSkuInputsDto } from '../dto/validate.sku.dto';

@Controller()
@ProductServiceControllerMethods()
export class ProductGrpcController implements ProductServiceController {
  constructor(
    private readonly productGrpcService: ProductGrpcService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async getProduct(data: GetProductRequest): Promise<GetProductResponse> {
    return this.productGrpcService.getProduct(data);
  }

  async createProduct(data: CreateProductRequest): Promise<CreateProductResponse> {
    return this.productGrpcService.createProduct(data);
  }

  async getProducts(data: GetAllProductsRequest): Promise<GetAllProductsResponse> {
    return this.productGrpcService.getProducts(data);
  }
  async validateSkuInputs(data: ValidateSkuInputsDto) {
    return this.productGrpcService.validateSkuInputs(data);
  }
}
