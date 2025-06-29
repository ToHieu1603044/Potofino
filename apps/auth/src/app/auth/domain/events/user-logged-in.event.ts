import { IEvent } from '@nestjs/cqrs';

export class UserLoggedInEvent implements IEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
    public readonly loggedInAt: Date = new Date(),
  ) {}
}