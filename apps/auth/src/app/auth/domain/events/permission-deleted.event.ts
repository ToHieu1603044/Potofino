import { IEvent } from '@nestjs/cqrs';

export class PermissionDeletedEvent implements IEvent {
  constructor(
    public readonly permissionId: string,
    public readonly permissionName: string,
    public readonly deletedBy?: string, 
    public readonly deletedAt: Date = new Date(),
  ) {}
}