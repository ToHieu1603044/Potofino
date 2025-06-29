import { IEvent } from '@nestjs/cqrs';

export class RoleUpdatedEvent implements IEvent {
  constructor(
    public readonly roleId: string,
    public readonly roleName: string,
    public readonly updatedBy?: string,
    public readonly oldValues?: Record<string, any>, 
    public readonly newValues?: Record<string, any>,
    public readonly updatedAt: Date = new Date(),
  ) {}
}