import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { AddToCartDto } from './dto/add-cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) { }

  async addToCart(data: AddToCartDto): Promise<boolean> {
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

      return true;
    } catch (error) {
      console.error('Error in addToCart:', error);
      throw new Error('Failed to add item to cart');
    }
  }
}