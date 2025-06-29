import { IEvent } from '@nestjs/cqrs';

export class PermissionCreatedEvent implements IEvent {
  constructor(
    public readonly permissionId: string,
    public readonly permissionName: string,
    public readonly resource: string,
    public readonly action: string,
    public readonly createdBy?: string, 
    public readonly createdAt: Date = new Date(),
  ) {}
}