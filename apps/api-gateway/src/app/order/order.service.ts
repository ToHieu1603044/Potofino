import { Inject, Injectable, OnModuleInit, UsePipes } from "@nestjs/common";
import { OrderDto } from "./dto/order.dto";
import { ORDER_PACKAGE_NAME, ORDER_SERVICE_NAME, OrderServiceClient } from "@auth-microservices/shared/types";
import { ClientGrpc } from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";

@Injectable()
export class OrderService implements OnModuleInit {
     private orderClient: OrderServiceClient
    constructor(
       @Inject(ORDER_PACKAGE_NAME) private readonly client: ClientGrpc
    ){}

    onModuleInit() {
        this.orderClient = this.client.getService<OrderServiceClient>(ORDER_SERVICE_NAME);
    }

    async createOrder(data: OrderDto) { 
       return await lastValueFrom(this.orderClient.createOrder(data));
    }
}