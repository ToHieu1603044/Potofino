import { PermissionEntity } from '../entities/permission.entity';

export interface IPermissionRepository {
  findById(id: string): Promise<PermissionEntity | null>;
  findByName(name: string): Promise<PermissionEntity | null>;
  findByResourceAndAction(resource: string, action: string): Promise<PermissionEntity | null>;
  save(permission: PermissionEntity): Promise<PermissionEntity>;
  delete(id: string): Promise<void>;
}