import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { OrderService } from "./order.service";
import { OrderDto } from "./dto/order.dto";
import { GrpcAuthGuard } from "../auth/guard/grpc-auth.guard";

@Controller('orders')
export class OrderController {
    constructor(
        private readonly orderService: OrderService
    ) {}

    @UseGuards(GrpcAuthGuard)
    @Post()
    async handleOrderCreate(@Body() data: OrderDto) {
      return await this.orderService.createOrder(data);
    }
}