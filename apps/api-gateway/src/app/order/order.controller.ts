import { Body, Controller, Post } from "@nestjs/common";
import { OrderService } from "./order.service";
import { OrderDto } from "./dto/order.dto";

@Controller('orders')
export class OrderController {
    constructor(
        private readonly orderService: OrderService
    ) {}

    @Post()
    async handleOrderCreate(@Body() data: OrderDto) {
      return await this.orderService.createOrder(data);
    }
}