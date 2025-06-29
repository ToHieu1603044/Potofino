import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditAction } from './audit-action.enum';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';
import { UserLoggedInEvent } from '../../domain/events/user-logged-in.event';
import { RoleCreatedEvent } from '../../domain/events/role-created.event';
import { RoleUpdatedEvent } from '../../domain/events/role-updated.event';
import { RoleDeletedEvent } from '../../domain/events/role-deleted.event';
import { PermissionCreatedEvent } from '../../domain/events/permission-created.event';
import { PermissionUpdatedEvent } from '../../domain/events/permission-updated.event';
import { PermissionDeletedEvent } from '../../domain/events/permission-deleted.event';
import { RoleAssignedToUserEvent } from '../../domain/events/role-assigned-to-user.event';
import { RoleRemovedFromUserEvent } from '../../domain/events/role-removed-from-user.event';
import { PermissionAssignedToRoleEvent } from '../../domain/events/permission-assigned-to-role.event';
import { PermissionRemovedFromRoleEvent } from '../../domain/events/permission-removed-from-role.event';


type AllDomainEvents =
  | UserRegisteredEvent
  | UserLoggedInEvent
  | RoleCreatedEvent
  | RoleUpdatedEvent
  | RoleDeletedEvent
  | PermissionCreatedEvent
  | PermissionUpdatedEvent
  | PermissionDeletedEvent
  | RoleAssignedToUserEvent
  | RoleRemovedFromUserEvent
  | PermissionAssignedToRoleEvent
  | PermissionRemovedFromRoleEvent;

@Injectable()
@EventsHandler(
  UserRegisteredEvent,
  UserLoggedInEvent,
  RoleCreatedEvent,
  RoleUpdatedEvent,
  RoleDeletedEvent,
  PermissionCreatedEvent,
  PermissionUpdatedEvent,
  PermissionDeletedEvent,
  RoleAssignedToUserEvent,
  RoleRemovedFromUserEvent,
  PermissionAssignedToRoleEvent,
  PermissionRemovedFromRoleEvent,
)
export class AuditLogEventHandler implements IEventHandler<AllDomainEvents> {
  constructor(private readonly prisma: PrismaService) {}

  async handle(event: AllDomainEvents): Promise<void> {
    try {
      let userId: string | null = null;
      let performedBy: string | null = null;
      let action: AuditAction;
      let resource: string;
      let resourceId: string | null = null;
      let oldValues: any | null = null;
      let newValues: any | null = null;

      if (event instanceof UserRegisteredEvent) {
        userId = event.userId;
        performedBy = event.userId;
        action = AuditAction.REGISTER;
        resource = 'user';
        resourceId = event.userId;
        newValues = { email: event.email };
      } else if (event instanceof UserLoggedInEvent) {
        userId = event.userId;
        performedBy = event.userId;
        action = AuditAction.LOGIN;
        resource = 'user';
        resourceId = event.userId;
        newValues = {
          email: event.email,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
        };
      } else if (event instanceof RoleCreatedEvent) {
        performedBy = event.createdBy ?? null;
        action = AuditAction.CREATE;
        resource = 'role';
        resourceId = event.roleId;
        newValues = { name: event.roleName };
      } else if (event instanceof RoleUpdatedEvent) {
        performedBy = event.updatedBy ?? null;
        action = AuditAction.UPDATE;
        resource = 'role';
        resourceId = event.roleId;
        newValues = { name: event.roleName };
      } else if (event instanceof RoleDeletedEvent) {
        performedBy = event.deletedBy ?? null;
        action = AuditAction.DELETE;
        resource = 'role';
        resourceId = event.roleId;
        oldValues = { name: event.roleName };
      } else if (event instanceof PermissionCreatedEvent) {
        performedBy = event.createdBy ?? null;
        action = AuditAction.CREATE;
        resource = 'permission';
        resourceId = event.permissionId;
        newValues = { name: event.permissionName };
      } else if (event instanceof PermissionUpdatedEvent) {
        performedBy = event.updatedBy ?? null;
        action = AuditAction.UPDATE;
        resource = 'permission';
        resourceId = event.permissionId;
        newValues = { name: event.permissionName };
      } else if (event instanceof PermissionDeletedEvent) {
        performedBy = event.deletedBy ?? null;
        action = AuditAction.DELETE;
        resource = 'permission';
        resourceId = event.permissionId;
        oldValues = { name: event.permissionName };
      } else if (event instanceof RoleAssignedToUserEvent) {
        performedBy = event.assignedBy ?? 'system';
        userId = event.userId;
        action = AuditAction.ASSIGN_ROLE;
        resource = 'user_role';
        resourceId = `${event.userId}:${event.roleId}`;
        newValues = {
          userId: event.userId,
          roleId: event.roleId,
          expiresAt: event.expiresAt,
        };
      } else if (event instanceof RoleRemovedFromUserEvent) {
        performedBy = event.removedBy ?? 'system';
        userId = event.userId;
        action = AuditAction.REMOVE_ROLE;
        resource = 'user_role';
        resourceId = `${event.userId}:${event.roleId}`;
        oldValues = {
          userId: event.userId,
          roleId: event.roleId,
        };
      } else if (event instanceof PermissionAssignedToRoleEvent) {
        performedBy = event.assignedBy ?? 'system';
        action = AuditAction.ASSIGN_PERMISSION;
        resource = 'role_permission';
        resourceId = `${event.roleId}:${event.permissionId}`;
        newValues = {
          roleId: event.roleId,
          permissionId: event.permissionId,
        };
      } else if (event instanceof PermissionRemovedFromRoleEvent) {
        performedBy = event.removedBy ?? 'system';
        action = AuditAction.REMOVE_PERMISSION;
        resource = 'role_permission';
        resourceId = `${event.roleId}:${event.permissionId}`;
        oldValues = {
          roleId: event.roleId,
          permissionId: event.permissionId,
        };
      } else {
        console.warn(`[AuditLog] Unhandled event type`);
        return;
      }

      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          resource,
          resourceId,
          oldValues: oldValues ? JSON.stringify(oldValues) : null,
          newValues: newValues ? JSON.stringify(newValues) : null,
        },
      });
    } catch (err) {
      console.error('[AuditLog] Failed to log event:', err);
      // không throw để không ảnh hưởng flow chính
    }
  }
}
