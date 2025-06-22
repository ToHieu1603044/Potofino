export interface KafkaMessage {
  topic: string;
  partition: number;
  timestamp: string;
  size: number;
  offset: string;
  key: string;
  value: any;
}

export interface UserCreatedEvent {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface UserUpdatedEvent {
  userId: string;
  name?: string;
  phone?: string;
  updatedAt: string;
}

export interface UserDeletedEvent {
  userId: string;
  deletedAt: string;
}