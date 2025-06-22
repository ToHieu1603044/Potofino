import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KafkaService } from '../kafka/kafka.service';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from 'apps/node_modules/.prisma/client-order';
import {
  CreateOrderRequest,
  GetOrderByIdRequest,
  ListOrdersByUserRequest,
  OrderResponse,
  OrderListResponse,
  OrderDetail as OrderDetailType,
  ProductServiceClient,
  InventoryServiceClient,
  PRODUCT_SERVICE_NAME,
  INVENTORY_SERVICE_NAME,
  ValidateSkuInputRequest,
  CheckStockRequest,
} from '@auth-microservices/shared/types';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { status } from '@grpc/grpc-js';
@Injectable()
export class OrderService implements OnModuleInit {
  private productSvc: ProductServiceClient;
  private inventorySvc: InventoryServiceClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaService: KafkaService,
    @Inject('product') private readonly productClient: ClientGrpc,
    @Inject('inventory') private readonly inventoryClient: ClientGrpc,
  ) { }

  onModuleInit() {
    this.productSvc = this.productClient.getService<ProductServiceClient>(PRODUCT_SERVICE_NAME);
    this.inventorySvc = this.inventoryClient.getService<InventoryServiceClient>(INVENTORY_SERVICE_NAME);
  }

  async createOrder(data: CreateOrderRequest): Promise<OrderResponse> {
    const { userId, items, ...info } = data;

    // 1. Kiểm tra đầu vào
    if (!Array.isArray(items) || items.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Order items are required.',
      });
    }

    // 2. Validate SKU từ Product Service
    const validateRes = await lastValueFrom(
      this.productSvc.validateSkuInputs({
        items: items.map(({ skuId, skuCode, productId }) => ({ skuId, skuCode, productId })),
      }),
    );

    if (!validateRes.valid) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: `Invalid SKU(s): ${validateRes.invalidSkuCodes.join(', ')}`,
      });
    }

    // 3. Check tồn kho từ Inventory Service
    const checkStockRes = await lastValueFrom(
      this.inventorySvc.checkStock({
        skuCodes: items.map(i => i.skuCode),
      }),
    );

    const stockItems = checkStockRes.items ?? [];

    if (stockItems.length !== items.length) {
      const foundSkuCodes = new Set(stockItems.map(i => i.skuCode));
      const notFound = items
        .map(i => i.skuCode)
        .filter(code => !foundSkuCodes.has(code));

      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: `Stock not found for SKU(s): ${notFound.join(', ')}`,
      });
    }

    // 4. Kiểm tra từng SKU có đủ tồn kho không
    const stockMap = new Map(stockItems.map(({ skuCode, stock }) => [skuCode, stock]));

    for (const item of items) {
      const available = stockMap.get(item.skuCode);
      if (available == null || available < item.quantity) {
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: `Out of stock for SKU: ${item.skuCode}`,
        });
      }
    }

    // 5. Tính tổng tiền đơn hàng
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 6. Tạo đơn hàng trong DB
    const order = await this.prisma.order.create({
      data: {
        ...info,
        userId,
        code: `ORD-${uuidv4()}`,
        totalAmount: new Prisma.Decimal(totalAmount),
        shippingFee: new Prisma.Decimal(info.shippingFee),
        discount: info.discount ? new Prisma.Decimal(info.discount) : new Prisma.Decimal(0),
        status: 'pending',
        paymentStatus: 'unpaid',
        orderDetails: {
          create: items.map(item => ({
            skuId: item.skuId,
            productId: item.productId,
            skuCode: item.skuCode,
            productName: item.productName,
            productImage: item.productImage,
            quantity: item.quantity,
            price: new Prisma.Decimal(item.price),
            totalPrice: new Prisma.Decimal(item.price * item.quantity),
          })),
        },
      },
      include: {
        orderDetails: true,
      },
    });

    // 7. Gửi Kafka để xóa giỏ hàng
    await this.kafkaService.emit('cart.clear.items', {
      userId,
      skuIds: items.map(i => i.skuId),
    });

    // 8. Trả kết quả đơn hàng
    return this.toOrderResponse(order);
  }


  async getOrderById({ orderId }: GetOrderByIdRequest): Promise<OrderResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { orderDetails: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return this.toOrderResponse(order);
  }

  async listOrdersByUser({ userId }: ListOrdersByUserRequest): Promise<OrderListResponse> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { orderDetails: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      orders: orders.map(this.toOrderResponse),
    };
  }

  private toOrderResponse = (order: any): OrderResponse => ({
    id: order.id,
    userId: order.userId,
    code: order.code,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    shippingFee: Number(order.shippingFee),
    discount: order.discount ? Number(order.discount) : 0,
    note: order.note ?? '',
    receiverName: order.receiverName,
    receiverPhone: order.receiverPhone,
    address: order.address,
    ward: order.ward,
    district: order.district,
    city: order.city,
    orderDetails: order.orderDetails.map((detail: any): OrderDetailType => ({
      id: detail.id,
      skuId: detail.skuId,
      skuCode: detail.skuCode,
      quantity: detail.quantity,
      price: Number(detail.price),
      totalPrice: Number(detail.totalPrice),
      productId: detail.productId,
      productName: detail.productName,
      productImage: detail.productImage,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  });
}
