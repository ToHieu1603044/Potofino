export class RemovePermissionFromRoleCommand {
  constructor(public readonly roleId: string, public readonly permissionId: string) {}
}