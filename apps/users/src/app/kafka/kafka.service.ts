import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

@Injectable()
export class KafkaService implements OnModuleInit {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf('user.create');
    await this.kafkaClient.connect();
    console.log('[KafkaService] Kafka client initialized');
  }

  send(topic: string, message: string) {
    return this.kafkaClient.emit(topic, message);
  }

  subscribeToResponseOf(topic: string) {
    this.kafkaClient.subscribeToResponseOf(topic);
  }
  

}