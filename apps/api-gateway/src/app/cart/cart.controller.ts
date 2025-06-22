import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';

import { CurrentUser } from '../auth/current-user.decorator';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }

  @Post()
  async addToCart(
    @CurrentUser() user,
    @Req() req,
    data: AddToCartDto,
  ) {
    const userId = user.sub;

    return this.cartService.addToCart(userId, data);
  }

  @Get()
  async getCart(@Req() req) {
    const userId = '11de';
    return this.cartService.getCart(userId);
  }
}
