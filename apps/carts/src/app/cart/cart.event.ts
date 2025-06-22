// src/cart/events/cart.events.ts
import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from '../cart/kafka/kafka.service';

@Injectable()
export class CartEvents {
  private readonly logger = new Logger(CartEvents.name);

  constructor(private readonly kafkaService: KafkaService) {}

  async emitCartUpdatedEvent(userId: string) {
    const eventPayload = { userId, timestamp: new Date().toISOString() };
    try {
      await this.kafkaService.emit('cart.updated', eventPayload);
      this.logger.log(`Emitted cart.updated event for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to emit cart.updated event`, error);
    }
  }
}
