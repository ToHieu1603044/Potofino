import { IEvent } from '@nestjs/cqrs';

export class RoleCreatedEvent implements IEvent {
  constructor(
    public readonly roleId: string,
    public readonly roleName: string,
    public readonly createdBy?: string, 
    public readonly createdAt: Date = new Date(),
  ) {}
}