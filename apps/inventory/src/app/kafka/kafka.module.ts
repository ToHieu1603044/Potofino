import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaService } from './kafka.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'inventory-consumer-group',
          },
        },
      },
    ]),
  ],
  providers: [KafkaService],
  exports: [ClientsModule,KafkaService], 
})
export class KafkaModule {}
