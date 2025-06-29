import { IEvent } from '@nestjs/cqrs';

export class RoleAssignedToUserEvent implements IEvent {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
    public readonly assignedBy?: string, // ID of the user who assigned the role, or 'system'
    public readonly expiresAt?: Date,
    public readonly assignedAt: Date = new Date(),
  ) {}
}