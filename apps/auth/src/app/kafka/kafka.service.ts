import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaService implements OnModuleInit {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // 🟢 Đăng ký tất cả các topic sẽ dùng `send()` để chờ response
    const topicsToSubscribe = ['user.create'];
    topicsToSubscribe.forEach((topic) => {
      this.kafkaClient.subscribeToResponseOf(topic); // Tự động listen topic + `.reply`
    });

    await this.kafkaClient.connect();
    console.log('[KafkaService] Kafka client initialized');
  }

  send<T = any>(topic: string, message: any) {
    return this.kafkaClient.send<T, any>(topic, message);
  }
}
