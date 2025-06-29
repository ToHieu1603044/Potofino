import { IEvent } from '@nestjs/cqrs';

export class UserRegisteredEvent implements IEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly name: string,
    public readonly firstName: string,
    public readonly lastName: string,
  ) {}
}