import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';

import {
  CART_PACKAGE_NAME,
  AddToCartRequest,
  AddToCartResponse,
  GetCartRequest,
  GetCartResponse,
  ItemDetail,
  CartServiceClient,
  CART_SERVICE_NAME,
  PRODUCT_SERVICE_NAME,
  PRODUCT_PACKAGE_NAME,
} from '@auth-microservices/shared/types';

import { AddToCartDto } from './dto/add-to-cart.dto';

interface ProductServiceGrpc {
  GetProduct(data: { id: string }): Observable<any>; 
}

@Injectable()
export class CartService implements OnModuleInit {
  private productService: ProductServiceGrpc;
  private cartService: CartServiceClient;

  constructor(
    @Inject(PRODUCT_PACKAGE_NAME) private readonly productClient: ClientGrpc,
    @Inject(CART_PACKAGE_NAME) private readonly cartClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.productService = this.productClient.getService<ProductServiceGrpc>(PRODUCT_SERVICE_NAME);
    this.cartService = this.cartClient.getService<CartServiceClient>(CART_SERVICE_NAME);
  }

  async addToCart(userId: string, data: AddToCartDto): Promise<AddToCartResponse> {
    try {
      const product = await lastValueFrom(
        this.productService.GetProduct({ id: data.skuId })
      );

      const sku = product?.skus?.find((s) => s.id === data.skuId);
      if (!sku) {
        throw new Error('SKU không tìm thấy');
      }

      const {
        price,
        skuOptions,
        skuCode,
        stock,
      } = sku;

      const name: string = product?.name ?? 'Sản phẩm';

      const options: Record<string, string> = {};
      if (Array.isArray(skuOptions)) {
        for (const option of skuOptions) {
          const attributeName = option?.attribute?.name;
          const value = option?.attributeOptionValue;
          if (attributeName && value) {
            options[attributeName] = value;
          }
        }
      } else {
        console.warn('skuOptions is not an array:', skuOptions);
      }

      const itemDetail: ItemDetail = {
        name,
        price,
        skuCode,
        stock,
        options,
      };

      const request: AddToCartRequest = {
        userId,
        skuId: data.skuId,
        quantity: data.quantity,
        price,
        itemDetail,
      };

      return await lastValueFrom(this.cartService.addToCart(request));
    } catch (error) {
      console.error('Add to cart error:', error?.message || error);
      throw error;
    }
  }

  async getCart(userId: string): Promise<GetCartResponse> {
    try {
      const request: GetCartRequest = { userId };
      return await lastValueFrom(this.cartService.getCart(request));
    } catch (error) {
      console.error('Get cart error:', error?.message || error);
      throw error;
    }
  }
}
