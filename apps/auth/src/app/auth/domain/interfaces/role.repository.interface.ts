import { RoleAggregate } from "../aggregates/role.aggregate";

export interface IRoleRepository {
  findById(id: string): Promise<RoleAggregate | null>;
  findByName(name: string): Promise<RoleAggregate | null>;
  save(role: RoleAggregate): Promise<RoleAggregate>;
  delete(id: string): Promise<void>;
  countUsersWithRole(roleId: string): Promise<number>;
  countPermissionsForRole(roleId: string): Promise<number>;
}