import { IEvent } from '@nestjs/cqrs';

export class PermissionUpdatedEvent implements IEvent {
  constructor(
    public readonly permissionId: string,
    public readonly permissionName: string, 
    public readonly updatedBy?: string, 
    public readonly oldValues?: Record<string, any>,
    public readonly newValues?: Record<string, any>,
    public readonly updatedAt: Date = new Date(),
  ) {}
}