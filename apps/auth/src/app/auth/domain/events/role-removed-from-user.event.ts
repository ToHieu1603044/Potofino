import { IEvent } from '@nestjs/cqrs';

export class RoleRemovedFromUserEvent implements IEvent {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
    public readonly removedBy?: string, 
    public readonly removedAt: Date = new Date(),
  ) {}
}