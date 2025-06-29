import { IEvent } from '@nestjs/cqrs';

export class PermissionRemovedFromRoleEvent implements IEvent {
  constructor(
    public readonly roleId: string,
    public readonly permissionId: string,
    public readonly removedBy?: string,
    public readonly removedAt: Date = new Date(),
  ) {}
}