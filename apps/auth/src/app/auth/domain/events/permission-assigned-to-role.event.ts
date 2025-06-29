import { IEvent } from '@nestjs/cqrs';

export class PermissionAssignedToRoleEvent implements IEvent {
  constructor(
    public readonly roleId: string,
    public readonly permissionId: string,
    public readonly assignedBy?: string,
    public readonly assignedAt: Date = new Date(),
  ) {}
}