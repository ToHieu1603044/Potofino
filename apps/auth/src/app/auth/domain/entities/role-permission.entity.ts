import { v4 as uuidv4 } from 'uuid';

export class RolePermissionEntity {
  public readonly id: string;
  public roleId: string;
  public permissionId: string;
  public createdAt: Date;

  private constructor(id: string, roleId: string, permissionId: string, createdAt: Date) {
    this.id = id;
    this.roleId = roleId;
    this.permissionId = permissionId;
    this.createdAt = createdAt;
  }

  static create(roleId: string, permissionId: string, id?: string): RolePermissionEntity {
    return new RolePermissionEntity(id || uuidv4(), roleId, permissionId, new Date());
  }
}