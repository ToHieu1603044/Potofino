import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CartGrpcService } from './cart.grpc.service';
import { AddToCartDto } from './dto/add-cart.dto';

@Controller()
export class CartGrpcController {
  constructor(private readonly cartGrpcService: CartGrpcService) { }

  @GrpcMethod('CartService', 'GetCart')
  async getCart(data: { userId: string }) {
    return this.cartGrpcService.getCart(data);
  }

  @GrpcMethod('CartService', 'AddToCart')
  async addToCart(data:AddToCartDto) {
    return this.cartGrpcService.addToCart(data);
  }
}
