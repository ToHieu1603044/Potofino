import { AggregateRoot } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';
import { RolePermissionEntity } from '../entities/role-permission.entity';
import { RoleCreatedEvent } from '../events/role-created.event';
import { RoleUpdatedEvent } from '../events/role-updated.event';
import { PermissionAssignedToRoleEvent } from '../events/permission-assigned-to-role.event';
import { PermissionRemovedFromRoleEvent } from '../events/permission-removed-from-role.event';
import { BadRequestException } from '../exceptions/bad-request.exception';
import { ConflictException } from '../exceptions/conflict.exception';
import { NotFoundException } from '../exceptions/not-found.exception';

export interface RoleProps {
  id: string;
  name: string; 
  displayName: string;
  description?: string;
  isActive: boolean;
  isSystem: boolean; 
  createdAt: Date;
  updatedAt: Date;
  rolePermissions: RolePermissionEntity[];
}
export class RoleAggregate extends AggregateRoot {
  private constructor(private props: RoleProps) {
    super();
  }

static create(props: Partial<RoleProps>): RoleAggregate {
  const now = new Date();

  const role = new RoleAggregate({
    id: props.id ?? uuidv4(),
    name: props.name,
    displayName: props.displayName,
    description: props.description,
    isSystem: props.isSystem ?? false,
    isActive: props.isActive ?? true,
    createdAt: props.createdAt ?? now,
    updatedAt: props.updatedAt ?? now,
    rolePermissions: props.rolePermissions ?? [],
  });

  role.apply(new RoleCreatedEvent(role.props.id, role.props.name));
  return role;
}

  getId(): string {
    return this.props.id;
  }

  getName(): string {
    return this.props.name;
  }

  getDisplayName(): string {
    return this.props.displayName;
  }

  getDescription(): string | undefined {
    return this.props.description;
  }

  getIsActive(): boolean {
    return this.props.isActive;
  }

  getIsSystem(): boolean {
    return this.props.isSystem;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  getRolePermissions(): RolePermissionEntity[] {
    return [...this.props.rolePermissions]; 
  }

  /**
   * Updates role details.
   * @param name Optional: New programmatic name.
   * @param displayName Optional: New human-readable name.
   * @param description Optional: New description.
   * @param isActive Optional: New active status.
   */
  updateDetails(
    name?: string,
    displayName?: string,
    description?: string,
    isActive?: boolean,
  ): void {
    if (this.props.isSystem && (name || displayName || description || isActive !== undefined)) {

      if (isActive !== undefined && !this.props.isSystem) { 
         this.props.isActive = isActive;
      }
      if (this.props.isSystem && (name || displayName || description)) {
         throw new BadRequestException('System roles cannot have their name, display name, or description updated.');
      }
    }
    if (name !== undefined) {
      this.props.name = name;
    }
    if (displayName !== undefined) {
      this.props.displayName = displayName;
    }
    if (description !== undefined) {
      this.props.description = description;
    }
    if (isActive !== undefined) { 
      this.props.isActive = isActive;
    }
    this.props.updatedAt = new Date();
    this.apply(new RoleUpdatedEvent(this.props.id, this.props.name, undefined, undefined, {
        name, displayName, description, isActive
    }));
  }


  /**
   * Assigns a permission to this role.
   * Throws ConflictException if permission is already assigned.
   * @param permissionId ID of the permission to assign.
   */
  assignPermission(permissionId: string): void {
    const existingPermission = this.props.rolePermissions.some(
      (rp) => rp.permissionId === permissionId,
    );
    if (existingPermission) {
      throw new ConflictException(
        `Permission with ID ${permissionId} is already assigned to role ${this.props.name}.`,
      );
    }

    const newRolePermission = RolePermissionEntity.create(
      this.props.id,
      permissionId,
    );
    this.props.rolePermissions.push(newRolePermission);
    this.apply(
      new PermissionAssignedToRoleEvent(this.props.id, permissionId),
    );
  }

  /**
   * Removes a permission from this role.
   * Throws NotFoundException if the permission is not assigned.
   * @param permissionId ID of the permission to remove.
   */
  removePermission(permissionId: string): void {
    const initialLength = this.props.rolePermissions.length;
    this.props.rolePermissions = this.props.rolePermissions.filter(
      (rp) => rp.permissionId !== permissionId,
    );
    if (this.props.rolePermissions.length === initialLength) {
      throw new NotFoundException(
        `Permission with ID ${permissionId} not found for role ${this.props.name}.`,
      );
    }
    this.apply(
      new PermissionRemovedFromRoleEvent(this.props.id, permissionId),
    );
  }

  /**
   * Determines if the role can be deleted.
   * Throws BadRequestException if deletion is not allowed due to business rules.
   * @param hasAssociatedUsers True if there are users assigned to this role.
   * @param hasAssociatedPermissions True if there are permissions assigned to this role.
   */
  canBeDeleted(
    hasAssociatedUsers: boolean,
    hasAssociatedPermissions: boolean,
  ): void {
    if (this.props.isSystem) {
      throw new BadRequestException('System roles cannot be deleted.');
    }
    if (hasAssociatedUsers) {
      throw new BadRequestException(
        'Cannot delete role: It is currently assigned to users.',
      );
    }
    if (hasAssociatedPermissions) {
     
      throw new BadRequestException(
        'Cannot delete role: It still has associated permissions. Please remove them first.',
      );
    }
  }
}