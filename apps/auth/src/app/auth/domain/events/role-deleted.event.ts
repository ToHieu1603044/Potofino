import { IEvent } from '@nestjs/cqrs';

export class RoleDeletedEvent implements IEvent {
  constructor(
    public readonly roleId: string,
    public readonly roleName: string,
    public readonly deletedBy?: string,
    public readonly deletedAt: Date = new Date(),
  ) {}
}