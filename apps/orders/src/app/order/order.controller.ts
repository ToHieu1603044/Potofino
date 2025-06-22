import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { OrderService } from './order.service';
import {
  CreateOrderRequest,
  GetOrderByIdRequest,
  ListOrdersByUserRequest,
  OrderResponse,
  OrderListResponse,
} from '@auth-microservices/shared/types';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @GrpcMethod('OrderService', 'createOrder')
  async createOrder(data: CreateOrderRequest): Promise<OrderResponse> {
    console.log('handleOrderCreate', data);
    return this.orderService.createOrder(data);
  }

  @GrpcMethod('OrderService', 'getOrderById')
  async getOrderById(data: GetOrderByIdRequest): Promise<OrderResponse> {
    return this.orderService.getOrderById(data);
  }

  @GrpcMethod('OrderService', 'listOrdersByUser')
  async listOrdersByUser(data: ListOrdersByUserRequest): Promise<OrderListResponse> {
    return this.orderService.listOrdersByUser(data);
  }
}
