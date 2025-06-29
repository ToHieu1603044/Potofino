import { v4 as uuidv4 } from 'uuid';

export class UserRoleEntity {
  public readonly id: string;
  public readonly userId: string;
  public readonly roleId: string;
  public readonly assignedAt: Date;
  public readonly assignedBy?: string;
  public readonly expiresAt?: Date;

  private constructor(
    id: string,
    userId: string,
    roleId: string,
    assignedAt: Date,
    assignedBy?: string,
    expiresAt?: Date
  ) {
    this.id = id;
    this.userId = userId;
    this.roleId = roleId;
    this.assignedAt = assignedAt;
    this.assignedBy = assignedBy;
    this.expiresAt = expiresAt;
  }

  static create(
    userId: string,
    roleId: string,
    assignedBy?: string,
    expiresAt?: Date,
    id?: string,
    assignedAt?: Date
  ): UserRoleEntity {
    return new UserRoleEntity(
      id || uuidv4(),
      userId,
      roleId,
      assignedAt || new Date(),
      assignedBy,
      expiresAt
    );
  }

  public isExpired(currentDate: Date = new Date()): boolean {
    return this.expiresAt ? currentDate > this.expiresAt : false;
  }
}
