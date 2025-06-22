import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);

  private kafka: Kafka;
  private producer: Producer;

  async onModuleInit() {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'nestjs-app',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.producer = this.kafka.producer();
    await this.producer.connect();
    this.logger.log('Kafka producer connected');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    this.logger.log('Kafka producer disconnected');
  }

  async emit(topic: string, message: any) {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
      this.logger.log(`Sent message to topic ${topic}`);
    } catch (error) {
      this.logger.error('Failed to send Kafka message', error);
    }
  }
}
