import {
  ProductServiceClient,
  PRODUCT_SERVICE_NAME,
  GetProductRequest,
  CreateProductRequest,
  GetAllProductsRequest,
  PRODUCT_PACKAGE_NAME,
} from '@auth-microservices/shared/types';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ProductService implements OnModuleInit {
  private productService: ProductServiceClient;

  constructor(
    @Inject(PRODUCT_PACKAGE_NAME) private readonly client: ClientGrpc
  ) {}

  onModuleInit() {
    this.productService =
      this.client.getService<ProductServiceClient>(PRODUCT_SERVICE_NAME);
  }

  async getProduct(id: string) {
    const req: GetProductRequest = { id };
    return lastValueFrom(this.productService.getProduct(req));
  }

  async createProduct(data: CreateProductRequest) {
    return lastValueFrom(this.productService.createProduct(data));
  }

  async getAllProducts(query: GetAllProductsRequest) {
    return lastValueFrom(this.productService.getProducts(query));
  }
}
