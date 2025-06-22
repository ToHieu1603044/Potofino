
import {
  AddToCartRequest,
  AddToCartResponse,
  GetCartRequest,
  GetCartResponse,
  CartServiceControllerMethods,
  CartServiceController,
} from '@auth-microservices/shared/types';
import { Injectable } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-cart.dto';
import { PrismaService } from './prisma/prisma.service';


@Injectable()
@CartServiceControllerMethods()
export class CartGrpcService implements CartServiceController {
  constructor(
    private readonly cartService: CartService,
    private readonly prisma: PrismaService
  ) { }

  async addToCart(data: AddToCartDto): Promise<AddToCartResponse> {
    try {
      const { userId, skuId, quantity, price, itemDetail } = data;
      const detailObj = itemDetail || {};

      const cart = await this.prisma.cart.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });

      const existingItem = await this.prisma.cartItem.findFirst({
        where: { cartId: cart.id, skuId },
      });

      if (existingItem) {
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            skuId,
            quantity,
            price,
            itemDetail: detailObj,
          },
        });
      }

      return {
        message: 'Item added to cart successfully',
      };
    } catch (error) {
      console.error('Error in addToCart:', error);
      throw new Error('Failed to add item to cart');
    }
  }

  async getCart(request: GetCartRequest): Promise<GetCartResponse> {
    return {
      items: [
        {
          productId: "aaaa",
          skuId: 'adkjkfa',
          name: 'akjd',
          image: 'adhk',
          quantity: 1,
          price: 1,
          options: {
            'a': 'b'

          }

        },
      ],
    };
  }
}

