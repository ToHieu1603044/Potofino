import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, Client } from '@nestjs/microservices';
import { join } from 'path';
import { Observable } from 'rxjs';
import { Transport } from '@nestjs/microservices';


interface ProductService {
  CreateProduct(data: any): Observable<any>;
  GetProduct(data: { id: string }): Observable<any>;
  GetProducts(data: { page?: number; limit?: number; keyword?: string; brandId?: string; categoryId?: string; sort?: string; }): Observable<any>;
}

@Injectable()
export class GrpcClientService implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'product',
      protoPath: join(__dirname, 'proto/product.proto'),
      url: 'localhost:50051',
    },
  })
  private client: ClientGrpc;

  private productService: ProductService;

  onModuleInit() {
    this.productService = this.client.getService<ProductService>('ProductService');
  }

  getProductService(): ProductService {
    return this.productService;
  }
}
