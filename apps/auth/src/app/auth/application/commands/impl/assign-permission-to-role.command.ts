export class AssignPermissionToRoleCommand {
  constructor(public readonly roleId: string, public readonly permissionId: string) {}
}